# -*- coding: utf-8 -*-
"""Aplica ferramentas/escolhas.json de volta em candidatas.json.

A folha de contato (contato.html) devolve uma lista
[{seed, escolhida, arquivo}, ...] — é isso que o botao "Baixar escolhas.json"
grava. Aqui essa lista volta para o candidatas.json, que e o arquivo lido
pelo baixar_imagens.py.

O casamento e feito pelo NOME DO ARQUIVO, nao pelo indice: o repontuar.py
reordena as candidatas de cada vaga, entao um indice anotado ontem pode
apontar para outra foto hoje. O indice so entra em campo quando a folha nao
trouxe o nome.

Vaga cuja escolha mudou tem o JPEG de assets/ apagado, porque o
baixar_imagens.py pula vaga cujo destino ja existe — sem apagar, a foto nova
nunca seria gravada.

Uso:
    python ferramentas/aplicar_escolhas.py                     # aplica
    python ferramentas/aplicar_escolhas.py --seco              # so mostra
    python ferramentas/aplicar_escolhas.py ~/Downloads/escolhas.json
"""
import io
import json
import os
import shutil
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CANDIDATAS = "ferramentas/candidatas.json"
ESCOLHAS = "ferramentas/escolhas.json"


def carregar(caminho):
    if not os.path.exists(caminho):
        raise SystemExit(
            "nao achei %s.\n"
            "Abra ferramentas/contato.html, revise as fotos e clique em\n"
            "\"Baixar escolhas.json\" — depois mova o arquivo para ferramentas/."
            % caminho)
    return json.load(io.open(caminho, encoding="utf-8"))


def indice_da_escolha(vaga, pedido):
    """Devolve (indice, motivo) para o que a folha de contato pediu."""
    arquivo = pedido.get("arquivo")
    if arquivo:
        for i, c in enumerate(vaga["candidatas"]):
            if c["arquivo"] == arquivo:
                return i, None
        return None, "arquivo '%s' nao esta mais entre as candidatas" % arquivo[:45]

    # sem nome: cai no indice, que so vale se a lista nao tiver sido reordenada
    i = pedido.get("escolhida")
    if i is None:
        return None, None                      # vaga recusada de proposito
    if not isinstance(i, int) or not (0 <= i < len(vaga["candidatas"])):
        return None, "indice %r fora da lista de %d candidatas" % (i, len(vaga["candidatas"]))
    return i, None


def main():
    seco = "--seco" in sys.argv
    avulsos = [a for a in sys.argv[1:] if not a.startswith("--")]
    escolhas = carregar(os.path.expanduser(avulsos[0]) if avulsos else ESCOLHAS)
    vagas = carregar(CANDIDATAS)

    por_seed = {v["seed"]: v for v in vagas}
    mudadas, iguais, recusadas, erros = [], 0, [], []

    for pedido in escolhas:
        seed = pedido.get("seed")
        vaga = por_seed.get(seed)
        if vaga is None:
            erros.append((seed, "seed nao existe no manifesto"))
            continue

        novo, motivo = indice_da_escolha(vaga, pedido)
        if motivo:
            erros.append((seed, motivo))
            continue

        antigo = vaga.get("escolhida")
        if novo == antigo:
            iguais += 1
            continue

        de = vaga["candidatas"][antigo]["arquivo"] if antigo is not None else "(nenhuma)"
        para = vaga["candidatas"][novo]["arquivo"] if novo is not None else "(recusada)"
        vaga["escolhida"] = novo
        (recusadas if novo is None else mudadas).append((seed, de, para, vaga["destino"]))

    for seed, de, para, destino in mudadas + recusadas:
        print("  %-28s %s\n  %-28s -> %s" % (seed, de[:46], "", para[:46]))
        if os.path.exists(destino) and not seco:
            os.remove(destino)                 # forca o baixar_imagens a refazer

    print("\n%d escolhas trocadas, %d recusadas, %d sem mudanca, %d com problema"
          % (len(mudadas), len(recusadas), iguais, len(erros)))
    for seed, msg in erros:
        print("   ERRO %-28s %s" % (seed, msg))

    if seco:
        print("\n--seco: nada foi gravado.")
        return
    if not mudadas and not recusadas:
        print("candidatas.json ja estava igual — nada a gravar.")
        return

    shutil.copyfile(CANDIDATAS, CANDIDATAS + ".bak")
    tmp = CANDIDATAS + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        json.dump(vagas, f, ensure_ascii=False, indent=1)
    os.replace(tmp, CANDIDATAS)                # troca atomica: nunca meio gravado
    print("gravado em %s (copia do anterior em %s.bak)" % (CANDIDATAS, CANDIDATAS))
    print("agora rode:  python ferramentas/baixar_imagens.py")


if __name__ == "__main__":
    main()
