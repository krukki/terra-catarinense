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
funciona por completo, inclusive o menu, o banner rotativo, o mapa interativo, a
galeria com filtro e os cards que viram.

Não é necessário instalar nada, rodar servidor nem compilar.

> **Observação:** as fotos e as fontes (Google Fonts) são carregadas da internet.
> Sem conexão, o site continua funcionando, mas aparece sem imagens e com as fontes
> substitutas do sistema.

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
├── cidades.html ............ Cidades e regiões + MAPA INTERATIVO das seis
│                             regiões (clique numa região e o painel troca).
├── cultura.html ............ Cultura e imigração + LINHA DO TEMPO animada
│                             conforme a rolagem da página.
├── panorama.html ........... Geografia e clima, gastronomia típica e economia
│                             do estado, com tabelas de dados.
├── turismo.html ............ Geografia, clima, vegetação, fauna, roteiros e
│                             GALERIA DE FOTOS COM FILTRO por categoria.
├── curiosidades.html ....... Cards com EFEITO FLIP, gastronomia típica,
│                             arquitetura enxaimel e as fontes de pesquisa.
├── css/
│   └── style.css ........... Toda a estilização, organizada em seções
│                             comentadas (reset, variáveis de cor, tema
│                             escuro, header, banner, cards, timeline,
│                             galeria, flip cards, footer, media queries).
├── js/
│   └── script.js ........... Todo o JavaScript, em 11 módulos comentados
│                             (menu, tema claro/escuro, banner, flip, mapa,
│                             timeline, galeria, scroll-reveal, voltar ao
│                             topo, ano do rodapé).
├── assets/
│   ├── favicon.svg ......... Ícone da aba (selo "SC" com o gradiente da marca)
│   ├── mapa-sc.svg ......... Contorno do estado usado no rodapé
│   ├── litoral/ ............ Fotos de praias e do litoral
│   ├── serra/ .............. Fotos da serra, araucárias e geada
│   ├── cidades/ ............ Fotos de Florianópolis, Blumenau, etc.
│   └── gastronomia/ ........ Fotos de pratos típicos
└── README.md ............... Este arquivo
```

As pastas de assets estão vazias (só com um arquivo `.gitkeep`) porque todas as
imagens do site usam, por enquanto, placeholders do serviço picsum.photos.

## 4. Identidade visual

Paleta (definida em `:root`, no início do `style.css`):

| Cor | Hex | Papel |
| --- | --- | --- |
| Azul Atlântico | `#0E7C9C` | cor principal |
| Verde Araucária | `#2F6B3A` | cor secundária |
| Vermelho Enxaimel | `#C1272D` | cor de destaque |
| Branco Neve | `#FAF9F6` | fundo |
| Cinza Grafite | `#2E2E2E` | texto |

Tipografia (Google Fonts):

| Fonte | Uso |
| --- | --- |
| Montserrat | títulos |
| Nunito Sans | texto corrido |
| Caveat | selos e "Você sabia?" |

Todas as cores do site são variáveis CSS no `:root`. O tema escuro só redefine essas
variáveis — nenhum componente precisa saber que ele existe. O botão de tema fica no
cabeçalho e a escolha é guardada no navegador; sem escolha, o site segue a preferência
do sistema operacional.

## 5. Acessibilidade

- Todas as imagens têm atributo `alt` descritivo.
- Tamanhos de fonte em `rem`, permitindo zoom do navegador.
- Um único `h1` por página e hierarquia `h2`/`h3`/`h4` em cascata.
- Link "pular para o conteúdo principal" como primeiro item tabulável.
- Foco visível (`:focus-visible`) em todos os elementos interativos.
- Mapa interativo, galeria, banner e flip cards funcionam por teclado.
- Links com texto descritivo — nenhum "clique aqui".
- Tags semânticas: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.
- Respeita a preferência `prefers-reduced-motion` do sistema.
- Mobile-first, testado a partir de 360px de largura.
- Tema claro e escuro, seguindo `prefers-color-scheme` quando o usuário não escolhe
  manualmente.
- Sem JavaScript o site continua utilizável: o menu nasce fechado no celular e vira
  barra de navegação no desktop, e o painel de regiões já vem preenchido no HTML.
- Alvos de toque de no mínimo 24x24px (WCAG 2.5.8).

## 6. O que ainda precisa ser substituído antes da entrega

- [ ] **Fotos:** trocar todas as URLs de picsum.photos por fotos próprias ou de banco
      de imagens livre, salvas em `assets/`. No HTML, cada ponto de troca está marcado
      com um comentário `TROCAR:`.
- [ ] **Dados do IBGE:** conferir e atualizar população, área, PIB, IDH e número de
      habitantes de cada cidade em
      [cidades.ibge.gov.br/brasil/sc/panorama](https://cidades.ibge.gov.br/brasil/sc/panorama).
- [ ] **Temperaturas:** conferir as médias climáticas no INMET (as tabelas de
      `turismo.html` usam valores aproximados).
- [ ] **Textos:** revisão final de ortografia e concordância com o professor.
