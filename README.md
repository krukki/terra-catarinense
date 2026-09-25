# Terra Catarinense

Site educativo sobre o estado de Santa Catarina.

**Aluno:** Ronaldo Heitor Marques de Oliveira
**Turma:** 4 INF — Técnico em Informática
**Disciplina:** Front-End
**Instituto:** IFMT — Campus Várzea Grande

---

## 1. O que é o projeto

Site educativo e turístico que apresenta Santa Catarina de forma completa e visual:
geografia, clima, história da colonização, cidades e regiões, cultura, gastronomia,
turismo e economia. O público-alvo são estudantes, turistas e público em geral, por
isso a linguagem é simples, direta e ilustrada.

Feito com HTML5 semântico, CSS puro (Flexbox e CSS Grid) e JavaScript vanilla.
Não usa nenhum framework nem biblioteca externa (sem React, Bootstrap ou Tailwind)
e não precisa de nenhuma etapa de build.

## 2. Como abrir o site

Basta dar dois cliques no arquivo `index.html`. Ele abre no navegador padrão e o site
funciona por completo, inclusive o menu, o banner rotativo, o atlas interativo, o
quiz, a galeria com filtro e os cards que viram.

Não é necessário instalar nada, rodar servidor nem compilar.

> **Observação:** as fotos ficam na pasta `assets/`, então elas aparecem mesmo sem
> internet. Só as fontes (Google Fonts) vêm da rede: sem conexão o site continua
> funcionando, com as fontes substitutas do sistema.

Se quiser abrir com um servidor local (opcional), dentro da pasta do projeto:

```bash
python -m http.server 8000
```

e depois acessar <http://localhost:8000> no navegador.

## 3. Estrutura de pastas

```text
terra-catarinense/
├── index.html .............. Página inicial: banner rotativo, "Sobre Santa
│                             Catarina", mapa + números do estado, cidades em
│                             destaque, painel "Duas Santa Catarinas",
│                             economia e prévia das curiosidades.
├── cidades.html ............ Cidades e regiões + ATLAS INTERATIVO: zoom nas
│                             seis regiões, camada de clima e "Monte seu
│                             roteiro" com distância entre as cidades.
├── cultura.html ............ Cultura e imigração + LINHA DO TEMPO animada
│                             conforme a rolagem da página.
├── panorama.html ........... Geografia e clima, gastronomia típica e economia
│                             do estado, com tabelas de dados.
├── turismo.html ............ Geografia, clima, vegetação, fauna, roteiros e
│                             GALERIA DE FOTOS COM FILTRO por categoria.
├── curiosidades.html ....... Cards com EFEITO FLIP, QUIZ "Qual Santa
│                             Catarina é a sua?", arquitetura enxaimel e os
│                             créditos das fotos.
├── css/
│   └── style.css ........... Toda a estilização, organizada em seções
│                             comentadas (reset, variáveis de cor, tema
│                             escuro, header, banner, cards, timeline,
│                             galeria, flip cards, footer, media queries).
├── js/
│   └── script.js ........... Todo o JavaScript, em módulos comentados
│                             (menu, tema claro/escuro, banner, flip, atlas,
│                             timeline, galeria, scroll-reveal, voltar ao
│                             topo, ano do rodapé, passaporte e quiz).
├── assets/ ................. As 58 fotos do site, cada uma ja gravada no
│   │                         tamanho exato em que aparece na pagina
│   ├── favicon.svg ......... Ícone da aba (selo circular "SC" em terracota)
│   ├── mapa-sc.svg ......... Contorno do estado usado no rodapé
│   ├── litoral/ ............ Fotos de praias e do litoral
│   ├── serra/ .............. Fotos da serra, araucárias e geada
│   ├── cidades/ ............ Fotos de Florianópolis, Blumenau, etc.
│   ├── cultura/ ............ Fotos de festas, imigração e arquitetura
│   └── gastronomia/ ........ Fotos de pratos típicos
├── ferramentas/ ............ Scripts Python que buscaram, baixaram e
│                             recortaram as fotos (ver a seção 6). Não
│                             fazem parte do site: podem ser apagados sem
│                             quebrar nada.
├── cfonts/ ................. Prints das páginas de onde saíram as fotos
│                             escolhidas à mão, para conferir a origem.
└── README.md ............... Este arquivo
```

Cada foto em `assets/` já está gravada exatamente no tamanho dos atributos
`width` e `height` da tag que a usa, para o navegador reservar o espaço certo e
a página não dar solavanco enquanto carrega.

## 4. Identidade visual — "Atlas de campo"

O site imita um atlas geográfico impresso: papel com textura, fios finos no
lugar de sombras, seções numeradas ("01 — Mapa interativo") e rótulos em fonte
monoespaçada, como as legendas de uma prancha cartográfica. As curvas de nível
atrás dos títulos e a textura do papel são SVG escrito direto no CSS, sem
nenhum arquivo de imagem a mais.

Paleta (definida em `:root`, no início do `style.css`):

| Cor | Hex | Papel |
| --- | --- | --- |
| Papel de atlas | `#F3EEE4` | fundo |
| Tinta | `#1B1F1D` | texto e fios |
| Azul Oceano | `#1F4E5F` | cor principal |
| Verde Araucária | `#3F5B3A` | cor secundária |
| Terracota Enxaimel | `#B5452B` | cor de destaque |

Tipografia (Google Fonts):

| Fonte | Uso |
| --- | --- |
| Fraunces | títulos e destaques em itálico |
| Inter | texto corrido |
| JetBrains Mono | etiquetas, legendas, dados e botões |

Todas as cores do site são variáveis CSS no `:root`. O tema escuro ("carta
náutica noturna") só redefine essas variáveis — nenhum componente precisa saber
que ele existe. O botão de tema fica no cabeçalho e a escolha é guardada no
navegador; sem escolha, o site segue a preferência do sistema operacional.
Todas as combinações de texto e fundo passam no contraste AA da WCAG, nos dois
temas.

## 4b. Diferenciais

| # | Diferencial | Onde |
| --- | --- | --- |
| 1 | **Atlas interativo**: mapa com relevo, oceano, graticulado, rosa dos ventos e escala gráfica. Clicar numa região aproxima o mapa (animação do `viewBox`), acende os pinos das 28 cidades e troca o painel com foto e dados. Setas do teclado andam entre regiões vizinhas; Esc volta ao estado inteiro. A escala gráfica se ajusta sozinha ao zoom. | `cidades.html` |
| 2 | **Camada de clima**: os botões Verão/Inverno repintam as regiões pela temperatura média, com legenda — "praia de manhã, neve à tarde" em forma de dado. | `cidades.html` |
| 3 | **Monte seu roteiro**: no modo roteiro, clicar nos pinos (ou escolher na lista) cria paradas; o mapa traça a rota e soma a distância em linha reta (fórmula de haversine). O roteiro fica salvo no navegador. | `cidades.html` |
| 4 | **Quiz "Qual Santa Catarina é a sua?"**: cinco perguntas, uma por vez; o resultado leva ao atlas já aproximado na região (`cidades.html?regiao=serra#mapa`). | `curiosidades.html` |
| 5 | **Passaporte catarinense**: cada página visitada e o quiz rendem um carimbo no rodapé. | todas as páginas |
| 6 | Linha do tempo animada, galeria com filtro, flip cards, painel "Duas Santa Catarinas" e banner rotativo (já existiam, agora no visual novo). | várias |

Os pinos das cidades são posicionados pela latitude e longitude reais, com a
mesma projeção do contorno do estado (`x = 20 + (lon + 53,84) / 5,49 × 485`,
`y = 20 + (−25,95 − lat) / 3,4 × 340`, conferida com a posição da capital).

## 5. Acessibilidade

- Todas as imagens têm atributo `alt` descritivo.
- Tamanhos de fonte em `rem`, permitindo zoom do navegador.
- Um único `h1` por página e hierarquia `h2`/`h3`/`h4` em cascata.
- Link "pular para o conteúdo principal" como primeiro item tabulável.
- Foco visível (`:focus-visible`) em todos os elementos interativos.
- Atlas, quiz, roteiro, galeria, banner e flip cards funcionam por teclado.
- Links com texto descritivo — nenhum "clique aqui".
- Tags semânticas: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.
- Respeita a preferência `prefers-reduced-motion` do sistema.
- Mobile-first, testado a partir de 360px de largura.
- Tema claro e escuro, seguindo `prefers-color-scheme` quando o usuário não escolhe
  manualmente.
- Sem JavaScript o site continua utilizável: o menu nasce fechado no celular e vira
  barra de navegação no desktop, e o painel de regiões já vem preenchido no HTML.
- Alvos de toque de no mínimo 24x24px (WCAG 2.5.8).

## 6. Fotos e créditos

As 58 fotos do site vêm do **Wikimedia Commons**, sob licenças livres (Creative
Commons e domínio público). As licenças CC BY e CC BY-SA exigem creditar quem fez
a foto, e por isso `curiosidades.html` tem a seção **Créditos das fotos**, com o
arquivo, o autor e a licença de cada uma. O rodapé de todas as páginas tem link
para ela.

Os scripts que fizeram esse trabalho estão em `ferramentas/`, nesta ordem:

| Script | O que faz |
| --- | --- |
| `manifesto.py` | monta a lista das 58 vagas: tamanho, texto `alt` e termos de busca |
| `buscar_imagens.py` | procura candidatas no Commons, por categoria e por texto |
| `repontuar.py` | repontua dando peso ao vínculo com Santa Catarina |
| `contato.py` | gera uma folha de contato para conferir foto por foto no navegador |
| `aplicar_escolhas.py` | devolve as escolhas da folha para o `candidatas.json` |
| `baixar_imagens.py` | baixa e recorta no tamanho exato de cada vaga |
| `trocar_html.py` | troca os endereços no HTML e gera a lista de créditos |

Dez fotos não vieram do Commons: foram escolhidas à mão em sites de turismo,
de notícia e de enciclopédia. A origem de cada uma está em
`ferramentas/fontes_manuais.json`, e os prints das páginas em `cfonts/`. O
`trocar_html.py` lê esse arquivo ao montar os créditos, então essas fontes não
se perdem quando a lista é gerada de novo:

```bash
python ferramentas/trocar_html.py --creditos
```

> **Atenção:** dessas dez, só a foto da Catedral de Chapecó tem licença livre
> declarada (CC BY-SA 4.0). As outras são material protegido, usado aqui como
> trabalho escolar e com a origem creditada — creditar não é o mesmo que ter
> licença de uso.

Para trocar alguma foto: abra `ferramentas/contato.html` (gerado pelo `contato.py`),
escolha outra opção, salve o `escolhas.json` em `ferramentas/` e rode

```bash
python ferramentas/aplicar_escolhas.py
python ferramentas/baixar_imagens.py
```

Se a lista de fotos mudar, rode o `trocar_html.py` de novo e cole a lista nova de
`ferramentas/creditos.html` na seção de créditos.

## 7. O que ainda precisa ser conferido antes da entrega

- [ ] **Dados do IBGE:** conferir e atualizar população, área, PIB, IDH e número de
      habitantes de cada cidade em
      [cidades.ibge.gov.br/brasil/sc/panorama](https://cidades.ibge.gov.br/brasil/sc/panorama).
- [ ] **Temperaturas:** conferir as médias climáticas no INMET (as tabelas de
      `turismo.html` e a camada de clima do atlas, no objeto `REGIOES` do
      `script.js`, usam valores aproximados).
- [ ] **Textos:** revisão final de ortografia e concordância com o professor.
