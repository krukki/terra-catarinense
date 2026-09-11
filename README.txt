===============================================================================
TERRA CATARINENSE — site educativo sobre o estado de Santa Catarina
===============================================================================

Aluno.....: Ronaldo Heitor Marques de Oliveira
Turma.....: 4 INF — Técnico em Informática
Disciplina: Front-End
Instituto.: IFMT — Campus Várzea Grande

-------------------------------------------------------------------------------
1. O QUE É O PROJETO
-------------------------------------------------------------------------------
Site educativo e turístico que apresenta Santa Catarina de forma completa e
visual: geografia, clima, história da colonização, cidades e regiões, cultura,
gastronomia, turismo e economia. O público-alvo são estudantes, turistas e
público em geral, por isso a linguagem é simples, direta e ilustrada.

Feito com HTML5 semântico, CSS puro (Flexbox e CSS Grid) e JavaScript vanilla.
Não usa nenhum framework nem biblioteca externa (sem React, Bootstrap ou
Tailwind) e não precisa de nenhuma etapa de build.

-------------------------------------------------------------------------------
2. COMO ABRIR O SITE
-------------------------------------------------------------------------------
Basta dar dois cliques no arquivo "index.html". Ele abre no navegador padrão e
o site funciona por completo, inclusive o menu, o banner rotativo, o mapa
interativo, a galeria com filtro e os cards que viram.

Não é necessário instalar nada, rodar servidor nem compilar.

Observação: as fotos e as fontes (Google Fonts) são carregadas da internet.
Sem conexão, o site continua funcionando, mas aparece sem imagens e com as
fontes substitutas do sistema.

Se quiser abrir com um servidor local (opcional), dentro da pasta do projeto:
    python -m http.server 8000
e depois acessar http://localhost:8000 no navegador.

-------------------------------------------------------------------------------
3. ESTRUTURA DE PASTAS
-------------------------------------------------------------------------------
projeto-santa-catarina/
├── index.html .............. Página inicial: banner rotativo, "Sobre Santa
│                             Catarina", mapa + números do estado, cidades em
│                             destaque, painel "Duas Santa Catarinas",
│                             economia e prévia das curiosidades.
├── cidades.html ............ Cidades e regiões + MAPA INTERATIVO das seis
│                             regiões (clique numa região e o painel troca).
├── cultura.html ............ Cultura e imigração + LINHA DO TEMPO animada
│                             conforme a rolagem da página.
├── turismo.html ............ Geografia, clima, vegetação, fauna, roteiros e
│                             GALERIA DE FOTOS COM FILTRO por categoria.
├── curiosidades.html ....... Cards com EFEITO FLIP, gastronomia típica,
│                             arquitetura enxaimel e as fontes de pesquisa.
├── css/
│   └── style.css ........... Toda a estilização, organizada em 19 seções
│                             comentadas (reset, variáveis de cor, header,
│                             banner, cards, timeline, galeria, flip cards,
│                             footer, media queries).
├── js/
│   └── script.js ........... Todo o JavaScript, em 10 módulos comentados
│                             (menu, banner, flip, mapa, timeline, galeria,
│                             scroll-reveal, voltar ao topo).
├── assets/
│   ├── litoral/ ............ Fotos de praias e do litoral
│   ├── serra/ .............. Fotos da serra, araucárias e geada
│   ├── cidades/ ............ Fotos de Florianópolis, Blumenau, etc.
│   └── gastronomia/ ........ Fotos de pratos típicos
└── README.txt .............. Este arquivo

As pastas de assets estão vazias (só com um arquivo .gitkeep) porque todas as
imagens do site usam, por enquanto, placeholders do serviço picsum.photos.

-------------------------------------------------------------------------------
4. IDENTIDADE VISUAL
-------------------------------------------------------------------------------
Paleta (definida em :root, no início do style.css):
    Azul Atlântico ..... #0E7C9C   (cor principal)
    Verde Araucária .... #2F6B3A   (cor secundária)
    Vermelho Enxaimel .. #C1272D   (cor de destaque)
    Branco Neve ........ #FAF9F6   (fundo)
    Cinza Grafite ...... #2E2E2E   (texto)

Tipografia (Google Fonts):
    Montserrat ..... títulos
    Nunito Sans .... texto corrido
    Caveat ......... selos e "Você sabia?"

-------------------------------------------------------------------------------
5. ACESSIBILIDADE
-------------------------------------------------------------------------------
- Todas as imagens têm atributo alt descritivo.
- Tamanhos de fonte em rem, permitindo zoom do navegador.
- Um único h1 por página e hierarquia h2/h3/h4 em cascata.
- Link "pular para o conteúdo principal" como primeiro item tabulável.
- Foco visível (:focus-visible) em todos os elementos interativos.
- Mapa interativo, galeria, banner e flip cards funcionam por teclado.
- Links com texto descritivo — nenhum "clique aqui".
- Tags semânticas: header, nav, main, section, article, aside, footer.
- Respeita a preferência "prefers-reduced-motion" do sistema.
- Mobile-first, testado a partir de 360px de largura.

-------------------------------------------------------------------------------
6. O QUE AINDA PRECISA SER SUBSTITUÍDO ANTES DA ENTREGA
-------------------------------------------------------------------------------
[ ] FOTOS: trocar todas as URLs de picsum.photos por fotos próprias ou de
    banco de imagens livre, salvas em assets/. No HTML, cada ponto de troca
    está marcado com um comentário "TROCAR:".
[ ] DADOS DO IBGE: conferir e atualizar população, área, PIB, IDH e número de
    habitantes de cada cidade em cidades.ibge.gov.br/brasil/sc/panorama.
[ ] TEMPERATURAS: conferir as médias climáticas no INMET (as tabelas de
    turismo.html usam valores aproximados).
[ ] TEXTOS: revisão final de ortografia e concordância com o professor.


