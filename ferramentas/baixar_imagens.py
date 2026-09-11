# -*- coding: utf-8 -*-
"""Baixa as fotos escolhidas do Commons e grava nas dimensões exatas da vaga.

Por que recortar aqui e não confiar no Commons: o Special:FilePath?width=
entrega a imagem já reduzida, mas nunca recortada — o farol de Laguna vem
960x1446 (retrato) para uma vaga 800x500 (deitada). Gerar exatamente as
dimensões dos atributos width/height do HTML é o que mantém o CLS
protegido.

Uso:
    python ferramentas/baixar_imagens.py            # só o que falta
    python ferramentas/baixar_imagens.py --refazer  # todos de novo
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from PIL import Image, ImageOps
except ImportError:
    raise SystemExit("Pillow nao instalado. Rode:  pip install Pillow")

UA = ("TerraCatarinense/1.0 (projeto escolar IFMT Varzea Grande; "
      "https://github.com/krukki/terra-catarinense)")
CANDIDATAS = "ferramentas/candidatas.json"
CACHE = "ferramentas/_cache"
QUALIDADE = 82
PAUSA = 0.6

# Ao recortar a altura, ancorar um pouco acima do centro: em paisagem o
# assunto costuma ficar no terço superior, e o centro geométrico corta céu
# demais em cima e chão demais embaixo.
ANCORA_V = 0.42


def baixar(arquivo, largura):
    os.makedirs(CACHE, exist_ok=True)
    destino = os.path.join(CACHE, "%d_%s" % (largura, arquivo.replace("/", "_")))
    if os.path.exists(destino) and os.path.getsize(destino) > 1000:
        return destino
    url = ("https://commons.wikimedia.org/wiki/Special:FilePath/"
           + urllib.parse.quote(arquivo) + "?width=%d" % largura)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r, open(destino, "wb") as f:
        f.write(r.read())
    time.sleep(PAUSA)
    return destino


def recortar(origem, destino, larg, alt):
    im = Image.open(origem)
    im = ImageOps.exif_transpose(im)          # respeita a rotação da câmera
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")

    prop_alvo = larg / alt
    w, h = im.size
    if w / h > prop_alvo:                      # sobra largura: corta dos lados
        nova_w = int(round(h * prop_alvo))
        esq = (w - nova_w) // 2
        caixa = (esq, 0, esq + nova_w, h)
    else:                                      # sobra altura: corta em cima/baixo
        nova_h = int(round(w / prop_alvo))
        topo = int(round((h - nova_h) * ANCORA_V))
        caixa = (0, topo, w, topo + nova_h)

    im = im.crop(caixa).resize((larg, alt), Image.LANCZOS)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    im.save(destino, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)
    return os.path.getsize(destino)


def main():
    refazer = "--refazer" in sys.argv
    vagas = json.load(io.open(CANDIDATAS, encoding="utf-8"))

    feitos, pulados, erros, total_bytes = 0, 0, [], 0
    for v in vagas:
        if v.get("escolhida") is None:
            pulados += 1
            continue
        if os.path.exists(v["destino"]) and not refazer:
            total_bytes += os.path.getsize(v["destino"])
            continue

        c = v["candidatas"][v["escolhida"]]
        try:
            bruto = baixar(c["arquivo"], max(v["largura"] * 2, 1200))
            n = recortar(bruto, v["destino"], v["largura"], v["altura"])
            total_bytes += n
            feitos += 1
            print("  ok   %-42s %4d KB  <- %s"
                  % (v["destino"], n // 1024, c["arquivo"][:40]))
        except Exception as e:
            erros.append((v["seed"], str(e)[:70]))
            print("  ERRO %-42s %s" % (v["destino"], str(e)[:60]))

    print("\n%d gravadas, %d vagas sem foto escolhida, %d erros" %
          (feitos, pulados, len(erros)))
    print("peso total em assets/: %.1f MB" % (total_bytes / 1024 / 1024))
    for seed, msg in erros:
        print("  ", seed, msg)


if __name__ == "__main__":
    main()
