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

Feito **só com HTML5 semântico e CSS puro** — esta versão não tem nenhuma linha de
JavaScript. Tudo o que é interativo (menu, tema, banner, atlas, quiz, calendário,
comparador...) usa controles nativos do HTML (rádios, checkboxes, `<select>`,
âncoras e `popover`) e CSS moderno (`:has()`, `:target`, `@property`, style
queries, animações guiadas pela rolagem e funções matemáticas como `sin()` e
`sqrt()`). Não usa nenhum framework nem biblioteca externa e não precisa de
nenhuma etapa de build.

## 2. Como abrir o site

Basta dar dois cliques no arquivo `index.html`. Ele abre no navegador padrão e o site
funciona por completo, inclusive o menu, o banner rotativo, o atlas interativo, o
quiz, a galeria com filtro e os cards que viram — mesmo com o JavaScript desligado
no navegador, porque o site não usa JavaScript.

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
│                             roteiro" com distância entre as cidades, e o
│                             COMPARADOR de duas cidades lado a lado.
├── cultura.html ............ Cultura e imigração + LINHA DO TEMPO animada
│                             conforme a rolagem da página e CALENDÁRIO DE
│                             FESTAS mês a mês.
├── panorama.html ........... Geografia e clima, gastronomia típica e economia
│                             do estado, com tabelas de dados.
├── turismo.html ............ Geografia, clima, vegetação, fauna, roteiros e
│                             GALERIA DE FOTOS COM FILTRO por categoria.
├── curiosidades.html ....... Cards com EFEITO FLIP, QUIZ "Qual Santa
│                             Catarina é a sua?", arquitetura enxaimel e os
│                             créditos das fotos.
├── css/
│   ├── style.css ........... Toda a identidade visual, organizada em seções
│   │                         comentadas (reset, variáveis de cor, tema
│   │                         escuro, header, banner, cards, timeline,
│   │                         galeria, flip cards, footer, media queries).
│   └── estados.css ......... O que antes era JavaScript: os estados lidos
│                             pelo CSS (banner, zoom do atlas, clima,
│                             roteiros, comparador, calendário, galeria e
│                             quiz). Parte das regras foi gerada a partir dos
│                             dados das regiões e das cidades.
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
que ele existe. O site segue a preferência do sistema operacional; o botão de tema
no cabeçalho é um checkbox que inverte essa preferência (lido com `:has()`). Sem
JavaScript a escolha vale só para a página aberta e não fica guardada.
Todas as combinações de texto e fundo passam no contraste AA da WCAG, nos dois
temas.

## 4b. Diferenciais

| # | Diferencial | Onde |
| --- | --- | --- |
| 1 | **Atlas interativo**: mapa com relevo, oceano, graticulado, rosa dos ventos e escala gráfica. Cada região é um link para uma âncora (`#regiao-serra`): o `:target` aproxima o mapa (um `transform` com transição, calculado para cada região), acende os pinos e mostra o painel com foto e dados. "Ver o estado inteiro" volta ao mapa todo. A escala gráfica e o tamanho dos textos acompanham o zoom, com a largura do mapa lida em CSS (`100cqw / 600px`). | `cidades.html` |
| 2 | **Camada de clima**: rádios Verão/Inverno repintam as regiões pela temperatura média, com legenda — "praia de manhã, neve à tarde" em forma de dado. | `cidades.html` |
| 3 | **Roteiros sugeridos**: quatro percursos prontos (Rota Germânica, Serra, Litoral, Do mar ao Oeste). O mapa traça o caminho e numera as paradas, e o caderno mostra cada trecho e a distância total em linha reta (fórmula de haversine, calculada antes). | `cidades.html` |
| 4 | **Quiz "Qual Santa Catarina é a sua?"**: cinco perguntas, uma por vez ("Próxima" e "Voltar" são rótulos de checkboxes). Cada resposta soma pontos em variáveis CSS (`@property`), e uma *style query* mostra a região vencedora, com link para o atlas já aproximado nela (`cidades.html#regiao-serra`). "Refazer" é um botão `reset`. | `curiosidades.html` |
| 5 | **Passaporte catarinense**: cada carimbo do rodapé é um link para uma página; os já visitados (`a:visited`) ganham a cor de tinta de carimbo. O quiz rende o sétimo carimbo. | todas as páginas |
| 6 | Linha do tempo animada, galeria com filtro, flip cards, painel "Duas Santa Catarinas" e banner rotativo (já existiam, agora no visual novo). | várias |
| 7 | **Calendário de festas**: os doze meses com festas, safras e fenômenos da natureza (Oktoberfest, Festa do Pinhão, baleia-franca, neve na serra...). A barra de meses é um grupo de rádios (abre em outubro; as setas do teclado trocam o mês). Cada evento leva ao atlas com a cidade destacada (`cidades.html#cidade-blumenau`). | `cultura.html` |
| 8 | **Comparador de cidades**: duas das 28 cidades do atlas lado a lado — região, herança, população, altitude, fundação, clima e distância — com selo em quem "vence" cada linha e uma frase-resumo ("São Joaquim fica 1.350 m mais alta que Florianópolis..."). O CSS lê a opção marcada de cada `<select>`, faz as contas (inclusive a distância, com `sin`, `cos` e `sqrt`) e escreve os números com contadores. Um link destaca as duas no atlas. | `cidades.html` |

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
- Não depende de JavaScript: todo controle é um elemento nativo (link, rádio,
  checkbox, `<select>`, botão com `popovertarget`), então funciona por teclado e é
  anunciado pelos leitores de tela. Rádios e checkboxes ficam invisíveis, mas
  focáveis, e o foco aparece no rótulo que faz as vezes de botão.
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
      `turismo.html` e a camada de clima do atlas, nos painéis de `cidades.html` e
      nas regras de clima do `estados.css`, usam valores aproximados).
- [ ] **Cidades do comparador:** conferir população (Censo 2022), altitude e ano
      de fundação/emancipação das 28 cidades (variáveis `--a-*`/`--b-*` no fim do
      `estados.css`).
- [ ] **Calendário de festas:** conferir o mês de cada festa em `cultura.html`
      (seção `#calendario`) nos sites oficiais — algumas mudam de mês ou só
      acontecem a cada dois anos (Festa Nacional da Maçã, Festa da Uva, Fenaostra).
- [ ] **Textos:** revisão final de ortografia e concordância com o professor.
