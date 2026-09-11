# -*- coding: utf-8 -*-
"""Troca as URLs do picsum pelas fotos definitivas de assets/ nas paginas.

O vinculo entre a vaga e a tag <img> e o seed da URL
("https://picsum.photos/seed/floripa-centro/800/500" -> vaga "floripa-centro"),
o mesmo criterio usado pelo manifesto.py. Nada depende de numero de linha,
entao o HTML pode ter sido editado desde ontem.

Antes de trocar, cada vaga passa por tres conferencias — se alguma falhar, a
vaga fica como esta e aparece no relatorio:

1. o arquivo existe em assets/;
2. as dimensoes pedidas na URL batem com as do manifesto (sao as mesmas dos
   atributos width/height da tag, que e o que segura o CLS);
3. o JPEG gravado tem exatamente essas dimensoes (precisa do Pillow; sem ele
   a conferencia e pulada).

Uso:
    python ferramentas/trocar_html.py --seco      # so mostra o que faria
    python ferramentas/trocar_html.py             # troca
    python ferramentas/trocar_html.py --limpar    # troca e tira os <!-- TROCAR: -->

As paginas estao no git, entao da para desfazer tudo com:
    git checkout -- *.html
"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MANIFESTO = "ferramentas/imagens.json"
CANDIDATAS = "ferramentas/candidatas.json"
MANUAIS = "ferramentas/fontes_manuais.json"
CREDITOS = "ferramentas/creditos.html"

PICSUM = re.compile(r"https://picsum\.photos/seed/([A-Za-z0-9_-]+)/(\d+)/(\d+)")
# so comentario que ocupa a linha inteira: os de bloco (varias linhas)
# explicam a secao e sao removidos a mao.
COMENTARIO_TROCAR = re.compile(r"^[ \t]*<!--[^\n]*TROCAR:[^\n]*-->[ \t]*\r?\n",
                               re.MULTILINE)

try:
    from PIL import Image
except ImportError:
    Image = None


def dimensoes(caminho):
    if Image is None:
        return None
    with Image.open(caminho) as im:
        return im.size


def main():
    seco = "--seco" in sys.argv
    limpar = "--limpar" in sys.argv

    if "--creditos" in sys.argv:      # so regera a lista, sem tocar no HTML
        creditos()
        return

    vagas = {v["seed"]: v for v in json.load(io.open(MANIFESTO, encoding="utf-8"))}
    paginas = sorted({v["pagina"] for v in vagas.values()})

    trocadas, problemas, usadas = 0, [], []

    for pagina in paginas:
        if not os.path.exists(pagina):
            problemas.append((pagina, "pagina do manifesto nao existe"))
            continue

        # newline="" nos dois lados: o projeto tem paginas em LF e
        # paginas em CRLF, e converter uma delas viraria um diff inteiro.
        html = io.open(pagina, encoding="utf-8", newline="").read()
        contador = [0]

        def troca(m):
            seed, larg, alt = m.group(1), int(m.group(2)), int(m.group(3))
            v = vagas.get(seed)
            if v is None:
                problemas.append((seed, "seed sem vaga no manifesto (%s)" % pagina))
                return m.group(0)
            if not os.path.exists(v["destino"]):
                problemas.append((seed, "falta %s — rode baixar_imagens.py" % v["destino"]))
                return m.group(0)
            if (larg, alt) != (v["largura"], v["altura"]):
                problemas.append((seed, "HTML pede %dx%d, manifesto diz %dx%d"
                                  % (larg, alt, v["largura"], v["altura"])))
                return m.group(0)
            real = dimensoes(v["destino"])
            if real is not None and real != (v["largura"], v["altura"]):
                problemas.append((seed, "%s esta %dx%d, deveria ser %dx%d"
                                  % (v["destino"], real[0], real[1],
                                     v["largura"], v["altura"])))
                return m.group(0)

            contador[0] += 1
            usadas.append(v)
            return v["destino"]

        novo = PICSUM.sub(troca, html)
        if limpar:
            novo = COMENTARIO_TROCAR.sub("", novo)

        if novo != html and not seco:
            with io.open(pagina, "w", encoding="utf-8", newline="") as f:
                f.write(novo)

        restantes = len(PICSUM.findall(novo))
        trocadas += contador[0]
        print("  %-20s %2d trocadas%s" % (pagina, contador[0],
              ("  (%d ainda no picsum)" % restantes) if restantes else ""))

    print("\n%d de %d vagas trocadas%s"
          % (trocadas, len(vagas), " (--seco: nada gravado)" if seco else ""))

    for seed, msg in problemas:
        print("   PROBLEMA %-28s %s" % (seed, msg))

    sobrando = []
    for pagina in paginas:
        if not os.path.exists(pagina):
            continue
        for n, linha in enumerate(io.open(pagina, encoding="utf-8"), 1):
            if "TROCAR:" in linha:
                sobrando.append("%s:%d" % (pagina, n))
    if sobrando:
        print("\ncomentarios TROCAR ainda no HTML (%d): %s"
              % (len(sobrando), ", ".join(sobrando)))
        if not limpar:
            print("  --limpar tira os que ocupam a linha inteira; os de bloco sao a mao.")

    if usadas and not seco:
        creditos()


def creditos():
    """Grava o trecho de creditos das fotos.

    O Commons e quase todo CC BY / CC BY-SA: a licenca exige creditar autor,
    licenca e obra. As fotos escolhidas a mao, de fora do Commons, ficam em
    fontes_manuais.json e entram aqui no lugar da candidata do Commons — sem
    isso, regerar a lista apagaria o credito delas.

    A lista sai do manifesto inteiro, e nao das vagas trocadas nesta rodada,
    para dar para regerar a qualquer momento com --creditos.
    """
    if not os.path.exists(CANDIDATAS):
        print("\n(sem candidatas.json — creditos nao gerados)")
        return

    escolhas = {}
    for v in json.load(io.open(CANDIDATAS, encoding="utf-8")):
        if v.get("escolhida") is not None:
            escolhas[v["seed"]] = v["candidatas"][v["escolhida"]]

    manuais = {}
    if os.path.exists(MANUAIS):
        manuais = {k: v for k, v in json.load(io.open(MANUAIS, encoding="utf-8")).items()
                   if not k.startswith("_")}

    itens = []
    for v in json.load(io.open(MANIFESTO, encoding="utf-8")):
        m = manuais.get(v["seed"])
        if m:
            detalhe = m["credito"]
            if m.get("licenca"):
                detalhe += " (%s)" % m["licenca"]
            else:
                detalhe += " — material protegido, usado como trabalho escolar"
            itens.append((m["arquivo"], m["titulo"], m.get("fonte", ""), detalhe))
            continue
        c = escolhas.get(v["seed"])
        if c is None:
            continue
        itens.append((v["destino"], os.path.splitext(c["arquivo"])[0], c["pagina"],
                      "%s, via Wikimedia Commons (%s)" % (c["autor"], c["licenca"])))

    linhas, vistos = [], set()
    for arquivo, titulo, fonte, detalhe in sorted(itens):
        if arquivo in vistos:
            continue
        vistos.add(arquivo)
        nome = ('<a href="%s" rel="external noopener" target="_blank">%s</a>'
                % (escapar(fonte), escapar(titulo))) if fonte else escapar(titulo)
        linhas.append(
            '          <li>\n'
            '            %s\n'
            '            <p>%s — %s.</p>\n'
            '          </li>' % (nome, escapar(arquivo), escapar(detalhe)))

    trecho = (
        "<!-- Creditos das fotos — gerado por ferramentas/trocar_html.py.\n"
        "     Cole dentro da secao #creditos de curiosidades.html. Nao edite\n"
        "     aqui: este arquivo e reescrito toda vez que o script roda.\n"
        "     Para regerar sem tocar no HTML:\n"
        "         python ferramentas/trocar_html.py --creditos -->\n"
        '        <ul class="fontes fontes--creditos revelar">\n%s\n        </ul>\n'
        % "\n".join(linhas))

    with io.open(CREDITOS, "w", encoding="utf-8") as f:
        f.write(trecho)
    print("\ncreditos de %d fotos em %s (%d fora do Commons)."
          % (len(linhas), CREDITOS, len(manuais)))


def escapar(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


if __name__ == "__main__":
    main()
