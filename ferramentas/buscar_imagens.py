# -*- coding: utf-8 -*-
"""Busca candidatas no Wikimedia Commons para cada vaga do manifesto.

Escreve ferramentas/candidatas.json. Pode ser interrompido e retomado.

Duas fontes de candidatas, nessa ordem de preferência:

1. CATEGORIAS — o Commons tem categorias curadas por lugar e por assunto
   ("Category:Serra do Rio do Rastro"). É de longe a fonte mais limpa.
2. BUSCA TEXTUAL — complementa, mas puxa muito PDF e livro digitalizado,
   porque o Commons indexa o texto dentro deles.

As candidatas são pontuadas (orientação, resolução, palavra-chave no nome)
e as suspeitas de não serem fotografia levam penalidade.

A API devolve HTTP 429 em rajada, então há pausa entre chamadas e um
User-Agent identificando o projeto, como pede a política da Wikimedia.
"""
import io
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

API = "https://commons.wikimedia.org/w/api.php"
UA = ("TerraCatarinense/1.0 (projeto escolar IFMT Varzea Grande; "
      "https://github.com/krukki/terra-catarinense)")
PAUSA = 1.3
MANIFESTO = "ferramentas/imagens.json"
SAIDA = "ferramentas/candidatas.json"

LICENCAS_OK = re.compile(r"^(cc0|cc-by|cc-by-sa|pd|public domain|no restriction)", re.I)
EXT_OK = (".jpg", ".jpeg", ".png", ".webp")

# Nomes que quase nunca são a fotografia que queremos
SUSPEITO = re.compile(
    r"(\.pdf|\.djvu|\.svg|\.tif|page[ _-]?\d|livro|jornal|relat[oó]rio|"
    r"plano de manejo|bras[aã]o|coat of arms|flag|bandeira|logo|mapa|map of|"
    r"seal|selo postal|stamp|diagram|gr[aá]fico|chart|cartaz|poster|"
    r"painting|pintura|gravura|engraving|rmg |manuscript)", re.I)


def chamar(params):
    params = dict(params, format="json", action="query")
    url = API + "?" + urllib.parse.urlencode(params, encoding="utf-8")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                espera = 5 * (tentativa + 1)
                print("    429 - esperando %ds" % espera)
                time.sleep(espera)
                continue
            raise
        except Exception:
            if tentativa == 3:
                raise
            time.sleep(3)
    return None


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn").lower()


def limpar(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def buscar_arquivos(termo, limite=10):
    d = chamar({"list": "search", "srsearch": termo,
                "srnamespace": 6, "srlimit": limite})
    time.sleep(PAUSA)
    return [x["title"] for x in (d or {}).get("query", {}).get("search", [])]


def buscar_categoria(termo, limite=2):
    d = chamar({"list": "search", "srsearch": termo,
                "srnamespace": 14, "srlimit": limite})
    time.sleep(PAUSA)
    return [x["title"] for x in (d or {}).get("query", {}).get("search", [])]


def arquivos_da_categoria(cat, limite=40):
    d = chamar({"list": "categorymembers", "cmtitle": cat,
                "cmtype": "file", "cmlimit": limite})
    time.sleep(PAUSA)
    return [x["title"] for x in (d or {}).get("query", {}).get("categorymembers", [])]


def detalhar(titulos):
    saida = {}
    for i in range(0, len(titulos), 50):
        d = chamar({"prop": "imageinfo", "iiprop": "url|size|extmetadata",
                    "titles": "|".join(titulos[i:i + 50])})
        time.sleep(PAUSA)
        for pg in (d or {}).get("query", {}).get("pages", {}).values():
            ii = (pg.get("imageinfo") or [None])[0]
            if not ii:
                continue
            em = ii.get("extmetadata", {})
            pega = lambda k: limpar((em.get(k) or {}).get("value", ""))
            saida[pg["title"]] = {
                "titulo": pg["title"],
                "arquivo": pg["title"].replace("File:", ""),
                "largura": ii.get("width", 0),
                "altura": ii.get("height", 0),
                "bytes": ii.get("size", 0),
                "pagina": ii.get("descriptionurl", ""),
                "autor": pega("Artist") or "(nao informado)",
                "licenca": pega("LicenseShortName"),
                "licenca_id": pega("License"),
                "termos": pega("UsageTerms"),
                "descricao": pega("ImageDescription")[:300],
                "atribuicao_exigida": pega("AttributionRequired").lower() == "true",
            }
    return saida


def serve(c, vaga):
    if not c["arquivo"].lower().endswith(EXT_OK):
        return False
    if not LICENCAS_OK.match(c["licenca_id"] or c["licenca"] or ""):
        return False
    if c["largura"] < vaga["largura"] or c["altura"] < vaga["altura"]:
        return False
    return True


def pontuar(c, vaga, palavras):
    """Maior é melhor. Orientação pesa mais que resolução."""
    p = 0.0

    # orientação: recortar retrato para uma vaga deitada joga fora
    # metade da foto, então casar a orientação vale muito
    prop_vaga = vaga["largura"] / vaga["altura"]
    prop_foto = c["largura"] / c["altura"]
    if (prop_vaga >= 1) == (prop_foto >= 1):
        p += 30
    p -= min(20, abs(math.log(prop_foto / prop_vaga)) * 20)

    # resolução, com retorno decrescente
    p += min(15, math.log(c["largura"] * c["altura"] / 1e5 + 1) * 5)

    # palavra-chave do assunto no nome ou na descrição
    texto = sem_acento(c["arquivo"] + " " + c["descricao"])
    p += sum(6 for w in palavras if w in texto)

    if SUSPEITO.search(c["arquivo"]):
        p -= 60
    if "santa catarina" in texto or " sc " in texto or "brasil" in texto:
        p += 8
    return p


def main():
    vagas = json.load(io.open(MANIFESTO, encoding="utf-8"))
    feito = {}
    if os.path.exists(SAIDA):
        feito = {v["seed"]: v for v in json.load(io.open(SAIDA, encoding="utf-8"))}

    resultado = []
    for i, vaga in enumerate(vagas, 1):
        antigo = feito.get(vaga["seed"])
        if antigo and antigo.get("versao") == 2:
            resultado.append(antigo)
            continue

        print("[%2d/%d] %s" % (i, len(vagas), vaga["seed"]))
        titulos = []

        # 1. categorias
        for termo in vaga["busca"][:1]:
            for cat in buscar_categoria(termo):
                for t in arquivos_da_categoria(cat):
                    if t not in titulos:
                        titulos.append(t)

        # 2. busca textual, como complemento
        for termo in vaga["busca"]:
            for t in buscar_arquivos(termo):
                if t not in titulos:
                    titulos.append(t)

        detalhes = detalhar(titulos) if titulos else {}
        palavras = [w for w in sem_acento(" ".join(vaga["busca"])).split()
                    if len(w) > 3]

        boas = [c for c in detalhes.values() if serve(c, vaga)]
        for c in boas:
            c["pontos"] = round(pontuar(c, vaga, palavras), 1)
        boas.sort(key=lambda c: -c["pontos"])

        print("     %d validas de %d encontradas" % (len(boas), len(titulos)))
        item = dict(vaga)
        item["versao"] = 2
        item["candidatas"] = boas[:6]
        resultado.append(item)

        io.open(SAIDA, "w", encoding="utf-8").write(
            json.dumps(resultado, ensure_ascii=False, indent=1))

    # --- escolha final, sem repetir a mesma foto em duas vagas ---
    usados = set()
    for item in resultado:
        item["escolhida"] = None
        for k, c in enumerate(item["candidatas"]):
            if c["titulo"] not in usados:
                item["escolhida"] = k
                usados.add(c["titulo"])
                break

    io.open(SAIDA, "w", encoding="utf-8").write(
        json.dumps(resultado, ensure_ascii=False, indent=1))

    vazias = [x["seed"] for x in resultado if x["escolhida"] is None]
    print("\n%d/%d vagas com foto escolhida" % (len(resultado) - len(vazias), len(resultado)))
    if vazias:
        print("SEM CANDIDATA: " + ", ".join(vazias))


if __name__ == "__main__":
    main()
