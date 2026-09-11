# -*- coding: utf-8 -*-
"""Gera ferramentas/contato.html — a folha de contato para aprovação.

Mostra, para cada uma das 58 vagas: a foto escolhida, o texto alt que ela
precisa honrar, autor e licença, e as alternativas. Clicar numa alternativa
troca a escolha; o botão no topo copia o resultado para colar de volta.

A escolha é gravada em ferramentas/escolhas.json pelo botão "baixar".
"""
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CANDIDATAS = "ferramentas/candidatas.json"
SAIDA = "ferramentas/contato.html"


def miniatura(arquivo, largura=320):
    import urllib.parse
    return ("https://commons.wikimedia.org/wiki/Special:FilePath/"
            + urllib.parse.quote(arquivo) + "?width=%d" % largura)


def escapar(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def main():
    vagas = json.load(io.open(CANDIDATAS, encoding="utf-8"))
    dados = []
    for v in vagas:
        dados.append({
            "seed": v["seed"],
            "pagina": v["pagina"],
            "destino": v["destino"],
            "largura": v["largura"],
            "altura": v["altura"],
            "alt": v["alt"],
            "incerta": v.get("incerta", False),
            "escolhida": v.get("escolhida"),
            "candidatas": [{
                "arquivo": c["arquivo"],
                "url": miniatura(c["arquivo"], 200),
                "pagina": c["pagina"],
                "autor": c["autor"],
                "licenca": c["licenca"],
                "descricao": c["descricao"][:160],
                "dim": "%dx%d" % (c["largura"], c["altura"]),
            } for c in v["candidatas"]],
        })

    com = sum(1 for d in dados if d["escolhida"] is not None)
    html = HTML.replace("__DADOS__", json.dumps(dados, ensure_ascii=False))
    html = html.replace("__RESUMO__", "%d de %d vagas com foto" % (com, len(dados)))
    io.open(SAIDA, "w", encoding="utf-8").write(html)
    print("%s gerado — %d/%d vagas com foto" % (SAIDA, com, len(dados)))


HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contato-prova — imagens do Terra Catarinense</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:1.5rem; font:15px/1.5 system-ui, sans-serif;
         background:#12171a; color:#e7ecee; }
  h1 { margin:0 0 .25rem; font-size:1.4rem; }
  .topo { position:sticky; top:0; z-index:5; background:#12171a;
          padding:.75rem 0 1rem; border-bottom:1px solid #2a3940; margin-bottom:1.5rem; }
  .acoes { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; margin-top:.6rem; }
  button { font:inherit; padding:.45rem .9rem; border-radius:.4rem; border:1px solid #4fb3d0;
           background:transparent; color:#8fd3e8; cursor:pointer; }
  button:hover { background:#14303b; }
  .grade { display:grid; gap:1.25rem;
           grid-template-columns:repeat(auto-fill, minmax(330px,1fr)); }
  .vaga { border:1px solid #2a3940; border-radius:.6rem; padding:.85rem; background:#18232a; }
  .vaga.semfoto { border-color:#f07076; }
  .vaga.incerta { border-color:#d8a24a; }
  .vaga h2 { font-size:.85rem; margin:0 0 .1rem; font-family:ui-monospace,monospace; color:#8fd3e8; }
  .meta { font-size:.72rem; color:#a7b4ba; margin-bottom:.5rem; }
  .escolha img { width:100%; aspect-ratio:var(--prop); object-fit:cover;
                 border-radius:.35rem; background:#22303a; display:block; }
  .alt { font-size:.76rem; color:#c8d2d6; margin:.5rem 0; font-style:italic;
         border-left:2px solid #4fb3d0; padding-left:.5rem; }
  .credito { font-size:.7rem; color:#a7b4ba; word-break:break-word; }
  .credito a { color:#8fd3e8; }
  .verAlts { margin-top:.5rem; font-size:.72rem; padding:.25rem .6rem; }
  .alts { display:flex; gap:.3rem; margin-top:.5rem; flex-wrap:wrap; }
  .alts img { width:56px; height:42px; object-fit:cover; border-radius:.2rem;
              cursor:pointer; border:2px solid transparent; background:#22303a; }
  .alts img.sel { border-color:#4fb3d0; }
  .alts img:hover { border-color:#8fd3e8; }
  .vazio { padding:2rem .5rem; text-align:center; color:#f07076; font-size:.85rem; }
  .tag { display:inline-block; font-size:.65rem; padding:.1rem .4rem; border-radius:.2rem;
         background:#35191b; color:#f7a3a7; margin-left:.3rem; }
  .tag.inc { background:#3a2f17; color:#e8c37a; }
  textarea { width:100%; height:120px; font:12px ui-monospace,monospace;
             background:#0d1316; color:#e7ecee; border:1px solid #2a3940;
             border-radius:.4rem; padding:.5rem; margin-top:.75rem; }
</style>
</head>
<body>
<div class="topo">
  <h1>Contato-prova — imagens do Terra Catarinense</h1>
  <div class="meta">__RESUMO__ · clique numa miniatura pequena para trocar a escolha ·
    vermelho = sem foto · amarelo = assunto difícil, confira com atenção</div>
  <div class="acoes">
    <button onclick="copiar()">Copiar escolhas</button>
    <button onclick="baixar()">Baixar escolhas.json</button>
    <button onclick="marcarTudoOk()">Aprovar todas como estão</button>
    <span id="aviso" class="meta"></span>
  </div>
  <textarea id="saida" readonly placeholder="As escolhas aparecem aqui depois de copiar/baixar"></textarea>
</div>
<div class="grade" id="grade"></div>
<script>
const DADOS = __DADOS__;

function card(v, i) {
  const el = document.createElement('div');
  el.className = 'vaga' + (v.escolhida === null ? ' semfoto' : (v.incerta ? ' incerta' : ''));
  const c = v.escolhida !== null ? v.candidatas[v.escolhida] : null;
  el.innerHTML = `
    <h2>${v.seed}${v.incerta ? '<span class="tag inc">difícil</span>' : ''}
        ${v.escolhida === null ? '<span class="tag">sem foto</span>' : ''}</h2>
    <div class="meta">${v.pagina} · ${v.largura}×${v.altura} · ${v.destino}</div>
    <div class="escolha" style="--prop:${v.largura}/${v.altura}">
      ${c ? `<img loading="lazy" src="../${v.destino}" alt="">` : '<div class="vazio">nenhuma candidata passou no filtro</div>'}
    </div>
    <p class="alt">precisa mostrar: ${v.alt}</p>
    <div class="credito" id="cred${i}"></div>
    <button class="verAlts" onclick="mostrarAlts(${i}, this)">ver ${v.candidatas.length} alternativas</button>
    <div class="alts" id="alts${i}"></div>`;
  return el;
}

function pintarCredito(i) {
  const v = DADOS[i];
  const d = document.getElementById('cred' + i);
  if (v.escolhida === null) { d.textContent = ''; return; }
  const c = v.candidatas[v.escolhida];
  d.innerHTML = `<a href="${c.pagina}" target="_blank" rel="noopener">${c.arquivo}</a>
     · ${c.dim}<br>${c.autor} — ${c.licenca}
     ${c.descricao ? '<br><span style="opacity:.7">' + c.descricao + '</span>' : ''}`;
}

function mostrarAlts(i, botao) {
  botao.remove();
  document.getElementById('alts' + i).dataset.aberto = '1';
  pintarAlts(i);
}

function pintarAlts(i) {
  const v = DADOS[i];
  const d = document.getElementById('alts' + i);
  if (!d.dataset.aberto) return;   // só depois de pedir
  d.innerHTML = '';
  v.candidatas.forEach((c, k) => {
    const im = document.createElement('img');
    im.src = c.url; im.loading = 'lazy'; im.title = c.arquivo + ' — ' + c.autor;
    if (k === v.escolhida) im.className = 'sel';
    im.onclick = () => {
      v.escolhida = k;
      const alvo = document.querySelector('#g' + i + ' .escolha img');
      if (alvo) alvo.src = c.url;   // previa remota ate refazer o recorte
      else document.querySelector('#g' + i + ' .escolha').innerHTML =
        `<img src="${c.url}" alt="">`;
      pintarCredito(i); pintarAlts(i);
    };
    d.appendChild(im);
  });
}

const grade = document.getElementById('grade');
DADOS.forEach((v, i) => {
  const el = card(v, i); el.id = 'g' + i; grade.appendChild(el);
  pintarCredito(i);
});

function resultado() {
  return JSON.stringify(DADOS.map(v => ({
    seed: v.seed,
    escolhida: v.escolhida,
    arquivo: v.escolhida !== null ? v.candidatas[v.escolhida].arquivo : null
  })), null, 1);
}
function copiar() {
  const t = document.getElementById('saida');
  t.value = resultado(); t.select(); document.execCommand('copy');
  document.getElementById('aviso').textContent = 'copiado';
}
function baixar() {
  const b = new Blob([resultado()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'escolhas.json'; a.click();
  document.getElementById('saida').value = resultado();
  document.getElementById('aviso').textContent = 'baixado — mova para ferramentas/';
}
function marcarTudoOk() {
  document.getElementById('saida').value = resultado();
  document.getElementById('aviso').textContent = 'nada a mudar — pode avisar que está aprovado';
}
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
