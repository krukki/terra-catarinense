# -*- coding: utf-8 -*-
"""Gera ferramentas/imagens.json — o manifesto das 58 vagas de imagem.

A chave de cada vaga é o seed da URL do picsum (ex.: "sc-serra-geada"):
é único, estável, e não muda quando o HTML é editado — ao contrário do
número da linha.
"""
import io
import json
from collections import Counter

# seed -> (pasta, nome do arquivo, termos de busca no Commons)
VAGAS = {
    # --- cidades ---------------------------------------------------------
    "floripa-centro": ("cidades", "florianopolis",
        ["Florianópolis centro vista", "Florianópolis orla baía"]),
    "floripa-ponte": ("cidades", "florianopolis-ponte",
        ["Ponte Hercílio Luz Florianópolis", "Hercílio Luz bridge aerial"]),
    "bc-orla-noite": ("cidades", "balneario-camboriu",
        ["Balneário Camboriú noite", "Balneário Camboriú skyline"]),
    "bc-predios-praia": ("cidades", "balneario-camboriu-praia",
        ["Balneário Camboriú praia central", "Balneário Camboriú beach buildings"]),
    "gal-bc-teleferico": ("cidades", "bc-teleferico",
        ["Teleférico Balneário Camboriú", "Parque Unipraias"]),
    "blumenau-rua-xv": ("cidades", "blumenau",
        ["Blumenau Rua XV de Novembro", "Blumenau centro histórico"]),
    "blumenau-enxaimel": ("cidades", "blumenau-enxaimel",
        ["Blumenau enxaimel Fachwerk", "Blumenau arquitetura alemã"]),
    "gal-blumenau-centro": ("cidades", "blumenau-centro",
        ["Blumenau Prefeitura torre relógio", "Castelinho Blumenau"]),
    "pomerode-casa-alema": ("cidades", "pomerode",
        ["Pomerode casa enxaimel", "Pomerode Fachwerk"]),
    "sc-pomerode-casa": ("cidades", "pomerode-jardim",
        ["Pomerode casa alemã jardim", "Pomerode arquitetura"]),
    "enxaimel-pomerode-casa": ("cidades", "enxaimel-pomerode",
        ["Pomerode enxaimel casa", "Fachwerkhaus Pomerode"]),
    "sc-enxaimel-detalhe": ("cidades", "enxaimel-detalhe",
        ["enxaimel detalhe fachada Santa Catarina", "Fachwerk detail Brazil"]),
    "cur-pomerode-lingua": ("cidades", "pomerode-placa",
        ["Pomerode placa rua", "Pomerode street sign"]),
    "joinville-industria": ("cidades", "joinville",
        ["Joinville avenida centro", "Joinville vista cidade"]),
    "chapeco-campo": ("cidades", "chapeco",
        ["Chapecó Santa Catarina vista", "Chapecó agricultura"]),
    "laguna-centro-historico": ("cidades", "laguna",
        ["Laguna Santa Catarina centro histórico", "Laguna casario colonial"]),
    "sc-laguna-farol": ("cidades", "laguna-farol",
        ["Farol Santa Marta Laguna", "Farol de Santa Marta"]),
    "rot-vale-europeu": ("cidades", "vale-europeu",
        ["Vale Europeu Santa Catarina", "Timbó Santa Catarina centro"]),
    "gal-ponte-hercilio": ("cidades", "ponte-hercilio-luz",
        ["Ponte Hercílio Luz iluminada", "Hercílio Luz bridge night"]),
    # --- serra -----------------------------------------------------------
    "urubici-morro": ("serra", "urubici",
        ["Urubici Morro da Igreja", "Urubici Santa Catarina paisagem"]),
    "sao-joaquim-macieira": ("serra", "sao-joaquim",
        ["São Joaquim macieira pomar", "São Joaquim Santa Catarina maçã"]),
    "cur-neve-urupema": ("serra", "urupema-neve",
        ["Urupema neve", "neve Santa Catarina campo"]),
    "sc-neve-serra": ("serra", "neve-serra",
        ["neve São Joaquim Santa Catarina", "snow Santa Catarina Brazil"]),
    "sc-serra-estrada": ("serra", "serra-estrada",
        ["Serra do Rio do Rastro", "Serra do Rio do Rastro curvas"]),
    "gal-rio-do-rastro": ("serra", "rio-do-rastro",
        ["Serra do Rio do Rastro mirante", "Serra do Rio do Rastro estrada"]),
    "gal-morro-da-igreja": ("serra", "morro-da-igreja",
        ["Morro da Igreja Pedra Furada", "Pedra Furada Urubici"]),
    "sc-araucaria-campo": ("serra", "araucarias-campo",
        ["Araucaria angustifolia campo Santa Catarina", "campos de altitude araucária"]),
    "gal-araucarias-geada": ("serra", "araucarias-geada",
        ["araucária geada", "Araucaria angustifolia frost"]),
    "sc-serra-geada": ("serra", "serra-geada",
        ["geada campos de altitude Santa Catarina", "frost Santa Catarina highlands"]),
    "rot-serra-inverno": ("serra", "serra-inverno",
        ["estrada rural campos de altitude Santa Catarina", "inverno serra catarinense"]),
    "cur-vinho-altitude": ("serra", "vinho-altitude",
        ["vinhedo São Joaquim Santa Catarina", "vinícola altitude Santa Catarina"]),
    # --- litoral ---------------------------------------------------------
    "sc-litoral-praia": ("litoral", "litoral-praia",
        ["praia Santa Catarina litoral", "Santa Catarina beach coast"]),
    "sc-praia-verao": ("litoral", "praia-verao",
        ["praia Florianópolis verão", "praia Santa Catarina coqueiros"]),
    "cur-praias-500": ("litoral", "praias-aereo",
        ["Florianópolis costa aérea", "Santa Catarina coastline aerial"]),
    "gal-joaquina": ("litoral", "joaquina",
        ["Praia da Joaquina dunas", "Praia da Joaquina Florianópolis"]),
    "gal-bombinhas": ("litoral", "bombinhas",
        ["Bombinhas Santa Catarina praia", "Bombinhas enseada"]),
    "gal-guarda-embau": ("litoral", "guarda-do-embau",
        ["Guarda do Embaú", "Praia da Guarda do Embaú"]),
    "rot-praias": ("litoral", "trilha-praia",
        ["trilha costeira Florianópolis", "Lagoinha do Leste"]),
    "cur-ostra-cultivo": ("litoral", "ostras-cultivo",
        ["cultivo de ostras Santa Catarina", "maricultura Florianópolis"]),
    "cur-boto-laguna": ("litoral", "boto-laguna",
        ["boto pescador Laguna", "dolphin fishermen Laguna Brazil"]),
    "cur-tordesilhas-laguna": ("litoral", "marco-tordesilhas",
        ["marco de Tordesilhas Laguna", "Laguna Santa Catarina marco"]),
    "sc-acoriano-casario": ("litoral", "acoriano-casario",
        ["Ribeirão da Ilha Florianópolis casario", "arquitetura açoriana Santa Catarina"]),
    # --- gastronomia -----------------------------------------------------
    "sc-ostras-prato": ("gastronomia", "ostras-prato",
        ["ostras servidas prato", "oysters served plate"]),
    "gal-ostras": ("gastronomia", "ostras-bandeja",
        ["ostras frescas limão", "fresh oysters lemon"]),
    "prato-ostras-gratinadas": ("gastronomia", "ostras-gratinadas",
        ["ostras gratinadas", "gratinated oysters"]),
    "prato-cuca-farofa": ("gastronomia", "cuca",
        ["cuca bolo alemão Brasil", "Streuselkuchen"]),
    "gal-cuca": ("gastronomia", "cuca-fatia",
        ["cuca fatia bolo", "Streuselkuchen slice"]),
    "prato-marreco": ("gastronomia", "marreco",
        ["marreco recheado Santa Catarina", "pato assado repolho roxo"]),
    "prato-sequencia-camarao": ("gastronomia", "camarao",
        ["sequência de camarão", "camarão frito prato Brasil"]),
    "prato-pinhao-entrevero": ("gastronomia", "entrevero",
        ["entrevero panela de ferro", "pinhão panela carne"]),
    "gal-pinhao": ("gastronomia", "pinhao",
        ["pinhão cozido panela", "pinhão araucária semente"]),
    "prato-polenta-galeto": ("gastronomia", "polenta-galeto",
        ["polenta frita galeto", "galeto polenta prato"]),
    # --- cultura ---------------------------------------------------------
    "sc-mata-atlantica-indigena": ("cultura", "mata-atlantica",
        ["Mata Atlântica trilha Santa Catarina", "Atlantic Forest trail Brazil"]),
    "sc-imigracao-alema-1829": ("cultura", "imigracao-alema",
        ["colonização alemã Santa Catarina casa", "São Pedro de Alcântara Santa Catarina"]),
    "sc-blumenau-1850": ("cultura", "blumenau-historico",
        ["Blumenau histórico século XIX", "Blumenau antiga fotografia"]),
    "sc-italianos-videira": ("cultura", "italianos-videira",
        ["parreiral Santa Catarina colonização italiana", "vinhedo Videira Santa Catarina"]),
    "sc-festa-tipica": ("cultura", "festa-tipica",
        ["Oktoberfest Blumenau trajes", "dança folclórica alemã Brasil"]),
    "cur-bolshoi": ("cultura", "bolshoi",
        ["Escola Bolshoi Joinville", "bailarinos ensaio Joinville"]),
}

# Vagas sem foto literal provável no Commons — marcadas na contato-prova
# para decisão caso a caso.
INCERTAS = {
    "cur-tordesilhas-laguna", "cur-bolshoi", "sc-imigracao-alema-1829",
    "sc-blumenau-1850", "sc-mata-atlantica-indigena", "sc-italianos-videira",
    "cur-vinho-altitude", "prato-cuca-farofa", "gal-cuca", "prato-marreco",
    "prato-sequencia-camarao", "prato-polenta-galeto",
}


def main():
    bruto = json.load(io.open("ferramentas/_bruto.json", encoding="utf-8"))

    faltando = [v["seed"] for v in bruto if v["seed"] not in VAGAS]
    if faltando:
        raise SystemExit("sem destino definido: " + ", ".join(faltando))

    saida = []
    for v in bruto:
        pasta, nome, termos = VAGAS[v["seed"]]
        saida.append({
            "seed": v["seed"],
            "pagina": v["pagina"],
            "destino": "assets/%s/%s.jpg" % (pasta, nome),
            "largura": v["largura"],
            "altura": v["altura"],
            "alt": v["alt"],
            "busca": termos,
            "incerta": v["seed"] in INCERTAS,
        })

    destinos = [x["destino"] for x in saida]
    dup = sorted({d for d in destinos if destinos.count(d) > 1})
    if dup:
        raise SystemExit("destinos duplicados: " + ", ".join(dup))

    io.open("ferramentas/imagens.json", "w", encoding="utf-8").write(
        json.dumps(saida, ensure_ascii=False, indent=1))

    print("%d vagas, %d destinos unicos, %d marcadas como incertas"
          % (len(saida), len(set(destinos)), sum(x["incerta"] for x in saida)))
    for pasta, n in sorted(Counter(d.split("/")[1] for d in destinos).items()):
        print("  assets/%-12s %d" % (pasta, n))


if __name__ == "__main__":
    main()
