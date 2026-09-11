# -*- coding: utf-8 -*-
"""Repontua as candidatas já baixadas, sem novas chamadas à API.

Motivo: a primeira versão do bônus geográfico procurava " sc " com espaços
e não reconhecia "URUBICI-SC" nem "Florianópolis". Resultado: numa vaga de
campos de altitude catarinenses, uma foto de Itatiaia (Rio de Janeiro)
ganhou de quatro fotos de Urubici.

Aqui o vínculo com Santa Catarina passa a valer muito, e qualquer indício
de outro estado brasileiro passa a penalizar.
"""
import io
import json
import math
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARQ = "ferramentas/candidatas.json"

SC = re.compile(
    r"(santa catarina|\bsc\b|[-_(,. ]sc[-_),. ]|catarinense|"
    r"florianopolis|blumenau|pomerode|joinville|laguna|urubici|urupema|"
    r"chapeco|camboriu|bombinhas|embau|sao joaquim|videira|timbo|itajai|"
    r"garopaba|palhoca|brusque|jaragua|criciuma|tubarao|lages|"
    r"rio do rastro|morro da igreja|pedra furada|joaquina|unipraias|"
    r"hercilio luz|ribeirao da ilha|lagoinha do leste)", re.I)

# Outros estados/países que costumam aparecer e não servem quando a vaga
# é explicitamente catarinense
FORA = re.compile(
    r"(itatiaia|minas gerais|\bmg\b|rio de janeiro|\brj\b|sao paulo|\bsp\b|"
    r"parana|\bpr\b|rio grande do sul|\brs\b|bahia|amazonas|goias|"
    r"massachusetts|australia|nsw|csiro|portugal|espanha|alemanha|germany|"
    r"poland|polska|slaski|china|japan|iran|navy|nmmp)", re.I)

SUSPEITO = re.compile(
    r"(\.pdf|\.djvu|page[ _-]?\d|livro|jornal|brasao|coat of arms|flag|"
    r"bandeira|logo|mapa|map of|stamp|diagram|grafico|cartaz|poster|"
    r"painting|pintura|gravura|engraving|carrack|rmg |museum|museu)", re.I)


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn").lower()


def pontuar(c, vaga, palavras, exige_sc):
    p = 0.0
    prop_vaga = vaga["largura"] / vaga["altura"]
    prop_foto = c["largura"] / c["altura"]
    if (prop_vaga >= 1) == (prop_foto >= 1):
        p += 30
    p -= min(20, abs(math.log(prop_foto / prop_vaga)) * 20)
    p += min(15, math.log(c["largura"] * c["altura"] / 1e5 + 1) * 5)

    texto = sem_acento(c["arquivo"] + " " + c["descricao"])
    p += sum(6 for w in palavras if w in texto)

    if SC.search(texto):
        p += 40 if exige_sc else 15
    elif exige_sc:
        p -= 25
    if FORA.search(texto):
        p -= 45 if exige_sc else 15
    if SUSPEITO.search(texto):
        p -= 70
    return round(p, 1)


def main():
    vagas = json.load(io.open(ARQ, encoding="utf-8"))
    trocas = []

    for v in vagas:
        # comida é comida em qualquer lugar; lugar tem de ser o lugar certo
        exige_sc = not v["destino"].startswith("assets/gastronomia/")
        palavras = [w for w in sem_acento(" ".join(v["busca"])).split() if len(w) > 3]

        antes = v["candidatas"][v["escolhida"]]["arquivo"] if v.get("escolhida") is not None else None
        for c in v["candidatas"]:
            c["pontos"] = pontuar(c, v, palavras, exige_sc)
        v["candidatas"].sort(key=lambda c: -c["pontos"])
        v["exige_sc"] = exige_sc
        v["escolhida"] = 0 if v["candidatas"] else None
        depois = v["candidatas"][0]["arquivo"] if v["candidatas"] else None
        if antes != depois:
            trocas.append((v["seed"], antes, depois))

    # sem repetir a mesma foto em duas vagas
    usados = set()
    for v in vagas:
        v["escolhida"] = None
        for k, c in enumerate(v["candidatas"]):
            if c["titulo"] not in usados:
                v["escolhida"] = k
                usados.add(c["titulo"])
                break

    io.open(ARQ, "w", encoding="utf-8").write(
        json.dumps(vagas, ensure_ascii=False, indent=1))

    print("%d escolhas mudaram:\n" % len(trocas))
    for seed, a, b in trocas:
        print("  %-24s %s\n  %-24s -> %s\n" % (seed, (a or "-")[:56], "", (b or "-")[:56]))
    sem = [v["seed"] for v in vagas if v["escolhida"] is None]
    print("vagas sem escolha: %d %s" % (len(sem), sem or ""))


if __name__ == "__main__":
    main()
