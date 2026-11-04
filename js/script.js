/* ==========================================================================
   TERRA CATARINENSE — JavaScript único (vanilla, sem bibliotecas)
   Projeto escolar — Técnico em Informática / Front-End
   IFMT Campus Várzea Grande — Ronaldo Heitor Marques de Oliveira — 4 INF

   MÓDULOS (cada um só roda se os elementos existirem na página)
   01. Marcação "js" no <html>
   02. Menu sticky (hamburguer no mobile)
   02b. Tema claro/escuro
   03. Banner rotativo (index.html)
   04. Flip cards (toque/clique/teclado)
   05. Atlas interativo: zoom, clima, roteiro e desafio (cidades.html)
   06. Linha do tempo com scroll-reveal (cultura.html)
   07. Galeria com filtro por categoria (turismo.html)
   08. Scroll-reveal genérico
   09. Botão voltar ao topo
   10. Ano automático no rodapé
   11. Passaporte catarinense (rodapé)
   12. Quiz "Qual Santa Catarina é a sua?" (curiosidades.html)
   13. Calendário de festas (cultura.html)
   14. Comparador de cidades (cidades.html)
   15. Planejador de viagem (turismo.html)
   16. Busca no site (todas as páginas)
   17. Glossário de sotaques (cultura.html)
   18. Receitas com ajuste de porções (panorama.html)
   ========================================================================== */

(function () {
  "use strict";

  /* ========================================================================
     01. MARCAÇÃO "js"
     Permite que o CSS esconda elementos do scroll-reveal apenas quando há
     JavaScript. Sem JS, todo o conteúdo continua visível.
     ==================================================================== */
  document.documentElement.classList.add("js");

  var consultaMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  var preferemenosMovimento = consultaMovimento.matches;

  // A preferência pode mudar durante a sessão; quem precisa reagir se inscreve
  var ouvintesDeMovimento = [];
  consultaMovimento.addEventListener("change", function (evento) {
    preferemenosMovimento = evento.matches;
    ouvintesDeMovimento.forEach(function (fn) {
      fn(preferemenosMovimento);
    });
  });


  /* ========================================================================
     02. MENU STICKY / HAMBURGUER
     ==================================================================== */
  function iniciarMenu() {
    var botao = document.querySelector("[data-menu-botao]");
    var nav = document.querySelector("[data-menu]");
    if (!botao || !nav) return;

    var consultaDesktop = window.matchMedia("(min-width: 62rem)");

    var rotulo = botao.querySelector("[data-menu-rotulo]");

    function abrir(estado) {
      botao.setAttribute("aria-expanded", String(estado));
      nav.hidden = !estado;
      if (rotulo) rotulo.textContent = estado ? "Fechar" : "Menu";
    }

    // No desktop o menu é sempre visível; no mobile começa fechado.
    function ajustarPorLargura() {
      if (consultaDesktop.matches) {
        nav.hidden = false;
        botao.setAttribute("aria-expanded", "false");
      } else if (botao.getAttribute("aria-expanded") !== "true") {
        nav.hidden = true;
      }
    }

    ajustarPorLargura();
    consultaDesktop.addEventListener("change", ajustarPorLargura);

    botao.addEventListener("click", function () {
      abrir(botao.getAttribute("aria-expanded") !== "true");
    });

    // Fecha ao escolher um link (mobile)
    nav.addEventListener("click", function (evento) {
      if (evento.target.closest("a") && !consultaDesktop.matches) abrir(false);
    });

    // Esc fecha o menu e devolve o foco ao botão
    document.addEventListener("keydown", function (evento) {
      if (
        evento.key === "Escape" &&
        botao.getAttribute("aria-expanded") === "true"
      ) {
        abrir(false);
        botao.focus();
      }
    });
  }


  /* ========================================================================
     02b. TEMA CLARO / ESCURO
     Sem escolha salva, o site segue o sistema (o CSS resolve sozinho).
     O botão grava a preferência e ela passa a valer nas duas direções.
     ==================================================================== */
  function iniciarTema() {
    var botao = document.querySelector("[data-tema-botao]");
    if (!botao) return;

    var raiz = document.documentElement;
    var consultaEscuro = window.matchMedia("(prefers-color-scheme: dark)");

    function temaDoSistema() {
      return consultaEscuro.matches ? "escuro" : "claro";
    }

    function temaAtual() {
      return raiz.getAttribute("data-tema") || temaDoSistema();
    }

    function aplicar(tema) {
      // Desliga as transições só durante a troca (ver comentário no CSS)
      raiz.classList.add("trocando-tema");
      raiz.setAttribute("data-tema", tema);
      void raiz.offsetWidth; // força o recálculo antes de religar
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          raiz.classList.remove("trocando-tema");
        });
      });
      botao.setAttribute("aria-label",
        tema === "escuro"
          ? "Mudar para o tema claro"
          : "Mudar para o tema escuro");
    }

    aplicar(temaAtual());

    botao.addEventListener("click", function () {
      var novo = temaAtual() === "escuro" ? "claro" : "escuro";
      aplicar(novo);
      try {
        window.localStorage.setItem("terra-catarinense:tema", novo);
      } catch (erro) {
        // Modo privativo ou armazenamento bloqueado: o tema vale só nesta página
      }
    });

    // Enquanto o usuário não escolher, acompanha o sistema
    consultaEscuro.addEventListener("change", function () {
      var salvo = null;
      try {
        salvo = window.localStorage.getItem("terra-catarinense:tema");
      } catch (erro) {
        salvo = null;
      }
      if (!salvo) aplicar(temaDoSistema());
    });
  }


  /* ========================================================================
     03. BANNER ROTATIVO (index.html)
     Troca de slide por tempo, setas, pontos e pausa. Pausa sozinho no
     hover/foco e quando a aba fica em segundo plano.
     ==================================================================== */
  function iniciarBanner() {
    var banner = document.querySelector("[data-banner]");
    if (!banner) return;

    var slides = Array.prototype.slice.call(
      banner.querySelectorAll("[data-slide]")
    );
    var pontos = Array.prototype.slice.call(
      banner.querySelectorAll("[data-ponto]")
    );
    var legenda = banner.querySelector("[data-banner-legenda]");
    var botaoPausa = banner.querySelector("[data-banner-pausa]");
    if (slides.length < 2) return;

    var atual = 0;
    var intervalo = null;
    var TEMPO = 6000;
    var pausadoPeloUsuario = false;
    var ponteiroEmCima = false;
    var temFoco = false;

    function mostrar(indice, anunciar) {
      atual = (indice + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        var ativo = i === atual;
        slide.setAttribute("data-ativo", String(ativo));
        // Slides fora de tela não devem ser lidos por leitores de tela
        slide.setAttribute("aria-hidden", String(!ativo));
      });

      pontos.forEach(function (ponto, i) {
        ponto.setAttribute("aria-pressed", String(i === atual));
      });

      // 1.7: a legenda é uma live region. Só anunciamos quando a troca parte
      // do usuário — senão o leitor de tela repetiria o texto a cada 6s.
      if (legenda && anunciar) {
        legenda.textContent = slides[atual].getAttribute("data-legenda") || "";
      }
    }

    // Troca iniciada pelo usuário: anuncia e reinicia a contagem do timer,
    // para o slide seguinte não entrar logo em seguida (1.6).
    function irPara(indice) {
      mostrar(indice, true);
      pararRotacao();
      atualizarRotacao();
    }

    function pararRotacao() {
      window.clearInterval(intervalo);
      intervalo = null;
    }

    // Uma única fonte de verdade: a rotação só corre se NENHUMA das condições
    // de pausa valer. Antes, mouseleave/focusout/visibilitychange religavam o
    // timer sem olhar para as outras condições.
    function atualizarRotacao() {
      var podeGirar =
        !pausadoPeloUsuario &&
        !preferemenosMovimento &&
        !ponteiroEmCima &&
        !temFoco &&
        !document.hidden;

      if (!podeGirar) {
        pararRotacao();
        return;
      }
      if (intervalo) return;
      intervalo = window.setInterval(function () {
        mostrar(atual + 1, false);
      }, TEMPO);
    }

    // --- Controles ---
    banner.querySelectorAll("[data-banner-anterior]").forEach(function (b) {
      b.addEventListener("click", function () {
        irPara(atual - 1);
      });
    });

    banner.querySelectorAll("[data-banner-proximo]").forEach(function (b) {
      b.addEventListener("click", function () {
        irPara(atual + 1);
      });
    });

    pontos.forEach(function (ponto, i) {
      ponto.addEventListener("click", function () {
        irPara(i);
      });
    });

    // Com movimento reduzido não há rotação para pausar: o botão sumiria
    // como controle morto (apertava e nada acontecia).
    function ajustarBotaoPausa() {
      if (!botaoPausa) return;
      botaoPausa.hidden = preferemenosMovimento;
    }
    ajustarBotaoPausa();
    ouvintesDeMovimento.push(function () {
      ajustarBotaoPausa();
      atualizarRotacao();
    });

    if (botaoPausa) {
      botaoPausa.addEventListener("click", function () {
        pausadoPeloUsuario = !pausadoPeloUsuario;
        botaoPausa.setAttribute("aria-pressed", String(pausadoPeloUsuario));
        botaoPausa.textContent = pausadoPeloUsuario ? "▶" : "⏸";
        botaoPausa.setAttribute(
          "aria-label",
          pausadoPeloUsuario
            ? "Retomar rotação automática das fotos"
            : "Pausar rotação automática das fotos"
        );
        atualizarRotacao();
      });
    }

    // --- Pausas automáticas ---
    banner.addEventListener("mouseenter", function () {
      ponteiroEmCima = true;
      atualizarRotacao();
    });
    banner.addEventListener("mouseleave", function () {
      ponteiroEmCima = false;
      atualizarRotacao();
    });
    banner.addEventListener("focusin", function () {
      temFoco = true;
      atualizarRotacao();
    });
    banner.addEventListener("focusout", function (evento) {
      // Tabular ENTRE os botões do próprio banner não é "sair" dele
      if (banner.contains(evento.relatedTarget)) return;
      temFoco = false;
      atualizarRotacao();
    });

    document.addEventListener("visibilitychange", atualizarRotacao);

    // Setas do teclado: só nos controles do banner. Antes o listener estava
    // na <section> inteira e agia com o foco nos links do slide, e sem
    // preventDefault a página ainda rolava para o lado.
    var controles = banner.querySelector("[data-banner-controles]") || banner;
    controles.addEventListener("keydown", function (evento) {
      if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
      evento.preventDefault();
      irPara(evento.key === "ArrowLeft" ? atual - 1 : atual + 1);
    });

    mostrar(0, false);
    atualizarRotacao();
  }


  /* ========================================================================
     04. FLIP CARDS
     Cada card é um <button> de verdade, então Enter e Espaço já funcionam
     sozinhos — não há handler de teclado aqui. O giro por ponteiro é o
     :hover do CSS, restrito a quem tem hover de verdade; o clique vale em
     qualquer dispositivo (um notebook com tela sensível ao toque tem hover
     E toque, e antes ficava sem nenhuma forma de virar no dedo).
     ==================================================================== */
  function iniciarFlipCards() {
    var cards = document.querySelectorAll("[data-flip]");
    if (!cards.length) return;

    // O hover é um atalho visual do CSS; o clique é o estado de verdade.
    var consultaPonteiro = window.matchMedia("(hover: hover) and (pointer: fine)");

    cards.forEach(function (gatilho) {
      var card = gatilho.closest(".flip-card");
      if (!card) return;

      var verso = document.getElementById(gatilho.getAttribute("aria-controls"));
      var sobOPonteiro = false;

      // O verso só entra na árvore de acessibilidade quando está à mostra.
      // backface-visibility esconde só o pixel: sem isto o leitor de tela
      // lê a resposta junto com a pergunta.
      function sincronizar() {
        if (!verso) return;
        var virado = card.classList.contains("flip-card--virado");
        var hover = sobOPonteiro && consultaPonteiro.matches;
        // hover inverte o estado, igual ao que o CSS faz visualmente
        var mostrandoVerso = virado !== hover;
        verso.setAttribute("aria-hidden", String(!mostrandoVerso));
      }

      gatilho.addEventListener("click", function () {
        var virado = card.classList.toggle("flip-card--virado");
        gatilho.setAttribute("aria-expanded", String(virado));
        sincronizar();
      });

      card.addEventListener("mouseenter", function () {
        sobOPonteiro = true;
        sincronizar();
      });

      card.addEventListener("mouseleave", function () {
        sobOPonteiro = false;
        sincronizar();
      });

      sincronizar();
    });
  }


  /* ========================================================================
     05. ATLAS INTERATIVO (cidades.html) — diferenciais 1, 2 e 3
     Clicar numa região do SVG (ou no botão equivalente) troca o painel
     lateral e aproxima o mapa, animando o viewBox. A barra de cima troca a
     camada (regiões, clima de verão, clima de inverno) e liga o modo
     roteiro, em que os pinos das cidades viram paradas de viagem, ou o
     desafio do mapa (diferencial 9), em que os pinos somem.
     ==================================================================== */

  // Dados de cada região. "clima" são médias aproximadas em °C (conferir
  // no INMET, como as da tabela de turismo.html).
  var REGIOES = {
    litoral: {
      nome: "Litoral e Grande Florianópolis",
      resumo:
        "Faixa costeira de clima mais ameno, herança açoriana, praias urbanas e a capital do estado. Concentra turismo, serviços e tecnologia.",
      cidades: [
        "Florianópolis",
        "Balneário Camboriú",
        "São José",
        "Itajaí",
        "Bombinhas",
        "Garopaba"
      ],
      curiosidade:
        "Só na Ilha de Santa Catarina são mais de 40 praias — e o estado passa das 500 no total.",
      foto: {
        src: "assets/cidades/ponte-hercilio-luz.jpg",
        alt: "Ponte Hercílio Luz iluminada ao anoitecer, ligando a ilha ao continente.",
        largura: 600,
        altura: 450
      },
      clima: { verao: 28, inverno: 16 },
      economia: "Turismo e tecnologia",
      heranca: "Açoriana",
      ancora: "litoral"
    },
    vale: {
      nome: "Vale do Itajaí",
      resumo:
        "Coração da imigração alemã e italiana, com arquitetura enxaimel, indústria têxtil forte e as maiores festas germânicas do país.",
      cidades: ["Blumenau", "Pomerode", "Brusque", "Timbó", "Indaial"],
      curiosidade:
        "Pomerode é conhecida como a cidade mais alemã do Brasil: boa parte da população ainda fala o dialeto pomerano.",
      foto: {
        src: "assets/cidades/vale-europeu.jpg",
        alt: "Rua de cidade colonial alemã com casas de madeira e flores nas janelas.",
        largura: 800,
        altura: 500
      },
      clima: { verao: 27, inverno: 15 },
      economia: "Indústria têxtil",
      heranca: "Alemã e italiana",
      ancora: "vale"
    },
    norte: {
      nome: "Norte / Nordeste",
      resumo:
        "Maior polo industrial e metalmecânico do estado, com portos, escolas técnicas e a maior cidade catarinense em população.",
      cidades: ["Joinville", "São Bento do Sul", "Jaraguá do Sul", "São Francisco do Sul"],
      curiosidade:
        "São Francisco do Sul é uma das cidades mais antigas do Brasil e tem centro histórico tombado.",
      foto: {
        src: "assets/cidades/joinville2.jpg",
        alt: "Vista aérea do Moinho da XV, réplica de moinho holandês, à beira de uma avenida arborizada em Joinville.",
        largura: 800,
        altura: 500
      },
      clima: { verao: 26, inverno: 15 },
      economia: "Metalmecânica e portos",
      heranca: "Alemã",
      ancora: "norte"
    },
    serra: {
      nome: "Planalto Serrano",
      resumo:
        "Região de altitude coberta por araucárias, com clima subtropical de altitude, tradição campeira e o inverno mais rigoroso do país.",
      cidades: ["Lages", "São Joaquim", "Urubici", "Urupema", "Bom Jardim da Serra"],
      curiosidade:
        "Urupema e São Joaquim disputam o título de cidade mais fria do Brasil, com marcas abaixo de -8 °C.",
      foto: {
        src: "assets/serra/morro-da-igreja.jpg",
        alt: "Formação rochosa Pedra Furada vista do alto do Morro da Igreja, em Urubici.",
        largura: 600,
        altura: 450
      },
      clima: { verao: 21, inverno: 8 },
      economia: "Pecuária, maçã e vinho",
      heranca: "Campeira",
      ancora: "serra"
    },
    oeste: {
      nome: "Oeste",
      resumo:
        "Motor do agronegócio catarinense: aves, suínos e cooperativas. Colonização vinda do Rio Grande do Sul, de origem italiana e alemã.",
      cidades: ["Chapecó", "Concórdia", "Xanxerê", "São Miguel do Oeste"],
      curiosidade:
        "O oeste ajuda a fazer de Santa Catarina o maior exportador de carne de porco do Brasil.",
      foto: {
        src: "assets/cidades/catedral-chapeco.jpg",
        alt: "Catedral de Chapecó ao anoitecer, com suas duas torres iluminadas.",
        largura: 800,
        altura: 500
      },
      clima: { verao: 27, inverno: 13 },
      economia: "Agronegócio",
      heranca: "Italiana e alemã",
      ancora: "oeste-sul"
    },
    sul: {
      nome: "Sul",
      resumo:
        "Região de carvão, cerâmica e descendência italiana, com praias tranquilas, dunas e as encostas da Serra do Rio do Rastro.",
      cidades: ["Criciúma", "Tubarão", "Laguna", "Araranguá"],
      curiosidade:
        "Laguna guarda o marco do Tratado de Tordesilhas e foi capital da efêmera República Juliana, em 1839.",
      foto: {
        src: "assets/cidades/laguna.jpg",
        alt: "Casario colonial colorido de Laguna com o mar visível ao fundo.",
        largura: 800,
        altura: 500
      },
      clima: { verao: 27, inverno: 14 },
      economia: "Carvão e cerâmica",
      heranca: "Italiana",
      ancora: "oeste-sul"
    }
  };

  var ORDEM_REGIOES = ["litoral", "vale", "norte", "serra", "oeste", "sul"];

  // Vizinha em cada direção, para navegar pelo mapa com as setas
  var VIZINHAS = {
    oeste: { ArrowRight: "serra", ArrowUp: "norte", ArrowDown: "serra" },
    norte: { ArrowLeft: "oeste", ArrowRight: "vale", ArrowDown: "vale" },
    vale: { ArrowUp: "norte", ArrowLeft: "serra", ArrowRight: "litoral", ArrowDown: "litoral" },
    serra: { ArrowLeft: "oeste", ArrowUp: "norte", ArrowRight: "vale", ArrowDown: "sul" },
    litoral: { ArrowUp: "vale", ArrowLeft: "serra", ArrowDown: "sul" },
    sul: { ArrowUp: "litoral", ArrowLeft: "serra", ArrowRight: "litoral" }
  };

  // Dados das 28 cidades do atlas, com a mesma chave do data-pino do SVG.
  // Região e coordenadas não se repetem aqui: vêm do próprio pino. O nome
  // também está no pino, mas a busca precisa dele nas páginas sem atlas.
  // populacao: Censo 2022 do IBGE, arredondada (as cidades que têm card
  // usam o mesmo número do card). altitude: da sede, em metros.
  // fundacao: ano da fundação ou da emancipação. Conferir no IBGE.
  var CIDADES = {
    "florianopolis": { nome: "Florianópolis", populacao: 540000, altitude: 3, fundacao: 1726, destaque: "Capital, ostras e tainha" },
    "sao-jose": { nome: "São José", populacao: 270000, altitude: 5, fundacao: 1750, destaque: "Casario açoriano" },
    "balneario-camboriu": { nome: "Balneário Camboriú", populacao: 150000, altitude: 2, fundacao: 1964, destaque: "Arranha-céus à beira-mar" },
    "itajai": { nome: "Itajaí", populacao: 264000, altitude: 2, fundacao: 1860, destaque: "Porto e Marejada" },
    "bombinhas": { nome: "Bombinhas", populacao: 25000, altitude: 10, fundacao: 1992, destaque: "Mergulho e enseadas" },
    "garopaba": { nome: "Garopaba", populacao: 30000, altitude: 5, fundacao: 1961, destaque: "Surfe e baleia-franca" },
    "blumenau": { nome: "Blumenau", populacao: 360000, altitude: 21, fundacao: 1850, destaque: "Oktoberfest e enxaimel" },
    "pomerode": { nome: "Pomerode", populacao: 34000, altitude: 85, fundacao: 1959, destaque: "Cidade mais alemã do Brasil" },
    "brusque": { nome: "Brusque", populacao: 141000, altitude: 21, fundacao: 1860, destaque: "Berço da fiação" },
    "timbo": { nome: "Timbó", populacao: 46000, altitude: 68, fundacao: 1934, destaque: "Pérola do Vale" },
    "indaial": { nome: "Indaial", populacao: 72000, altitude: 70, fundacao: 1934, destaque: "Às margens do Itajaí-Açu" },
    "joinville": { nome: "Joinville", populacao: 600000, altitude: 4, fundacao: 1851, destaque: "Cidade das Flores e da Dança" },
    "sao-bento-do-sul": { nome: "São Bento do Sul", populacao: 83000, altitude: 838, fundacao: 1873, destaque: "Móveis e serra fria" },
    "jaragua-do-sul": { nome: "Jaraguá do Sul", populacao: 183000, altitude: 30, fundacao: 1876, destaque: "Indústria e Schützenfest" },
    "sao-francisco-do-sul": { nome: "São Francisco do Sul", populacao: 53000, altitude: 7, fundacao: 1658, destaque: "Centro histórico tombado" },
    "lages": { nome: "Lages", populacao: 165000, altitude: 884, fundacao: 1766, destaque: "Festa do Pinhão" },
    "sao-joaquim": { nome: "São Joaquim", populacao: 27000, altitude: 1353, fundacao: 1886, destaque: "Maçã, vinho e neve" },
    "urubici": { nome: "Urubici", populacao: 11000, altitude: 1000, fundacao: 1956, destaque: "Morro da Igreja" },
    "urupema": { nome: "Urupema", populacao: 2500, altitude: 1425, fundacao: 1988, destaque: "Disputa a cidade mais fria" },
    "bom-jardim-da-serra": { nome: "Bom Jardim da Serra", populacao: 4700, altitude: 1245, fundacao: 1967, destaque: "Serra do Rio do Rastro" },
    "chapeco": { nome: "Chapecó", populacao: 254000, altitude: 674, fundacao: 1917, destaque: "Capital do agronegócio" },
    "concordia": { nome: "Concórdia", populacao: 82000, altitude: 550, fundacao: 1934, destaque: "Aves e suínos" },
    "xanxere": { nome: "Xanxerê", populacao: 51000, altitude: 800, fundacao: 1954, destaque: "Festa do Milho" },
    "sao-miguel-do-oeste": { nome: "São Miguel do Oeste", populacao: 44000, altitude: 645, fundacao: 1954, destaque: "Fronteira com a Argentina" },
    "criciuma": { nome: "Criciúma", populacao: 214000, altitude: 46, fundacao: 1880, destaque: "Carvão e cerâmica" },
    "tubarao": { nome: "Tubarão", populacao: 110000, altitude: 9, fundacao: 1870, destaque: "Às margens do rio Tubarão" },
    "laguna": { nome: "Laguna", populacao: 46000, altitude: 2, fundacao: 1676, destaque: "Pesca com botos" },
    "ararangua": { nome: "Araranguá", populacao: 71000, altitude: 13, fundacao: 1880, destaque: "Dunas e lagoas" }
  };

  // Lê os pinos do SVG: posição (do transform) e coordenadas reais (dos
  // data-*). Usado pelo atlas e pelo comparador.
  function lerPinos(svg) {
    return Array.prototype.map.call(
      svg.querySelectorAll("[data-pino]"),
      function (el) {
        var posicao = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(
          el.getAttribute("transform") || ""
        );
        return {
          el: el,
          id: el.getAttribute("data-pino"),
          nome: el.querySelector(".pino__nome").textContent,
          regiao: el.getAttribute("data-regiao-pino"),
          x: posicao ? parseFloat(posicao[1]) : 0,
          y: posicao ? parseFloat(posicao[2]) : 0,
          lat: parseFloat(el.getAttribute("data-lat")),
          lon: parseFloat(el.getAttribute("data-lon"))
        };
      }
    );
  }

  // O comparador pede ao atlas para destacar cidades. Fica vazio até o
  // atlas existir na página (mesmo padrão do carimbarPassaporte).
  var mostrarCidadesNoAtlas = function () {
    return false;
  };

  // Faixa da escala de cor do clima (1 = frio ... 5 = quente)
  function faixaDeClima(graus) {
    if (graus <= 11) return 1;
    if (graus <= 15) return 2;
    if (graus <= 19) return 3;
    if (graus <= 23) return 4;
    return 5;
  }

  // Distância em linha reta entre duas coordenadas (fórmula de haversine)
  function distanciaKm(a, b) {
    var raio = 6371;
    var rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad;
    var dLon = (b.lon - a.lon) * rad;
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * raio * Math.asin(Math.sqrt(h));
  }

  function formatarKm(km) {
    return Math.round(km).toLocaleString("pt-BR") + " km";
  }

  // localStorage pode estar bloqueado (aba anônima, arquivo local): toda
  // leitura e escrita passa por aqui e falha em silêncio.
  function lerGuardado(chave) {
    try {
      var valor = window.localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : null;
    } catch (e) {
      return null;
    }
  }

  function guardar(chave, valor) {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Textos e pinos do SVG são desenhados em "pixels de tela": o CSS divide
  // o tamanho por --zoom (pixels de tela por unidade do viewBox). Vale para
  // o atlas e para o mapa estático da home.
  function ajustarZoomDoMapa(svg) {
    var largura = svg.getBoundingClientRect().width;
    var caixa = svg.viewBox.baseVal;
    if (!largura || !caixa || !caixa.width) return 0;
    var zoom = largura / caixa.width;
    svg.style.setProperty("--zoom", zoom.toFixed(4));
    return zoom;
  }

  function iniciarEscalaDosMapas() {
    var mapas = document.querySelectorAll(".mapa-svg:not([data-atlas-svg])");
    if (!mapas.length) return;
    function ajustarTodos() {
      mapas.forEach(ajustarZoomDoMapa);
    }
    ajustarTodos();
    window.addEventListener("resize", ajustarTodos, { passive: true });
  }

  function iniciarAtlas() {
    var atlas = document.querySelector("[data-atlas]");
    var svg = atlas && atlas.querySelector("[data-atlas-svg]");
    var painel = atlas && atlas.querySelector("[data-painel-regiao]");
    if (!atlas || !svg || !painel) return;

    var quadro = atlas.querySelector("[data-atlas-quadro]");
    var gatilhos = atlas.querySelectorAll("[data-regiao]");
    var caminhos = svg.querySelectorAll(".regiao[data-regiao]");
    var rotulos = svg.querySelectorAll("[data-rotulo]");
    var temperaturas = svg.querySelectorAll("[data-temp]");
    var dica = atlas.querySelector("[data-dica]");
    var recentrar = atlas.querySelector("[data-recentrar]");
    var barraEscala = atlas.querySelector("[data-escala-barra]");
    var rotuloEscala = atlas.querySelector("[data-escala-rotulo]");
    var legenda = atlas.querySelector("[data-legenda-clima]");
    var estacaoLegenda = atlas.querySelector("[data-legenda-estacao]");
    var botoesCamada = atlas.querySelectorAll("[data-camada]");

    var elFoto = painel.querySelector("[data-regiao-foto]");
    var elNome = painel.querySelector("[data-regiao-nome]");
    var elResumo = painel.querySelector("[data-regiao-resumo]");
    var elDados = painel.querySelector("[data-regiao-dados]");
    var elCidades = painel.querySelector("[data-regiao-cidades]");
    var elCuriosidade = painel.querySelector("[data-regiao-curiosidade]");
    var elLink = painel.querySelector("[data-regiao-link]");

    var pinos = lerPinos(svg);
    var pinoPorId = {};
    pinos.forEach(function (p) {
      pinoPorId[p.id] = p;
    });

    var CAIXA_INICIAL = { x: 0, y: 0, w: 600, h: 380 };
    var PROPORCAO = CAIXA_INICIAL.w / CAIXA_INICIAL.h;
    var caixaAtual = { x: 0, y: 0, w: 600, h: 380 };
    var quadroAnimacao = null;
    var regiaoAtual = null;
    var camada = "regioes";
    var modoDesafio = false;

    /* --- Zoom: anima o viewBox até a caixa de destino --- */
    function aplicarCaixa(caixa) {
      caixaAtual = caixa;
      svg.setAttribute(
        "viewBox",
        [caixa.x, caixa.y, caixa.w, caixa.h]
          .map(function (n) { return n.toFixed(2); })
          .join(" ")
      );
      atualizarEscala(ajustarZoomDoMapa(svg));
    }

    function animarPara(destino) {
      window.cancelAnimationFrame(quadroAnimacao);
      // Aba em segundo plano não roda requestAnimationFrame: aplica direto
      if (preferemenosMovimento || document.hidden) {
        aplicarCaixa(destino);
        return;
      }
      var origem = caixaAtual;
      var DURACAO = 750;
      var inicio = null;

      function passo(agora) {
        if (inicio === null) inicio = agora;
        var t = Math.min((agora - inicio) / DURACAO, 1);
        // ease-in-out cúbico
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        aplicarCaixa({
          x: origem.x + (destino.x - origem.x) * e,
          y: origem.y + (destino.y - origem.y) * e,
          w: origem.w + (destino.w - origem.w) * e,
          h: origem.h + (destino.h - origem.h) * e
        });
        if (t < 1) quadroAnimacao = window.requestAnimationFrame(passo);
      }
      quadroAnimacao = window.requestAnimationFrame(passo);
    }

    // Caixa que envolve a região E os pinos dela (Balneário Camboriú, por
    // exemplo, aparece no Litoral do site mas fica no Vale pelo IBGE).
    function caixaDaRegiao(chave) {
      var caminho = svg.querySelector('.regiao[data-regiao="' + chave + '"]');
      var b = caminho.getBBox();
      var x1 = b.x;
      var y1 = b.y;
      var x2 = b.x + b.width;
      var y2 = b.y + b.height;

      pinos.forEach(function (p) {
        if (p.regiao !== chave) return;
        x1 = Math.min(x1, p.x);
        y1 = Math.min(y1, p.y);
        x2 = Math.max(x2, p.x + 40); // espaço para o nome ao lado do pino
        y2 = Math.max(y2, p.y);
      });

      var margem = Math.max(x2 - x1, y2 - y1) * 0.14 + 10;
      x1 -= margem;
      y1 -= margem;
      var w = x2 - x1 + margem;
      var h = y2 - y1 + margem;

      // Mantém a proporção do quadro, crescendo o lado mais curto
      if (w / h > PROPORCAO) {
        var novaAltura = w / PROPORCAO;
        y1 -= (novaAltura - h) / 2;
        h = novaAltura;
      } else {
        var novaLargura = h * PROPORCAO;
        x1 -= (novaLargura - w) / 2;
        w = novaLargura;
      }

      // Limite de aproximação: nunca mais que ~3,5x
      var MINIMO = 170;
      if (w < MINIMO) {
        x1 -= (MINIMO - w) / 2;
        y1 -= (MINIMO / PROPORCAO - h) / 2;
        w = MINIMO;
        h = MINIMO / PROPORCAO;
      }
      return { x: x1, y: y1, w: w, h: h };
    }

    function verEstadoInteiro() {
      animarPara(CAIXA_INICIAL);
      if (recentrar) recentrar.hidden = true;
    }

    /* --- Escala gráfica: acompanha o zoom --- */
    function atualizarEscala(zoom) {
      if (!zoom || !barraEscala || !rotuloEscala) return;
      // No viewBox, 100 unidades = 1 grau de latitude = ~111,2 km
      var pxPorKm = (zoom * 100) / 111.2;
      var opcoes = [5, 10, 20, 25, 50, 100, 200];
      var km = opcoes[opcoes.length - 1];
      for (var i = 0; i < opcoes.length; i++) {
        if (opcoes[i] * pxPorKm >= 60) {
          km = opcoes[i];
          break;
        }
      }
      barraEscala.style.setProperty("--largura-escala", (km * pxPorKm).toFixed(1) + "px");
      rotuloEscala.textContent = km + " km";
    }

    /* --- Painel lateral --- */
    function preencherPainel(dados) {
      if (elNome) elNome.textContent = dados.nome;
      if (elResumo) elResumo.textContent = dados.resumo;

      if (elFoto) {
        elFoto.src = dados.foto.src;
        elFoto.alt = dados.foto.alt;
        elFoto.width = dados.foto.largura;
        elFoto.height = dados.foto.altura;
      }

      if (elDados) {
        elDados.textContent = "";
        [
          ["Verão / inverno", dados.clima.verao + " °C / " + dados.clima.inverno + " °C"],
          ["Economia", dados.economia],
          ["Herança", dados.heranca]
        ].forEach(function (par) {
          var grupo = document.createElement("div");
          var dt = document.createElement("dt");
          var dd = document.createElement("dd");
          dt.textContent = par[0];
          dd.textContent = par[1];
          grupo.appendChild(dt);
          grupo.appendChild(dd);
          elDados.appendChild(grupo);
        });
      }

      if (elCuriosidade) {
        // Sem innerHTML: monta o "Você sabia?" pelo DOM
        elCuriosidade.textContent = "";
        var rotulo = document.createElement("strong");
        rotulo.textContent = "Você sabia?";
        elCuriosidade.appendChild(rotulo);
        elCuriosidade.appendChild(
          document.createTextNode(" " + dados.curiosidade)
        );
      }

      if (elCidades) {
        elCidades.textContent = "";
        dados.cidades.forEach(function (cidade) {
          var li = document.createElement("li");
          li.textContent = cidade;
          elCidades.appendChild(li);
        });
      }

      if (elLink) elLink.setAttribute("href", "#" + dados.ancora);
    }

    function selecionar(chave, aproximar) {
      var dados = REGIOES[chave];
      if (!dados) return;

      if (chave !== regiaoAtual) {
        preencherPainel(dados);
        // Reinicia a animação de troca (remove, força o reflow, põe de novo)
        painel.classList.remove("painel-regiao--trocando");
        void painel.offsetWidth;
        if (regiaoAtual !== null) painel.classList.add("painel-regiao--trocando");
      }
      regiaoAtual = chave;

      // Trocar de região apaga o destaque vindo do calendário/comparador
      pinos.forEach(function (p) {
        p.el.classList.remove("pino--destaque");
      });

      // Marca o estado em TODOS os gatilhos da mesma região (mapa + botão)
      gatilhos.forEach(function (gatilho) {
        var ativo = gatilho.getAttribute("data-regiao") === chave;
        gatilho.setAttribute("aria-pressed", String(ativo));
        gatilho.classList.toggle("regiao--ativa", ativo);
      });

      rotulos.forEach(function (rotulo) {
        rotulo.classList.toggle(
          "mapa-rotulo--ativa",
          rotulo.getAttribute("data-rotulo") === chave
        );
      });

      pinos.forEach(function (p) {
        p.el.classList.toggle("pino--ativo", p.regiao === chave);
      });

      if (aproximar) {
        animarPara(caixaDaRegiao(chave));
        if (recentrar) recentrar.hidden = false;
      }
    }

    /* --- Camadas: regiões, verão, inverno (diferencial 2) --- */
    function trocarCamada(nova) {
      camada = nova;
      var clima = nova !== "regioes";

      botoesCamada.forEach(function (botao) {
        botao.setAttribute(
          "aria-pressed",
          String(botao.getAttribute("data-camada") === nova)
        );
      });

      atlas.classList.toggle("atlas--clima", clima);
      if (legenda) legenda.hidden = !clima;
      if (estacaoLegenda) estacaoLegenda.textContent = nova === "inverno" ? "inverno" : "verão";

      caminhos.forEach(function (caminho) {
        var dados = REGIOES[caminho.getAttribute("data-regiao")];
        if (clima) {
          var graus = dados.clima[nova];
          caminho.style.setProperty("--cor-regiao-clima", "var(--clima-" + faixaDeClima(graus) + ")");
        } else {
          caminho.style.removeProperty("--cor-regiao-clima");
        }
      });

      temperaturas.forEach(function (texto) {
        var dados = REGIOES[texto.getAttribute("data-temp")];
        texto.textContent = clima ? dados.clima[nova] + " °C" : "";
      });
    }

    botoesCamada.forEach(function (botao) {
      botao.addEventListener("click", function () {
        trocarCamada(botao.getAttribute("data-camada"));
      });
    });

    /* --- Dica que segue o mouse --- */
    function textoDaDica(dados) {
      if (camada === "verao") return "Verão: cerca de " + dados.clima.verao + " °C";
      if (camada === "inverno") return "Inverno: cerca de " + dados.clima.inverno + " °C";
      return dados.economia + " · herança " + dados.heranca.toLowerCase();
    }

    function moverDica(evento, chave) {
      if (!dica || !quadro || evento.pointerType !== "mouse") return;
      var dados = REGIOES[chave];
      if (dica.hidden || dica.getAttribute("data-dica-regiao") !== chave) {
        dica.textContent = "";
        var titulo = document.createElement("strong");
        titulo.textContent = dados.nome;
        var info = document.createElement("span");
        info.textContent = textoDaDica(dados);
        dica.appendChild(titulo);
        dica.appendChild(info);
        dica.setAttribute("data-dica-regiao", chave);
        dica.hidden = false;
      }
      var caixa = quadro.getBoundingClientRect();
      var x = evento.clientX - caixa.left + 16;
      var y = evento.clientY - caixa.top + 16;
      // Perto da borda, a dica troca de lado para não sair do quadro
      if (x + dica.offsetWidth > caixa.width - 8) x -= dica.offsetWidth + 32;
      if (y + dica.offsetHeight > caixa.height - 8) y -= dica.offsetHeight + 32;
      dica.style.setProperty("--dica-x", x + "px");
      dica.style.setProperty("--dica-y", y + "px");
    }

    function esconderDica() {
      if (!dica) return;
      dica.hidden = true;
      dica.removeAttribute("data-dica-regiao");
    }

    /* --- Eventos das regiões e dos botões --- */
    gatilhos.forEach(function (gatilho) {
      var chave = gatilho.getAttribute("data-regiao");

      // No desafio, clicar numa região é dar um palpite (ver mais abaixo)
      gatilho.addEventListener("click", function () {
        if (modoDesafio) return;
        selecionar(chave, true);
      });

      // Só os <path> do SVG precisam do resto: um <button> nativo já
      // dispara click com Enter/Espaço.
      if (gatilho.tagName.toLowerCase() === "button") return;

      gatilho.addEventListener("pointermove", function (evento) {
        if (modoDesafio) return;
        moverDica(evento, chave);
      });
      gatilho.addEventListener("pointerleave", esconderDica);

      gatilho.addEventListener("keydown", function (evento) {
        if (modoDesafio) return;
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          selecionar(chave, true);
          return;
        }
        var vizinha = VIZINHAS[chave] && VIZINHAS[chave][evento.key];
        if (!vizinha) return;
        evento.preventDefault();
        var destino = svg.querySelector('.regiao[data-regiao="' + vizinha + '"]');
        if (destino) destino.focus();
        selecionar(vizinha, true);
      });
    });

    svg.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") verEstadoInteiro();
    });

    if (recentrar) {
      recentrar.addEventListener("click", function () {
        verEstadoInteiro();
        var ativa = svg.querySelector('.regiao[data-regiao="' + regiaoAtual + '"]');
        if (ativa) ativa.focus();
      });
    }

    // Mudou a largura: recalcula o tamanho dos textos e a escala
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        atualizarEscala(ajustarZoomDoMapa(svg));
      }).observe(svg);
    } else {
      window.addEventListener("resize", function () {
        atualizarEscala(ajustarZoomDoMapa(svg));
      });
    }

    /* --- Monte seu roteiro (diferencial 3) --- */
    var roteiro = atlas.querySelector("[data-roteiro]");
    var botaoRota = atlas.querySelector("[data-rota-botao]");
    var linhaRota = svg.querySelector("[data-rota-linha]");
    var grupoParadas = svg.querySelector("[data-rota-paradas]");
    var CHAVE_ROTEIRO = "terra-catarinense:roteiro";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var paradas = [];
    var modoRota = false;

    if (roteiro && botaoRota) {
      var lista = roteiro.querySelector("[data-roteiro-lista]");
      var total = roteiro.querySelector("[data-roteiro-total]");
      var seletor = roteiro.querySelector("[data-roteiro-select]");
      var botaoAdicionar = roteiro.querySelector("[data-roteiro-adicionar]");
      var botaoLimpar = roteiro.querySelector("[data-roteiro-limpar]");
      var compartilhar = roteiro.querySelector("[data-roteiro-compartilhar]");
      var botaoCopiar = roteiro.querySelector("[data-roteiro-copiar]");
      var campoLink = roteiro.querySelector("[data-roteiro-link]");
      var avisoLink = roteiro.querySelector("[data-roteiro-aviso]");

      var cidadeExiste = function (id) {
        return Object.prototype.hasOwnProperty.call(pinoPorId, id);
      };

      // Recupera o roteiro salvo, descartando ids que não existem mais
      var salvo = lerGuardado(CHAVE_ROTEIRO);
      if (Array.isArray(salvo)) {
        paradas = salvo.filter(cidadeExiste);
      }

      // cidades.html?roteiro=florianopolis,blumenau#mapa abre um roteiro
      // compartilhado. Ele só substitui o salvo quando a pessoa o editar.
      var roteiroDoLink = false;
      var linkRecebido = /[?&]roteiro=([a-z,-]+)/.exec(window.location.search);
      if (linkRecebido) {
        var paradasDoLink = linkRecebido[1].split(",").filter(function (id, i, todas) {
          return cidadeExiste(id) && id !== todas[i - 1];
        });
        if (paradasDoLink.length) {
          paradas = paradasDoLink;
          roteiroDoLink = true;
        }
      }

      // Lista de cidades agrupada por região, para quem usa teclado
      var vazio = document.createElement("option");
      vazio.value = "";
      vazio.textContent = "Escolha uma cidade";
      seletor.appendChild(vazio);
      ORDEM_REGIOES.forEach(function (chave) {
        var grupo = document.createElement("optgroup");
        grupo.label = REGIOES[chave].nome;
        pinos.forEach(function (p) {
          if (p.regiao !== chave) return;
          var opcao = document.createElement("option");
          opcao.value = p.id;
          opcao.textContent = p.nome;
          grupo.appendChild(opcao);
        });
        seletor.appendChild(grupo);
      });

      var desenharRoteiro = function () {
        var pontos = paradas.map(function (id) {
          return pinoPorId[id];
        });

        // Linha tracejada e números das paradas no mapa
        linhaRota.setAttribute(
          "points",
          pontos.map(function (p) { return p.x + "," + p.y; }).join(" ")
        );
        grupoParadas.textContent = "";
        pontos.forEach(function (p, i) {
          var externo = document.createElementNS(SVG_NS, "g");
          externo.setAttribute("class", "rota-parada");
          externo.setAttribute("transform", "translate(" + p.x + " " + p.y + ")");
          var interno = document.createElementNS(SVG_NS, "g");
          var circulo = document.createElementNS(SVG_NS, "circle");
          circulo.setAttribute("r", "8");
          var numero = document.createElementNS(SVG_NS, "text");
          numero.setAttribute("y", "3.4");
          numero.textContent = String(i + 1);
          interno.appendChild(circulo);
          interno.appendChild(numero);
          externo.appendChild(interno);
          grupoParadas.appendChild(externo);
        });

        pinos.forEach(function (p) {
          p.el.classList.toggle("pino--parada", paradas.indexOf(p.id) !== -1);
        });

        // Lista numerada com o trecho de cada parada
        lista.textContent = "";
        var soma = 0;
        pontos.forEach(function (p, i) {
          var li = document.createElement("li");
          var nome = document.createElement("span");
          nome.className = "roteiro__nome";
          nome.textContent = p.nome;
          li.appendChild(nome);

          if (i > 0) {
            var trecho = distanciaKm(pontos[i - 1], p);
            soma += trecho;
            var rotulo = document.createElement("span");
            rotulo.className = "roteiro__trecho";
            rotulo.textContent = "+" + formatarKm(trecho);
            li.appendChild(rotulo);
          }

          var remover = document.createElement("button");
          remover.type = "button";
          remover.className = "roteiro__remover";
          remover.setAttribute("aria-label", "Remover " + p.nome + " (parada " + (i + 1) + ") do roteiro");
          remover.textContent = "×";
          remover.addEventListener("click", function () {
            paradas.splice(i, 1);
            salvarRoteiro();
            desenharRoteiro();
            // O foco não pode sumir junto com o botão
            var botoes = lista.querySelectorAll(".roteiro__remover");
            (botoes[Math.min(i, botoes.length - 1)] || seletor).focus();
          });
          li.appendChild(remover);
          lista.appendChild(li);
        });

        total.textContent = "";
        if (pontos.length === 1) {
          total.textContent = "Adicione mais uma parada para medir a distância.";
        } else if (pontos.length > 1) {
          var forte = document.createElement("strong");
          forte.textContent = "≈ " + formatarKm(soma);
          total.appendChild(forte);
          total.appendChild(
            document.createTextNode(" em " + pontos.length + " paradas")
          );
          var nota = document.createElement("small");
          nota.textContent = "Distância em linha reta. Pela estrada, conte bem mais.";
          total.appendChild(nota);
        }
        if (botaoLimpar) botaoLimpar.hidden = pontos.length === 0;

        // O link só faz sentido a partir de duas paradas, e fica velho a cada
        // mudança: some o campo e o aviso da cópia anterior
        compartilhar.hidden = pontos.length < 2;
        campoLink.hidden = true;
        avisoLink.textContent = "";
      };

      var salvarRoteiro = function () {
        guardar(CHAVE_ROTEIRO, paradas);

        // Editou o roteiro do link: tira o ?roteiro= da URL, senão recarregar
        // a página traria de volta o roteiro antigo
        if (!roteiroDoLink) return;
        roteiroDoLink = false;
        try {
          var busca = window.location.search.replace(/[?&]roteiro=[^&]*/, "").replace(/^&/, "?");
          window.history.replaceState(null, "", window.location.pathname + busca + window.location.hash);
        } catch (e) {
          // segue sem limpar (alguns navegadores recusam em file://)
        }
      };

      var linkDoRoteiro = function () {
        return window.location.href.split(/[?#]/)[0] + "?roteiro=" + paradas.join(",") + "#mapa";
      };

      // A área de transferência só existe em https, localhost e, no Chrome,
      // em file://. Mas o link de um site aberto com dois cliques só funciona
      // neste computador: aí ele aparece num campo, junto com esse aviso.
      var mostrarCampoDoLink = function (link) {
        campoLink.value = link;
        campoLink.hidden = false;
        campoLink.focus();
        campoLink.select();
        avisoLink.textContent = window.location.protocol === "file:"
          ? "Copie o link acima. Com o site aberto do próprio computador, ele só funciona nesta máquina."
          : "Copie o link acima.";
      };

      botaoCopiar.addEventListener("click", function () {
        var link = linkDoRoteiro();
        if (window.location.protocol === "file:" || !navigator.clipboard || !window.isSecureContext) {
          mostrarCampoDoLink(link);
          return;
        }
        navigator.clipboard.writeText(link).then(function () {
          campoLink.hidden = true;
          avisoLink.textContent = "Link copiado. É só colar para quem vai viajar com você.";
        }, function () {
          mostrarCampoDoLink(link);
        });
      });

      var adicionarParada = function (id) {
        if (!pinoPorId[id]) return;
        // Clicar duas vezes na mesma cidade não cria uma parada repetida
        if (paradas[paradas.length - 1] === id) return;
        paradas.push(id);
        salvarRoteiro();
        desenharRoteiro();
      };

      var ligarModoRota = function (ligar) {
        if (ligar && modoDesafio) ligarDesafio(false);
        modoRota = ligar;
        botaoRota.setAttribute("aria-pressed", String(ligar));
        atlas.classList.toggle("atlas--rota", ligar);
        roteiro.hidden = !ligar;
        pinos.forEach(function (p) {
          if (ligar) {
            p.el.setAttribute("tabindex", "0");
            p.el.setAttribute("role", "button");
            p.el.setAttribute("aria-label", "Adicionar " + p.nome + " ao roteiro");
          } else {
            p.el.removeAttribute("tabindex");
            p.el.removeAttribute("role");
            p.el.removeAttribute("aria-label");
          }
        });
      };

      pinos.forEach(function (p) {
        p.el.addEventListener("click", function (evento) {
          if (!modoRota) return;
          evento.stopPropagation();
          adicionarParada(p.id);
        });
        p.el.addEventListener("keydown", function (evento) {
          if (!modoRota || (evento.key !== "Enter" && evento.key !== " ")) return;
          evento.preventDefault();
          adicionarParada(p.id);
        });
      });

      botaoRota.addEventListener("click", function () {
        ligarModoRota(!modoRota);
      });

      botaoAdicionar.addEventListener("click", function () {
        if (!seletor.value) {
          seletor.focus();
          return;
        }
        adicionarParada(seletor.value);
        seletor.value = "";
      });

      if (botaoLimpar) {
        botaoLimpar.addEventListener("click", function () {
          paradas = [];
          salvarRoteiro();
          desenharRoteiro();
          seletor.focus();
        });
      }

      desenharRoteiro();
      if (roteiroDoLink) ligarModoRota(true);
    }

    /* --- Desafio do mapa (diferencial 9) ---
       Os pinos somem, a pessoa marca onde acha que a cidade fica e o mapa
       mede o erro em km. Com mouse ou toque o palpite vem do clique; com
       teclado, das setas. Nos dois casos ele só vale depois de confirmado,
       para um toque sem querer no celular não gastar a rodada. */
    var desafio = atlas.querySelector("[data-desafio]");
    var botaoDesafio = atlas.querySelector("[data-desafio-botao]");
    var ligarDesafio = function () {};

    if (desafio && botaoDesafio) {
      var CHAVE_DESAFIO = "terra-catarinense:desafio";
      var RODADAS = 10;
      var PASSO_MIRA = 5;
      var PASSO_MIRA_GRANDE = 25;
      var TITULOS_DESAFIO = [
        { minimo: 800, nome: "Cartógrafo catarinense" },
        { minimo: 550, nome: "Guia de campo" },
        { minimo: 300, nome: "Viajante curioso" },
        { minimo: 0, nome: "Turista de primeira viagem" }
      ];

      var mira = svg.querySelector("[data-desafio-mira]");
      var linhaDesafio = svg.querySelector("[data-desafio-linha]");
      var jogo = desafio.querySelector("[data-desafio-jogo]");
      var fim = desafio.querySelector("[data-desafio-fim]");
      var elContador = desafio.querySelector("[data-desafio-contador]");
      var elPlacar = desafio.querySelector("[data-desafio-placar]");
      var elCidade = desafio.querySelector("[data-desafio-cidade]");
      var elAjuda = desafio.querySelector("[data-desafio-ajuda]");
      var elMira = desafio.querySelector("[data-desafio-mira-status]");
      var elResultado = desafio.querySelector("[data-desafio-resultado]");
      var botaoConfirmar = desafio.querySelector("[data-desafio-confirmar]");
      var botaoProxima = desafio.querySelector("[data-desafio-proxima]");

      var sorteio = [];
      var rodada = 0;
      var respostas = [];
      var palpite = null;
      var respondida = false;

      // A conta do README ao contrário: de x, y do mapa para longitude e latitude
      var coordenadasDoPonto = function (ponto) {
        return {
          lon: (ponto.x - 20) / 485 * 5.49 - 53.84,
          lat: -25.95 - (ponto.y - 20) / 340 * 3.4
        };
      };

      // 100 pontos até 10 km de erro, caindo em linha reta até 0 em 150 km
      var pontosDoErro = function (km) {
        if (km <= 10) return 100;
        if (km >= 150) return 0;
        return Math.round((150 - km) / 140 * 100);
      };

      var textoDePontos = function (n) {
        return n.toLocaleString("pt-BR") + (n === 1 ? " ponto" : " pontos");
      };

      var somaDosPontos = function () {
        return respostas.reduce(function (soma, r) {
          return soma + r.pontos;
        }, 0);
      };

      var embaralhar = function (lista) {
        var copia = lista.slice();
        for (var i = copia.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var troca = copia[i];
          copia[i] = copia[j];
          copia[j] = troca;
        }
        return copia;
      };

      // Diz em que região a mira está: é o retorno de quem não vê o mapa
      var regiaoDoPonto = function (ponto) {
        var alvo = svg.createSVGPoint();
        alvo.x = ponto.x;
        alvo.y = ponto.y;
        for (var i = 0; i < caminhos.length; i++) {
          if (caminhos[i].isPointInFill(alvo)) {
            return REGIOES[caminhos[i].getAttribute("data-regiao")].nome;
          }
        }
        return "fora do estado";
      };

      var marcarPalpite = function (ponto) {
        palpite = {
          x: Math.min(Math.max(ponto.x, 0), CAIXA_INICIAL.w),
          y: Math.min(Math.max(ponto.y, 0), CAIXA_INICIAL.h)
        };
        mira.setAttribute("transform", "translate(" + palpite.x + " " + palpite.y + ")");
        mira.classList.add("desafio-mira--marcada");
        elMira.textContent = "Palpite em: " + regiaoDoPonto(palpite);
        botaoConfirmar.disabled = false;
      };

      var limparResposta = function () {
        linhaDesafio.classList.remove("desafio-linha--visivel");
        pinos.forEach(function (p) {
          p.el.classList.remove("pino--destaque");
        });
      };

      var mostrarRodada = function () {
        var alvo = sorteio[rodada];
        palpite = null;
        respondida = false;
        limparResposta();

        elContador.textContent = "Rodada " + (rodada + 1) + " de " + RODADAS;
        elPlacar.textContent = textoDePontos(somaDosPontos());
        elCidade.textContent = alvo.nome;
        elMira.textContent = "";
        elResultado.textContent = "";
        // A explicação só faz falta na primeira rodada; depois, ela só empurra
        // o botão para longe do mapa no celular
        elAjuda.hidden = rodada > 0;

        // A mira recomeça no meio do mapa, ainda sem valer como palpite
        mira.setAttribute("transform", "translate(" + CAIXA_INICIAL.w / 2 + " " + CAIXA_INICIAL.h / 2 + ")");
        mira.classList.remove("desafio-mira--marcada");
        mira.removeAttribute("hidden");
        botaoConfirmar.hidden = false;
        botaoConfirmar.disabled = true;
        botaoProxima.hidden = true;
      };

      var confirmarPalpite = function () {
        if (!palpite || respondida) return;
        var alvo = sorteio[rodada];
        var km = distanciaKm(coordenadasDoPonto(palpite), alvo);
        var pontos = pontosDoErro(km);
        respondida = true;
        respostas.push({ nome: alvo.nome, km: km, pontos: pontos });

        linhaDesafio.setAttribute("x1", palpite.x);
        linhaDesafio.setAttribute("y1", palpite.y);
        linhaDesafio.setAttribute("x2", alvo.x);
        linhaDesafio.setAttribute("y2", alvo.y);
        linhaDesafio.classList.add("desafio-linha--visivel");
        alvo.el.classList.add("pino--destaque");

        elPlacar.textContent = textoDePontos(somaDosPontos());
        elAjuda.hidden = true;
        elMira.textContent = "";
        elResultado.textContent =
          (km < 1 ? "Na mosca" : "Errou por " + formatarKm(km)) + ": " + textoDePontos(pontos) + ". " +
          alvo.nome + ": " + CIDADES[alvo.id].destaque + ".";

        botaoConfirmar.hidden = true;
        botaoProxima.hidden = false;
        botaoProxima.textContent = rodada === RODADAS - 1 ? "Ver resultado" : "Próxima cidade";
        // Sem rolar: no celular o mapa não pode sair da tela bem na hora da resposta
        botaoProxima.focus({ preventScroll: true });
      };

      var mostrarFim = function () {
        var total = somaDosPontos();
        var guardado = lerGuardado(CHAVE_DESAFIO);
        var recordeAntigo = guardado && typeof guardado.melhor === "number" ? guardado.melhor : null;
        var novoRecorde = recordeAntigo === null || total > recordeAntigo;
        if (novoRecorde) guardar(CHAVE_DESAFIO, { melhor: total });

        var titulo = TITULOS_DESAFIO.filter(function (t) {
          return total >= t.minimo;
        })[0];

        limparResposta();
        mira.setAttribute("hidden", ""); // SVG não tem a propriedade .hidden
        desafio.querySelector("[data-desafio-total]").textContent = total.toLocaleString("pt-BR");
        desafio.querySelector("[data-desafio-titulo]").textContent = titulo.nome;
        desafio.querySelector("[data-desafio-recorde]").textContent = novoRecorde
          ? "Seu melhor resultado até agora."
          : "Seu recorde: " + textoDePontos(recordeAntigo) + ".";

        var listaFim = desafio.querySelector("[data-desafio-lista]");
        listaFim.textContent = "";
        respostas.forEach(function (r) {
          var li = document.createElement("li");
          var nome = document.createElement("span");
          nome.className = "roteiro__nome";
          nome.textContent = r.nome;
          var dados = document.createElement("span");
          dados.className = "roteiro__trecho";
          dados.textContent = formatarKm(r.km) + " · " + textoDePontos(r.pontos);
          li.appendChild(nome);
          li.appendChild(dados);
          listaFim.appendChild(li);
        });

        jogo.hidden = true;
        fim.hidden = false;
        fim.focus();
        carimbarPassaporte("desafio");
      };

      var comecarDesafio = function () {
        sorteio = embaralhar(pinos).slice(0, RODADAS);
        rodada = 0;
        respostas = [];
        fim.hidden = true;
        jogo.hidden = false;
        mostrarRodada();
      };

      ligarDesafio = function (ligar) {
        if (ligar && modoRota && ligarModoRota) ligarModoRota(false);
        modoDesafio = ligar;
        botaoDesafio.setAttribute("aria-pressed", String(ligar));
        atlas.classList.toggle("atlas--desafio", ligar);
        desafio.hidden = !ligar;
        esconderDica();

        // Os caminhos saem do Tab: no desafio, quem anda pelo mapa é a mira
        caminhos.forEach(function (caminho) {
          caminho.setAttribute("tabindex", ligar ? "-1" : "0");
        });

        if (ligar) {
          mira.setAttribute("tabindex", "0");
          verEstadoInteiro();
          comecarDesafio();
          mira.focus({ preventScroll: true });
          // Com o caderno embaixo do mapa, deixa os dois juntos na tela
          if (quadro && window.matchMedia("(max-width: 61.99rem)").matches) {
            quadro.scrollIntoView({ block: "start", behavior: preferemenosMovimento ? "auto" : "smooth" });
          }
        } else {
          mira.removeAttribute("tabindex");
          limparResposta();
        }
      };

      botaoDesafio.addEventListener("click", function () {
        ligarDesafio(!modoDesafio);
      });

      svg.addEventListener("click", function (evento) {
        if (!modoDesafio || respondida || !fim.hidden) return;
        var matriz = svg.getScreenCTM();
        if (!matriz) return;
        var ponto = svg.createSVGPoint();
        ponto.x = evento.clientX;
        ponto.y = evento.clientY;
        marcarPalpite(ponto.matrixTransform(matriz.inverse()));
      });

      mira.addEventListener("keydown", function (evento) {
        if (!modoDesafio || respondida) return;
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          confirmarPalpite();
          return;
        }
        var passo = evento.shiftKey ? PASSO_MIRA_GRANDE : PASSO_MIRA;
        var direcoes = {
          ArrowLeft: [-passo, 0],
          ArrowRight: [passo, 0],
          ArrowUp: [0, -passo],
          ArrowDown: [0, passo]
        };
        var direcao = direcoes[evento.key];
        if (!direcao) return;
        evento.preventDefault();
        var atual = palpite || { x: CAIXA_INICIAL.w / 2, y: CAIXA_INICIAL.h / 2 };
        marcarPalpite({ x: atual.x + direcao[0], y: atual.y + direcao[1] });
      });

      botaoConfirmar.addEventListener("click", confirmarPalpite);

      botaoProxima.addEventListener("click", function () {
        rodada++;
        if (rodada >= RODADAS) {
          mostrarFim();
          return;
        }
        mostrarRodada();
        mira.focus({ preventScroll: true });
      });

      desafio.querySelector("[data-desafio-repetir]").addEventListener("click", function () {
        comecarDesafio();
        mira.focus({ preventScroll: true });
      });
    }

    /* --- Estado inicial --- */
    ajustarZoomDoMapa(svg);
    atualizarEscala(ajustarZoomDoMapa(svg));

    // Destaca uma ou mais cidades: se forem da mesma região, aproxima nela;
    // se não, mostra o estado inteiro para as duas caberem.
    function destacarCidades(ids) {
      if (modoDesafio) ligarDesafio(false);
      var alvos = ids
        .map(function (id) { return pinoPorId[id]; })
        .filter(Boolean);
      if (!alvos.length) return false;

      var regiao = alvos[0].regiao;
      var mesmaRegiao = alvos.every(function (p) {
        return p.regiao === regiao;
      });
      selecionar(regiao, mesmaRegiao);
      if (!mesmaRegiao) verEstadoInteiro();

      alvos.forEach(function (p) {
        p.el.classList.add("pino--destaque");
      });
      return true;
    }

    mostrarCidadesNoAtlas = destacarCidades;

    // cidades.html?regiao=serra#mapa (link do quiz) já abre aproximado, e
    // cidades.html?cidade=blumenau#mapa (link do calendário) destaca o pino
    var cidadePedida = /[?&]cidade=([a-z-]+)/.exec(window.location.search);
    var pedida = /[?&]regiao=([a-z]+)/.exec(window.location.search);
    var achouCidade = cidadePedida && destacarCidades([cidadePedida[1]]);
    if (!achouCidade && pedida && REGIOES[pedida[1]]) {
      selecionar(pedida[1], true);
    } else if (!achouCidade) {
      selecionar(painel.getAttribute("data-painel-regiao") || "litoral", false);
    }
  }


  /* ========================================================================
     06. LINHA DO TEMPO — scroll-reveal (cultura.html)
     ==================================================================== */
  function iniciarLinhaTempo() {
    var marcos = document.querySelectorAll("[data-marco]");
    if (!marcos.length) return;

    if (!("IntersectionObserver" in window) || preferemenosMovimento) {
      marcos.forEach(function (marco) {
        marco.classList.add("marco--visivel", "revelar--visivel");
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("marco--visivel", "revelar--visivel");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    marcos.forEach(function (marco) {
      observador.observe(marco);
    });
  }


  /* ========================================================================
     07. GALERIA COM FILTRO (turismo.html)
     Mostra/oculta por data-categoria, sem recarregar nem biblioteca.
     ==================================================================== */
  function iniciarGaleria() {
    var galeria = document.querySelector("[data-galeria]");
    var botoes = document.querySelectorAll("[data-filtro]");
    if (!galeria || !botoes.length) return;

    var itens = Array.prototype.slice.call(
      galeria.querySelectorAll("[data-categoria]")
    );
    var contador = document.querySelector("[data-galeria-contador]");

    function filtrar(categoria) {
      var visiveis = 0;

      itens.forEach(function (item) {
        var mostra =
          categoria === "todas" ||
          item.getAttribute("data-categoria") === categoria;
        item.hidden = !mostra;
        if (mostra) visiveis++;
      });

      botoes.forEach(function (botao) {
        botao.setAttribute(
          "aria-pressed",
          String(botao.getAttribute("data-filtro") === categoria)
        );
      });

      if (contador) {
        contador.textContent =
          visiveis === 1
            ? "1 foto encontrada."
            : visiveis + " fotos encontradas.";
      }
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        filtrar(botao.getAttribute("data-filtro"));
      });
    });

    filtrar("todas");
  }


  /* ========================================================================
     08. SCROLL-REVEAL GENÉRICO
     ==================================================================== */
  function iniciarRevelar() {
    var alvos = document.querySelectorAll(".revelar:not([data-marco])");
    if (!alvos.length) return;

    if (!("IntersectionObserver" in window) || preferemenosMovimento) {
      alvos.forEach(function (alvo) {
        alvo.classList.add("revelar--visivel");
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("revelar--visivel");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.12 }
    );

    alvos.forEach(function (alvo) {
      observador.observe(alvo);
    });
  }


  /* ========================================================================
     09. BOTÃO VOLTAR AO TOPO
     ==================================================================== */
  function iniciarVoltarTopo() {
    var botao = document.querySelector("[data-voltar-topo]");
    if (!botao) return;

    function atualizar() {
      botao.classList.toggle("voltar-topo--visivel", window.scrollY > 600);
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();

    botao.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: preferemenosMovimento ? "auto" : "smooth"
      });
      var primeiroLink = document.querySelector(".logo");
      if (primeiroLink) primeiroLink.focus();
    });
  }


  /* ========================================================================
     10. ANO AUTOMÁTICO NO RODAPÉ
     ==================================================================== */
  function iniciarAno() {
    document.querySelectorAll("[data-ano]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }


  /* ========================================================================
     11. PASSAPORTE CATARINENSE (rodapé de todas as páginas) — diferencial 5
     Cada página visitada rende um carimbo, e terminar o quiz ou o desafio do
     mapa rende outro. Tudo fica no localStorage do navegador; se ele estiver bloqueado, o
     bloco continua escondido e nada quebra.
     ==================================================================== */
  var CARIMBOS = [
    { id: "inicio", nome: "Início", icone: "✦" },
    { id: "panorama", nome: "Panorama", icone: "▲" },
    { id: "cidades", nome: "Cidades", icone: "◉" },
    { id: "cultura", nome: "Cultura", icone: "✿" },
    { id: "turismo", nome: "Turismo", icone: "☀" },
    { id: "curiosidades", nome: "Curiosidades", icone: "?" },
    { id: "quiz", nome: "Quiz", icone: "★" },
    { id: "desafio", nome: "Desafio", icone: "⌖" }
  ];
  var GIROS = [-8, 5, -3, 7, -6, 4, -2];
  var CHAVE_PASSAPORTE = "terra-catarinense:passaporte";

  // Os outros módulos (o quiz) carimbam por aqui. Fica vazio até o
  // passaporte existir na página.
  var carimbarPassaporte = function () {};

  function iniciarPassaporte() {
    var bloco = document.querySelector("[data-passaporte]");
    var listaCarimbos = bloco && bloco.querySelector("[data-passaporte-carimbos]");
    var estado = bloco && bloco.querySelector("[data-passaporte-status]");
    if (!bloco || !listaCarimbos) return;

    // Testa se dá para gravar antes de mostrar qualquer coisa
    try {
      window.localStorage.setItem(CHAVE_PASSAPORTE + ":teste", "1");
      window.localStorage.removeItem(CHAVE_PASSAPORTE + ":teste");
    } catch (e) {
      return;
    }

    var ganhos = lerGuardado(CHAVE_PASSAPORTE);
    if (!Array.isArray(ganhos)) ganhos = [];
    var novos = [];

    function desenhar() {
      listaCarimbos.textContent = "";
      var faltam = [];

      CARIMBOS.forEach(function (carimbo, i) {
        var ganho = ganhos.indexOf(carimbo.id) !== -1;
        if (!ganho) faltam.push(carimbo.nome);

        var li = document.createElement("li");
        li.className = "carimbo" +
          (ganho ? " carimbo--ganho" : "") +
          (novos.indexOf(carimbo.id) !== -1 ? " carimbo--novo" : "");
        li.style.setProperty("--giro", GIROS[i % GIROS.length] + "deg");

        var icone = document.createElement("span");
        icone.className = "carimbo__icone";
        icone.setAttribute("aria-hidden", "true");
        icone.textContent = ganho ? carimbo.icone : "·";
        li.appendChild(icone);
        li.appendChild(document.createTextNode(carimbo.nome));

        var situacao = document.createElement("span");
        situacao.className = "sr-only";
        situacao.textContent = ganho ? " (carimbado)" : " (ainda não carimbado)";
        li.appendChild(situacao);
        listaCarimbos.appendChild(li);
      });

      if (estado) {
        estado.textContent = faltam.length
          ? (CARIMBOS.length - faltam.length) + " de " + CARIMBOS.length +
            " carimbos. Faltam: " + faltam.join(", ") + "."
          : "Passaporte completo! Você percorreu a Terra Catarinense inteira.";
      }
    }

    carimbarPassaporte = function (id) {
      if (ganhos.indexOf(id) !== -1) return;
      ganhos.push(id);
      novos.push(id);
      guardar(CHAVE_PASSAPORTE, ganhos);
      desenhar();
    };

    // Qual página é esta? (funciona em http:// e em file://)
    var arquivo = window.location.pathname.split("/").pop().replace(/\.html?$/, "");
    var pagina = arquivo === "" || arquivo === "index" ? "inicio" : arquivo;
    var existe = CARIMBOS.some(function (c) {
      return c.id === pagina;
    });

    bloco.hidden = false;
    if (existe) carimbarPassaporte(pagina);
    // Sempre desenha: quem volta a uma página já carimbada não ganha carimbo
    // novo, e o passaporte ficaria vazio
    desenhar();
  }


  /* ========================================================================
     12. QUIZ "QUAL SANTA CATARINA É A SUA?" (curiosidades.html) — diferencial 4
     Uma pergunta por vez. Cada opção soma um ponto para as regiões do seu
     data-pontos; empate é decidido pela primeira resposta.
     ==================================================================== */
  function iniciarQuiz() {
    var form = document.querySelector("[data-quiz]");
    var resultado = document.querySelector("[data-quiz-resultado]");
    if (!form || !resultado) return;

    var perguntas = Array.prototype.slice.call(
      form.querySelectorAll("[data-quiz-pergunta]")
    );
    var barra = form.querySelector("[data-quiz-barra]");
    var contador = form.querySelector("[data-quiz-contador]");
    var voltar = form.querySelector("[data-quiz-voltar]");
    var avancar = form.querySelector("[data-quiz-avancar]");
    var atual = 0;

    function marcada(indice) {
      return perguntas[indice].querySelector("input:checked");
    }

    function mostrar(indice) {
      atual = indice;
      perguntas.forEach(function (pergunta, i) {
        pergunta.hidden = i !== indice;
      });
      if (contador) {
        contador.textContent = "Pergunta " + (indice + 1) + " de " + perguntas.length;
      }
      if (barra) {
        barra.style.setProperty("--progresso", ((indice + 1) / perguntas.length) * 100 + "%");
      }
      voltar.disabled = indice === 0;
      avancar.textContent = indice === perguntas.length - 1 ? "Ver resultado" : "Próxima";
      avancar.disabled = !marcada(indice);
    }

    function calcular() {
      var pontos = {};
      var desempate = [];

      perguntas.forEach(function (pergunta, i) {
        var escolha = pergunta.querySelector("input:checked");
        if (!escolha) return;
        var regioes = escolha.getAttribute("data-pontos").split(" ");
        regioes.forEach(function (r) {
          pontos[r] = (pontos[r] || 0) + 1;
        });
        if (i === 0) desempate = regioes.slice();
      });

      var candidatas = desempate.concat(ORDEM_REGIOES);
      var vencedora = candidatas[0];
      candidatas.forEach(function (r) {
        if ((pontos[r] || 0) > (pontos[vencedora] || 0)) vencedora = r;
      });
      return vencedora;
    }

    function mostrarResultado(chave) {
      var dados = REGIOES[chave];
      var foto = resultado.querySelector("[data-quiz-foto]");
      var nome = resultado.querySelector("[data-quiz-nome]");
      var resumo = resultado.querySelector("[data-quiz-resumo]");
      var link = resultado.querySelector("[data-quiz-link]");

      foto.src = dados.foto.src;
      foto.alt = dados.foto.alt;
      foto.width = dados.foto.largura;
      foto.height = dados.foto.altura;
      nome.textContent = dados.nome;
      resumo.textContent = dados.resumo + " " + dados.curiosidade;
      link.setAttribute("href", "cidades.html?regiao=" + chave + "#mapa");
      link.textContent = "Ver " + dados.nome + " no atlas";

      form.hidden = true;
      resultado.hidden = false;
      resultado.focus();
      carimbarPassaporte("quiz");
    }

    form.addEventListener("change", function () {
      avancar.disabled = !marcada(atual);
    });

    // Enter numa opção também "envia": vale como Próxima
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!marcada(atual)) return;
      if (atual < perguntas.length - 1) {
        mostrar(atual + 1);
        perguntas[atual].querySelector("input").focus();
      } else {
        mostrarResultado(calcular());
      }
    });

    voltar.addEventListener("click", function () {
      if (atual === 0) return;
      mostrar(atual - 1);
      (marcada(atual) || perguntas[atual].querySelector("input")).focus();
    });

    resultado.querySelector("[data-quiz-refazer]").addEventListener("click", function () {
      form.reset();
      resultado.hidden = true;
      form.hidden = false;
      mostrar(0);
      perguntas[0].querySelector("input").focus();
    });

    mostrar(0);
  }


  /* ========================================================================
     13. CALENDÁRIO DE FESTAS (cultura.html) — diferencial 7
     Os doze meses já vêm no HTML (sem JS, aparece a lista inteira). Com JS,
     a barra de meses mostra um mês por vez, abrindo no mês atual ou no
     ?mes= da URL.
     ==================================================================== */
  function iniciarCalendario() {
    var calendario = document.querySelector("[data-calendario]");
    var meses = calendario && calendario.querySelectorAll("[data-mes]");
    var botoes = calendario && calendario.querySelectorAll("[data-mes-botao]");
    if (!calendario || !meses.length || !botoes.length) return;

    var estado = calendario.querySelector("[data-calendario-status]");
    var atual = 0;

    function mostrar(mes, atualizarUrl) {
      atual = mes;
      var titulo = "";
      var quantos = 0;

      meses.forEach(function (bloco) {
        var esse = Number(bloco.getAttribute("data-mes")) === mes;
        bloco.hidden = !esse;
        if (!esse) return;
        titulo = bloco.querySelector("h3").textContent;
        quantos = bloco.querySelectorAll(".calendario__evento").length;
      });

      botoes.forEach(function (botao) {
        var esse = Number(botao.getAttribute("data-mes-botao")) === mes;
        botao.setAttribute("aria-pressed", String(esse));
        botao.tabIndex = esse ? 0 : -1;
      });

      if (estado) {
        estado.textContent = titulo + ": " + quantos +
          (quantos === 1 ? " programa" : " programas");
      }

      // Guarda o mês na URL para dar para compartilhar o link. Em file://
      // alguns navegadores recusam: aí só não guarda.
      if (atualizarUrl) {
        try {
          var busca = window.location.search.replace(/[?&]mes=\d+/, "").replace(/^&/, "?");
          busca += (busca ? "&" : "?") + "mes=" + mes;
          window.history.replaceState(null, "", busca + window.location.hash);
        } catch (e) {
          // segue sem guardar
        }
      }
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        mostrar(Number(botao.getAttribute("data-mes-botao")), true);
      });
    });

    // Setas andam entre os meses (dezembro → janeiro dá a volta)
    calendario.querySelector("[data-calendario-barra]").addEventListener("keydown", function (evento) {
      var passos = { ArrowLeft: -1, ArrowRight: 1, Home: 1 - atual, End: 12 - atual };
      if (!(evento.key in passos)) return;
      evento.preventDefault();
      var novo = ((atual - 1 + passos[evento.key] + 12) % 12) + 1;
      mostrar(novo, true);
      calendario.querySelector('[data-mes-botao="' + novo + '"]').focus();
    });

    var pedido = /[?&]mes=(\d{1,2})/.exec(window.location.search);
    var mesPedido = pedido ? Number(pedido[1]) : 0;
    mostrar(mesPedido >= 1 && mesPedido <= 12 ? mesPedido : new Date().getMonth() + 1, false);
  }


  /* ========================================================================
     14. COMPARADOR DE CIDADES (cidades.html) — diferencial 8
     Duas cidades do atlas lado a lado: população, altitude, fundação, clima
     da região e a distância entre elas. Só existe com JS (o bloco nasce
     com hidden, como o passaporte).
     ==================================================================== */
  var CHAVE_COMPARADOR = "terra-catarinense:comparador";

  function formatarPopulacao(n) {
    var mil = n >= 10000 ? Math.round(n / 1000) : (n / 1000).toFixed(1).replace(".", ",");
    return "~" + mil + " mil";
  }

  function formatarMetros(n) {
    return n.toLocaleString("pt-BR") + " m";
  }

  function iniciarComparador() {
    var bloco = document.querySelector("[data-comparador]");
    var svg = document.querySelector("[data-atlas-svg]");
    if (!bloco || !svg) return;

    var seletores = bloco.querySelectorAll("[data-comparador-cidade]");
    var nomes = bloco.querySelectorAll("[data-comparador-nome]");
    var corpo = bloco.querySelector("[data-comparador-corpo]");
    var resumo = bloco.querySelector("[data-comparador-resumo]");
    var inverter = bloco.querySelector("[data-comparador-inverter]");
    var verNoAtlas = bloco.querySelector("[data-comparador-atlas]");
    if (seletores.length !== 2 || !corpo) return;
    var escolhidas = [];

    // Junta o que vem do pino (nome, região, coordenadas) com CIDADES
    var cidades = {};
    lerPinos(svg).forEach(function (p) {
      var dados = CIDADES[p.id];
      if (!dados) return;
      cidades[p.id] = {
        id: p.id,
        nome: p.nome,
        regiao: p.regiao,
        lat: p.lat,
        lon: p.lon,
        populacao: dados.populacao,
        altitude: dados.altitude,
        fundacao: dados.fundacao,
        destaque: dados.destaque
      };
    });

    // Opções agrupadas por região, na ordem do atlas
    seletores.forEach(function (seletor) {
      ORDEM_REGIOES.forEach(function (chave) {
        var grupo = document.createElement("optgroup");
        grupo.label = REGIOES[chave].nome;
        Object.keys(cidades).forEach(function (id) {
          if (cidades[id].regiao !== chave) return;
          var opcao = document.createElement("option");
          opcao.value = id;
          opcao.textContent = cidades[id].nome;
          grupo.appendChild(opcao);
        });
        seletor.appendChild(grupo);
      });
    });

    // Cada linha: como mostrar o valor e qual lado "vence" (maior ou menor)
    var LINHAS = [
      { rotulo: "Região", valor: function (c) { return REGIOES[c.regiao].nome; } },
      { rotulo: "Herança", valor: function (c) { return REGIOES[c.regiao].heranca; } },
      {
        rotulo: "População",
        valor: function (c) { return formatarPopulacao(c.populacao); },
        numero: function (c) { return c.populacao; },
        vence: "maior",
        selo: "mais populosa"
      },
      {
        rotulo: "Altitude",
        valor: function (c) { return formatarMetros(c.altitude); },
        numero: function (c) { return c.altitude; },
        vence: "maior",
        selo: "mais alta"
      },
      {
        rotulo: "Fundação",
        valor: function (c) { return String(c.fundacao); },
        numero: function (c) { return c.fundacao; },
        vence: "menor",
        selo: "mais antiga"
      },
      {
        rotulo: "Verão",
        clima: "verao",
        numero: function (c) { return REGIOES[c.regiao].clima.verao; },
        vence: "maior",
        selo: "mais quente"
      },
      {
        rotulo: "Inverno",
        clima: "inverno",
        numero: function (c) { return REGIOES[c.regiao].clima.inverno; },
        vence: "menor",
        selo: "mais fria"
      }
    ];

    function celula(linha, cidade, outra) {
      var td = document.createElement("td");

      if (linha.clima) {
        var graus = linha.numero(cidade);
        var bolinha = document.createElement("span");
        bolinha.className = "escala-clima__cor escala-clima__cor--" + faixaDeClima(graus);
        bolinha.setAttribute("aria-hidden", "true");
        td.appendChild(bolinha);
        td.appendChild(document.createTextNode(graus + " °C"));
      } else {
        td.textContent = linha.valor(cidade);
      }

      if (linha.vence) {
        var a = linha.numero(cidade);
        var b = linha.numero(outra);
        var ganhou = linha.vence === "maior" ? a > b : a < b;
        if (ganhou) {
          td.classList.add("comparador__vence");
          var selo = document.createElement("span");
          selo.className = "comparador__selo";
          selo.textContent = linha.selo;
          td.appendChild(selo);
        }
      }
      return td;
    }

    function frase(a, b) {
      var partes = [];

      var difAltura = a.altitude - b.altitude;
      var alta = difAltura >= 0 ? a : b;
      var baixa = alta === a ? b : a;
      partes.push(
        Math.abs(difAltura) < 50
          ? a.nome + " e " + b.nome + " ficam praticamente na mesma altitude."
          : alta.nome + " fica " + formatarMetros(Math.abs(difAltura)) +
            " mais alta que " + baixa.nome + "."
      );

      var difInverno = REGIOES[a.regiao].clima.inverno - REGIOES[b.regiao].clima.inverno;
      if (a.regiao === b.regiao) {
        partes.push("Como são da mesma região, o clima médio é parecido.");
      } else if (difInverno !== 0) {
        var fria = difInverno < 0 ? a : b;
        partes.push(
          "No inverno, " + fria.nome + " costuma ficar " +
          Math.abs(difInverno) + " °C mais fria."
        );
      }

      partes.push("Em linha reta, são " + formatarKm(distanciaKm(a, b)) + " de uma à outra.");
      return partes.join(" ");
    }

    function desenhar() {
      var a = cidades[seletores[0].value];
      var b = cidades[seletores[1].value];
      if (!a || !b) return;

      nomes[0].textContent = a.nome;
      nomes[1].textContent = b.nome;

      corpo.textContent = "";
      LINHAS.forEach(function (linha) {
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.scope = "row";
        th.textContent = linha.rotulo;
        tr.appendChild(th);
        tr.appendChild(celula(linha, a, b));
        tr.appendChild(celula(linha, b, a));
        corpo.appendChild(tr);
      });

      // Destaque de cada cidade, numa linha só
      var trDestaque = document.createElement("tr");
      var thDestaque = document.createElement("th");
      thDestaque.scope = "row";
      thDestaque.textContent = "Conhecida por";
      trDestaque.appendChild(thDestaque);
      [a, b].forEach(function (c) {
        var td = document.createElement("td");
        td.className = "comparador__destaque";
        td.textContent = c.destaque;
        trDestaque.appendChild(td);
      });
      corpo.appendChild(trDestaque);

      if (resumo) resumo.textContent = frase(a, b);
      escolhidas = [a.id, b.id];
      guardar(CHAVE_COMPARADOR, escolhidas);
    }

    // Escolher a mesma cidade dos dois lados troca as duas de lugar
    seletores.forEach(function (seletor, i) {
      seletor.addEventListener("change", function () {
        var outro = seletores[1 - i];
        if (seletor.value === outro.value) outro.value = escolhidas[i];
        desenhar();
      });
    });

    if (inverter) {
      inverter.addEventListener("click", function () {
        var a = seletores[0].value;
        seletores[0].value = seletores[1].value;
        seletores[1].value = a;
        desenhar();
      });
    }

    if (verNoAtlas) {
      verNoAtlas.addEventListener("click", function () {
        if (!mostrarCidadesNoAtlas([seletores[0].value, seletores[1].value])) return;
        var mapa = document.getElementById("mapa");
        if (mapa) {
          mapa.scrollIntoView({ behavior: preferemenosMovimento ? "auto" : "smooth" });
        }
      });
    }

    // Começa pela última escolha ou pelo contraste da home: ilha x serra
    var salvo = lerGuardado(CHAVE_COMPARADOR);
    var inicio = Array.isArray(salvo) && salvo.length === 2 &&
      cidades[salvo[0]] && cidades[salvo[1]] && salvo[0] !== salvo[1]
      ? salvo
      : ["florianopolis", "sao-joaquim"];
    seletores[0].value = inicio[0];
    seletores[1].value = inicio[1];

    bloco.hidden = false;
    desenhar();
  }


  /* ========================================================================
     15. PLANEJADOR DE VIAGEM (turismo.html) — diferencial 10
     A pessoa escolhe o mês e o que quer fazer; o planejador cruza as
     temperaturas do atlas com as festas do calendário e sugere uma região.
     Só existe com JS (o bloco nasce com hidden, como o comparador).
     ==================================================================== */

  // Cópia do calendário de cultura.html (seção #calendario). Quando o site
  // abre em file://, o JS de uma página não consegue ler o HTML de outra.
  // Mudou uma festa lá? Mude aqui também.
  var FESTAS = [
    { mes: 1, tipo: "Festa", titulo: "Festa Pomerana", lugar: "Pomerode", regiao: "vale" },
    { mes: 1, tipo: "Festa", titulo: "Procissão de Navegantes", lugar: "Litoral", regiao: "litoral" },
    { mes: 2, tipo: "Festa", titulo: "Carnaval da Ilha", lugar: "Florianópolis", regiao: "litoral" },
    { mes: 2, tipo: "Festa", titulo: "Carnaval de Laguna", lugar: "Laguna", regiao: "sul" },
    { mes: 2, tipo: "Festa", titulo: "Festa da Uva", lugar: "Videira", regiao: "oeste" },
    { mes: 3, tipo: "Época", titulo: "Colheita da maçã", lugar: "São Joaquim", regiao: "serra" },
    { mes: 3, tipo: "Época", titulo: "Vindima dos vinhos de altitude", lugar: "Planalto Serrano", regiao: "serra" },
    { mes: 4, tipo: "Festa", titulo: "Osterfest", lugar: "Pomerode", regiao: "vale" },
    { mes: 4, tipo: "Festa", titulo: "Festa Nacional da Maçã", lugar: "São Joaquim", regiao: "serra" },
    { mes: 5, tipo: "Época", titulo: "Safra da tainha", lugar: "Florianópolis", regiao: "litoral" },
    { mes: 5, tipo: "Festa", titulo: "Festa do Divino Espírito Santo", lugar: "Litoral açoriano", regiao: "litoral" },
    { mes: 6, tipo: "Festa", titulo: "Festa Nacional do Pinhão", lugar: "Lages", regiao: "serra" },
    { mes: 6, tipo: "Época", titulo: "Geada nos campos", lugar: "Urubici", regiao: "serra" },
    { mes: 7, tipo: "Festa", titulo: "Festival de Dança de Joinville", lugar: "Joinville", regiao: "norte" },
    { mes: 7, tipo: "Época", titulo: "Chance de neve", lugar: "Urupema", regiao: "serra" },
    { mes: 8, tipo: "Época", titulo: "Temporada da baleia-franca", lugar: "Garopaba", regiao: "litoral" },
    { mes: 9, tipo: "Festa", titulo: "Semana Farroupilha", lugar: "Lages e Oeste", regiao: "serra" },
    { mes: 10, tipo: "Festa", titulo: "Oktoberfest", lugar: "Blumenau", regiao: "vale" },
    { mes: 10, tipo: "Festa", titulo: "Marejada", lugar: "Itajaí", regiao: "litoral" },
    { mes: 10, tipo: "Festa", titulo: "Fenarreco", lugar: "Brusque", regiao: "vale" },
    { mes: 10, tipo: "Festa", titulo: "Schützenfest", lugar: "Jaraguá do Sul", regiao: "norte" },
    { mes: 11, tipo: "Festa", titulo: "Fenaostra", lugar: "Florianópolis", regiao: "litoral" },
    { mes: 11, tipo: "Festa", titulo: "Festa das Flores", lugar: "Joinville", regiao: "norte" },
    { mes: 12, tipo: "Festa", titulo: "Natal no Vale", lugar: "Blumenau", regiao: "vale" },
    { mes: 12, tipo: "Festa", titulo: "Boi-de-mamão e Terno de Reis", lugar: "Litoral", regiao: "litoral" }
  ];

  var NOMES_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
    "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // pesos: o quanto cada região combina com o interesse. pesoFesta: quanto
  // vale cada festa da região no mês. calor: 1 prefere o quente, -1 o frio.
  var INTERESSES = {
    praia: {
      nome: "Praia e mar",
      pesos: { litoral: 5, sul: 4, norte: 2, vale: 1, serra: 0, oeste: 0 },
      pesoFesta: 0.5,
      calor: 1,
      levar: "Roupa de banho",
      nota: function (mes) {
        if (mes === 12 || mes <= 3) return "É a alta temporada: mar mais quente e praias cheias, então reserve com antecedência.";
        if (mes >= 6 && mes <= 9) return "O mar fica frio para o banho: nesta época, a viagem vale mais pela paisagem e pelas trilhas.";
        return "Meia-estação: praias mais vazias, com a água ainda fresca.";
      }
    },
    serra: {
      nome: "Serra e frio",
      pesos: { serra: 6, oeste: 2, norte: 2, sul: 1, vale: 0, litoral: 0 },
      pesoFesta: 0.5,
      calor: -1,
      levar: "Bota ou tênis para caminhar",
      nota: function (mes) {
        if (mes >= 6 && mes <= 8) return "É a época de geada e, com sorte, de neve.";
        if (mes >= 3 && mes <= 5) return "Outono de colheita, com a maçã e os vinhos de altitude.";
        if (mes >= 9 && mes <= 11) return "Primavera de campos verdes e noites ainda frias.";
        return "Verão ameno, boa fuga do calor, mas sem neve.";
      }
    },
    festas: {
      nome: "Festas e tradição",
      pesos: { litoral: 1, vale: 1, norte: 1, serra: 1, oeste: 1, sul: 1 },
      pesoFesta: 3,
      calor: 0,
      levar: "Calçado confortável para o dia inteiro",
      nota: function () {
        return "As datas mudam um pouco a cada ano: confira no site oficial de cada festa.";
      }
    },
    comida: {
      nome: "Comida típica",
      pesos: { litoral: 3, vale: 3, serra: 2, oeste: 2, sul: 1, norte: 1 },
      pesoFesta: 1,
      calor: 0,
      levar: "Bom apetite",
      nota: function (mes, regiao) {
        return "Para provar na região: " + PRATO_DA_REGIAO[regiao] + ".";
      }
    },
    natureza: {
      nome: "Natureza e trilhas",
      pesos: { serra: 4, litoral: 3, sul: 3, vale: 2, oeste: 1, norte: 1 },
      pesoFesta: 0.25,
      calor: 0,
      levar: "Tênis de trilha e garrafa de água",
      nota: function (mes) {
        if (mes === 12 || mes <= 2) return "Comece cedo: no meio do dia o calor aperta.";
        if (mes >= 6 && mes <= 8) return "Dias frios e bons para os mirantes: leve agasalho até para a trilha.";
        return "Temperatura boa para caminhar o dia inteiro.";
      }
    }
  };

  var PRATO_DA_REGIAO = {
    litoral: "ostras e sequência de camarão",
    vale: "cuca e marreco recheado",
    norte: "cozinha de herança alemã, como a cuca",
    serra: "pinhão e entrevero",
    oeste: "polenta e galeto",
    sul: "polenta e galeto"
  };

  // O que levar, pela mesma faixa de temperatura do mapa de clima
  var MALA_POR_FAIXA = {
    1: ["Casaco pesado e gorro", "Luvas e cachecol", "Meias grossas e calçado fechado"],
    2: ["Casaco e malha", "Calça comprida", "Calçado fechado"],
    3: ["Agasalho para a noite", "Roupa leve para o dia", "Capa de chuva pequena"],
    4: ["Roupa leve", "Casaco fino para a noite", "Protetor solar"],
    5: ["Roupa leve e chapéu", "Protetor solar", "Repelente"]
  };

  // REGIOES só guarda verão e inverno: os outros meses são estimados por uma
  // curva suave com o pico em janeiro e o vale em julho.
  function temperaturaDoMes(clima, mes) {
    var media = (clima.verao + clima.inverno) / 2;
    var amplitude = (clima.verao - clima.inverno) / 2;
    return Math.round(media + amplitude * Math.cos((mes - 1) / 12 * 2 * Math.PI));
  }

  function criarElemento(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function iniciarPlanejador() {
    var bloco = document.querySelector("[data-planejador]");
    if (!bloco) return;

    var campoMes = bloco.querySelector("[data-planejador-mes]");
    var campoInteresse = bloco.querySelector("[data-planejador-interesse]");
    var status = bloco.querySelector("[data-planejador-status]");
    var resultado = bloco.querySelector("[data-planejador-resultado]");

    NOMES_MESES.forEach(function (nome, i) {
      var opcao = criarElemento("option", "", nome);
      opcao.value = String(i + 1);
      campoMes.appendChild(opcao);
    });
    Object.keys(INTERESSES).forEach(function (chave) {
      var opcao = criarElemento("option", "", INTERESSES[chave].nome);
      opcao.value = chave;
      campoInteresse.appendChild(opcao);
    });

    function festasDoMes(mes) {
      return FESTAS.filter(function (f) {
        return f.mes === mes;
      });
    }

    // Empate fica com a primeira na ordem do atlas (o sort mantém a ordem)
    function classificar(mes, interesse) {
      var festas = festasDoMes(mes);
      return ORDEM_REGIOES.map(function (chave) {
        var graus = temperaturaDoMes(REGIOES[chave].clima, mes);
        var quantas = festas.filter(function (f) {
          return f.regiao === chave;
        }).length;
        return {
          chave: chave,
          graus: graus,
          nota: interesse.pesos[chave] + quantas * interesse.pesoFesta + (graus - 20) / 5 * interesse.calor
        };
      }).sort(function (a, b) {
        return b.nota - a.nota;
      });
    }

    function adicionarDado(lista, rotulo, valor) {
      var linha = document.createElement("div");
      linha.appendChild(criarElemento("dt", "", rotulo));
      linha.appendChild(criarElemento("dd", "", valor));
      lista.appendChild(linha);
    }

    function desenhar(mes, chaveInteresse) {
      var interesse = INTERESSES[chaveInteresse];
      var ordem = classificar(mes, interesse);
      var primeira = ordem[0];
      var dados = REGIOES[primeira.chave];
      var nomeMes = NOMES_MESES[mes - 1];

      resultado.textContent = "";

      var foto = document.createElement("img");
      foto.className = "planejador__foto";
      foto.src = dados.foto.src;
      foto.alt = dados.foto.alt;
      foto.width = dados.foto.largura;
      foto.height = dados.foto.altura;
      resultado.appendChild(foto);

      var destino = criarElemento("div", "planejador__destino");
      destino.appendChild(criarElemento("p", "painel-regiao__sobre", "Sugestão para " + nomeMes.toLowerCase()));
      destino.appendChild(criarElemento("h3", "", dados.nome));
      destino.appendChild(criarElemento("p", "", interesse.nota(mes, primeira.chave)));

      var lista = criarElemento("dl", "painel-regiao__dados");
      adicionarDado(lista, "Temperatura estimada", "cerca de " + primeira.graus + " °C");
      adicionarDado(lista, "Também vale ir para", REGIOES[ordem[1].chave].nome);
      destino.appendChild(lista);
      destino.appendChild(criarElemento(
        "p", "planejador__nota",
        "Estimativa a partir das médias de verão e inverno da região. Não é previsão do tempo."
      ));

      var linkAtlas = criarElemento("a", "link-seta", "Ver " + dados.nome + " no atlas");
      linkAtlas.href = "cidades.html?regiao=" + primeira.chave + "#mapa";
      destino.appendChild(linkAtlas);
      resultado.appendChild(destino);

      // As festas da região sugerida vêm primeiro
      var festas = festasDoMes(mes).sort(function (a, b) {
        return (b.regiao === primeira.chave) - (a.regiao === primeira.chave);
      });
      var extras = criarElemento("div", "planejador__extras");
      extras.appendChild(criarElemento("h4", "", "O que acontece no mês"));
      var listaFestas = criarElemento("ul", "planejador__festas");
      festas.forEach(function (f) {
        var li = document.createElement("li");
        li.appendChild(criarElemento("strong", "", f.titulo));
        li.appendChild(document.createTextNode(" · " + f.lugar));
        listaFestas.appendChild(li);
      });
      extras.appendChild(listaFestas);

      var linkCalendario = criarElemento("a", "link-seta", "Ver " + nomeMes.toLowerCase() + " no calendário");
      linkCalendario.href = "cultura.html?mes=" + mes + "#calendario";
      extras.appendChild(linkCalendario);

      extras.appendChild(criarElemento("h4", "", "O que levar"));
      var listaMala = criarElemento("ul", "planejador__mala");
      MALA_POR_FAIXA[faixaDeClima(primeira.graus)].concat(interesse.levar).forEach(function (item) {
        listaMala.appendChild(criarElemento("li", "", item));
      });
      extras.appendChild(listaMala);
      resultado.appendChild(extras);

      status.textContent = "Sugestão: " + dados.nome + ", cerca de " + primeira.graus + " °C.";
    }

    // Guarda a escolha na URL para dar para compartilhar (mesmo cuidado do
    // calendário com file://)
    function aoMudar() {
      desenhar(Number(campoMes.value), campoInteresse.value);
      try {
        var busca = "?mes=" + campoMes.value + "&interesse=" + campoInteresse.value;
        window.history.replaceState(null, "", window.location.pathname + busca + "#planejador");
      } catch (e) {
        // segue sem guardar
      }
    }

    campoMes.addEventListener("change", aoMudar);
    campoInteresse.addEventListener("change", aoMudar);

    var mesPedido = /[?&]mes=(\d{1,2})/.exec(window.location.search);
    var interessePedido = /[?&]interesse=([a-z]+)/.exec(window.location.search);
    var mes = mesPedido ? Number(mesPedido[1]) : 0;
    campoMes.value = String(mes >= 1 && mes <= 12 ? mes : new Date().getMonth() + 1);
    campoInteresse.value = interessePedido && INTERESSES[interessePedido[1]] ? interessePedido[1] : "praia";

    desenhar(Number(campoMes.value), campoInteresse.value);
    bloco.hidden = false;
  }


  /* ========================================================================
     16. BUSCA NO SITE (todas as páginas) — diferencial 11
     Só existe com JS, então o botão e a janela são criados aqui em vez de
     repetidos no cabeçalho das seis páginas. O índice junta os dados que já
     existem (CIDADES, REGIOES, FESTAS) com a lista abaixo.
     ==================================================================== */
  var ENTRADAS_BUSCA = [
    { tipo: "Prato", titulo: "Cuca", descricao: "Bolo alemão com farofa doce, com receita", url: "panorama.html#prato-cuca" },
    { tipo: "Prato", titulo: "Marreco recheado", descricao: "Prato símbolo de Blumenau, com receita", url: "panorama.html#prato-marreco" },
    { tipo: "Prato", titulo: "Ostras e frutos do mar", descricao: "Cultivos das baías de Florianópolis, com receita", url: "panorama.html#prato-ostras" },
    { tipo: "Prato", titulo: "Sequência de camarão", descricao: "Tradição de Bombinhas e Penha, com receita", url: "panorama.html#prato-camarao" },
    { tipo: "Prato", titulo: "Pinhão e entrevero", descricao: "Panela de ferro dos tropeiros da serra, com receita", url: "panorama.html#prato-entrevero" },
    { tipo: "Prato", titulo: "Polenta e galeto", descricao: "Cozinha italiana do sul e do oeste, com receita", url: "panorama.html#prato-galeto" },
    { tipo: "Curiosidade", titulo: "O lugar mais frio do Brasil", descricao: "Urupema e São Joaquim, com geada e neve", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Capital nacional da ostra", descricao: "Florianópolis", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "A linha de Tordesilhas", descricao: "O marco em Laguna", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Pescaria com botos", descricao: "Laguna", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Bolshoi fora da Rússia", descricao: "A escola de balé de Joinville", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Vinho de altitude", descricao: "As vinícolas da serra", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Uma língua cooficial", descricao: "O pomerano em Pomerode", url: "curiosidades.html#cards" },
    { tipo: "Curiosidade", titulo: "Mais de 500 praias", descricao: "O litoral catarinense", url: "curiosidades.html#cards" },
    { tipo: "Seção", titulo: "Atlas interativo", descricao: "Mapa das seis regiões e clima no verão e no inverno", url: "cidades.html#mapa" },
    { tipo: "Seção", titulo: "Monte seu roteiro", descricao: "Paradas de viagem e distância entre as cidades", url: "cidades.html#mapa" },
    { tipo: "Seção", titulo: "Desafio do mapa", descricao: "Jogo: acerte onde fica cada cidade", url: "cidades.html#mapa" },
    { tipo: "Seção", titulo: "Comparador de cidades", descricao: "Duas cidades lado a lado", url: "cidades.html#comparar" },
    { tipo: "Seção", titulo: "Linha do tempo", descricao: "História e imigração, da ocupação indígena às festas", url: "cultura.html#linha-do-tempo" },
    { tipo: "Seção", titulo: "Festas, danças e manifestações", descricao: "Boi-de-mamão e outras tradições", url: "cultura.html#festas" },
    { tipo: "Seção", titulo: "Calendário de festas", descricao: "O que acontece em cada mês", url: "cultura.html#calendario" },
    { tipo: "Seção", titulo: "Sotaques e glossário", descricao: "Manezês, pomerano, talian e alemão de colônia", url: "cultura.html#heranca" },
    { tipo: "Seção", titulo: "Geografia e relevo", descricao: "Litoral, serra e planalto", url: "panorama.html#geografia" },
    { tipo: "Seção", titulo: "Economia", descricao: "Indústria, turismo e agronegócio", url: "panorama.html#economia" },
    { tipo: "Seção", titulo: "Gastronomia e receitas", descricao: "A mesa catarinense", url: "panorama.html#gastronomia" },
    { tipo: "Seção", titulo: "Clima e estações", descricao: "Temperaturas ao longo do ano", url: "turismo.html#clima" },
    { tipo: "Seção", titulo: "Vegetação e fauna", descricao: "Araucárias, baleia-franca e outros", url: "turismo.html#natureza" },
    { tipo: "Seção", titulo: "Galeria de fotos", descricao: "Litoral, serra, cidades e gastronomia", url: "turismo.html#galeria" },
    { tipo: "Seção", titulo: "Planejador de viagem", descricao: "Mês e interesse viram uma sugestão de região", url: "turismo.html#planejador" },
    { tipo: "Seção", titulo: "Roteiros de viagem", descricao: "Três formas de conhecer o estado", url: "turismo.html#roteiros" },
    { tipo: "Seção", titulo: "Quiz: qual Santa Catarina é a sua?", descricao: "Cinco perguntas e uma região", url: "curiosidades.html#quiz" },
    { tipo: "Seção", titulo: "Arquitetura enxaimel", descricao: "A casa que se monta como um quebra-cabeça", url: "curiosidades.html#enxaimel" },
    { tipo: "Seção", titulo: "Créditos das fotos", descricao: "Autor e licença de cada foto", url: "curiosidades.html#creditos" },
    { tipo: "Seção", titulo: "Fontes de pesquisa", descricao: "De onde vieram os dados do site", url: "index.html#fontes" }
  ];
  var MAXIMO_RESULTADOS = 12;

  // "Florianópolis" vira "florianopolis": a busca ignora acento e maiúscula
  function normalizar(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function montarIndiceDaBusca() {
    var indice = ENTRADAS_BUSCA.slice();

    Object.keys(CIDADES).forEach(function (id) {
      indice.push({
        tipo: "Cidade",
        titulo: CIDADES[id].nome,
        descricao: CIDADES[id].destaque,
        url: "cidades.html?cidade=" + id + "#mapa"
      });
    });

    ORDEM_REGIOES.forEach(function (chave) {
      var dados = REGIOES[chave];
      indice.push({
        tipo: "Região",
        titulo: dados.nome,
        descricao: dados.economia + " · herança " + dados.heranca.toLowerCase(),
        url: "cidades.html?regiao=" + chave + "#mapa"
      });
    });

    FESTAS.forEach(function (f) {
      indice.push({
        tipo: f.tipo,
        titulo: f.titulo,
        descricao: f.lugar + " · " + NOMES_MESES[f.mes - 1].toLowerCase(),
        url: "cultura.html?mes=" + f.mes + "#calendario"
      });
    });

    return indice.map(function (item) {
      item.tituloBusca = normalizar(item.titulo);
      item.textoBusca = normalizar(item.titulo + " " + item.tipo + " " + item.descricao);
      return item;
    });
  }

  function iniciarBusca() {
    var tema = document.querySelector(".cabecalho__interno .tema-botao");
    if (!tema || !window.HTMLDialogElement) return;

    var botao = criarElemento("button", "tema-botao busca-botao");
    botao.type = "button";
    botao.setAttribute("aria-label", "Buscar no site");
    botao.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">' +
      '<circle cx="10.5" cy="10.5" r="6.5"></circle><line x1="15.5" y1="15.5" x2="21" y2="21"></line></svg>';
    tema.parentNode.insertBefore(botao, tema);

    var janela = criarElemento("dialog", "busca");
    janela.setAttribute("aria-labelledby", "busca-titulo");
    janela.innerHTML =
      '<div class="busca__interno">' +
      '<div class="busca__topo">' +
      '<label class="painel-regiao__sobre" id="busca-titulo" for="busca-campo">Buscar no site</label>' +
      '<button class="busca__fechar" type="button" aria-label="Fechar a busca">×</button>' +
      "</div>" +
      '<input class="busca__campo" id="busca-campo" type="search" autocomplete="off" ' +
      'placeholder="Cidade, festa, prato...">' +
      '<p class="busca__status" role="status" aria-live="polite"></p>' +
      '<ul class="busca__resultados"></ul>' +
      "</div>";
    document.body.appendChild(janela);

    var campo = janela.querySelector(".busca__campo");
    var status = janela.querySelector(".busca__status");
    var lista = janela.querySelector(".busca__resultados");
    var indice = null;
    var DICA = "Experimente: Oktoberfest, neve, cuca ou Blumenau.";

    function pesquisar(consulta) {
      var palavras = normalizar(consulta).split(/\s+/).filter(Boolean);
      var inteira = palavras.join(" ");
      return indice
        .filter(function (item) {
          return palavras.every(function (p) {
            return item.textoBusca.indexOf(p) !== -1;
          });
        })
        .map(function (item) {
          // Título que começa com a busca, depois título com todas as palavras
          var nota = 0;
          if (item.tituloBusca.indexOf(inteira) === 0) {
            nota = 2;
          } else if (palavras.every(function (p) { return item.tituloBusca.indexOf(p) !== -1; })) {
            nota = 1;
          }
          return { item: item, nota: nota };
        })
        .sort(function (a, b) {
          return b.nota - a.nota;
        })
        .slice(0, MAXIMO_RESULTADOS)
        .map(function (r) {
          return r.item;
        });
    }

    function desenhar() {
      var consulta = campo.value.trim();
      lista.textContent = "";
      if (!consulta) {
        status.textContent = DICA;
        return;
      }

      var achados = pesquisar(consulta);
      achados.forEach(function (item) {
        var li = document.createElement("li");
        var link = criarElemento("a", "busca__resultado");
        link.href = item.url;
        link.appendChild(criarElemento("span", "busca__tipo", item.tipo));
        link.appendChild(criarElemento("span", "busca__nome", item.titulo));
        link.appendChild(criarElemento("span", "busca__descricao", item.descricao));
        li.appendChild(link);
        lista.appendChild(li);
      });

      if (!achados.length) {
        status.textContent = "Nada encontrado para “" + consulta + "”. " + DICA;
      } else {
        status.textContent = achados.length === 1 ? "1 resultado." : achados.length + " resultados.";
      }
    }

    function abrir() {
      if (janela.open) return;
      if (!indice) indice = montarIndiceDaBusca();
      desenhar();
      janela.showModal();
      campo.select();
    }

    botao.addEventListener("click", abrir);
    campo.addEventListener("input", desenhar);

    janela.querySelector(".busca__fechar").addEventListener("click", function () {
      janela.close();
    });

    janela.addEventListener("click", function (evento) {
      // Clique no fundo escurecido: o alvo é a própria janela, fora do miolo
      if (evento.target === janela) {
        janela.close();
        return;
      }
      // Fecha ao seguir um link, senão uma âncora da mesma página ficaria atrás
      if (evento.target.closest(".busca__resultado")) janela.close();
    });

    // Setas andam entre o campo e os resultados; Enter no campo abre o primeiro
    janela.addEventListener("keydown", function (evento) {
      var links = Array.prototype.slice.call(lista.querySelectorAll("a"));
      if (evento.target === campo && evento.key === "Enter") {
        evento.preventDefault();
        if (links[0]) links[0].click();
        return;
      }
      if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
      if (!links.length) return;
      evento.preventDefault();
      var posicao = links.indexOf(document.activeElement);
      var proxima = posicao + (evento.key === "ArrowDown" ? 1 : -1);
      if (proxima < 0) campo.focus();
      else if (links[proxima]) links[proxima].focus();
    });

    // Atalhos: "/" (fora de campos de texto) e Ctrl+K ou Cmd+K
    document.addEventListener("keydown", function (evento) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        abrir();
        return;
      }
      if (evento.key !== "/" || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      var alvo = evento.target;
      if (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      evento.preventDefault();
      abrir();
    });
  }


  /* ========================================================================
     17. GLOSSÁRIO DE SOTAQUES (cultura.html) — diferencial 12
     A lista inteira já vem no HTML. O JS só acrescenta o filtro por texto e
     por língua, com a mesma ideia da galeria.
     ==================================================================== */
  function iniciarGlossario() {
    var glossario = document.querySelector("[data-glossario]");
    if (!glossario) return;

    var controles = glossario.querySelector("[data-glossario-controles]");
    var campo = glossario.querySelector("[data-glossario-busca]");
    var botoes = glossario.querySelectorAll("[data-glossario-filtro]");
    var contador = glossario.querySelector("[data-glossario-contador]");
    var itens = Array.prototype.slice.call(glossario.querySelectorAll("[data-lingua]"));
    var lingua = "todas";

    function filtrar() {
      var palavras = normalizar(campo.value).split(/\s+/).filter(Boolean);
      var visiveis = 0;

      itens.forEach(function (item) {
        var texto = normalizar(item.textContent);
        var mostra =
          (lingua === "todas" || item.getAttribute("data-lingua") === lingua) &&
          palavras.every(function (p) {
            return texto.indexOf(p) !== -1;
          });
        item.hidden = !mostra;
        if (mostra) visiveis++;
      });

      botoes.forEach(function (botao) {
        botao.setAttribute("aria-pressed", String(botao.getAttribute("data-glossario-filtro") === lingua));
      });

      if (visiveis === 0) contador.textContent = "Nenhum termo encontrado.";
      else contador.textContent = visiveis === 1 ? "1 termo." : visiveis + " termos.";
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        lingua = botao.getAttribute("data-glossario-filtro");
        filtrar();
      });
    });
    campo.addEventListener("input", filtrar);

    controles.hidden = false;
    filtrar();
  }


  /* ========================================================================
     18. RECEITAS (panorama.html) — diferencial 13
     As receitas abrem com <details>, sem JS. O JS acrescenta os botões que
     mudam o número de porções e recalculam os ingredientes de cada uma.
     ==================================================================== */
  var FRACOES = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];

  // Pesos e volumes maiores viram número inteiro; o resto, fração de cozinha
  function formatarQuantidade(n) {
    if (n >= 20) return String(Math.round(n));
    var oitavos = Math.max(Math.round(n * 8), 1);
    var inteiro = Math.floor(oitavos / 8);
    var fracao = FRACOES[oitavos % 8];
    if (!inteiro) return fracao;
    return fracao ? inteiro + " " + fracao : String(inteiro);
  }

  function iniciarReceitas() {
    document.querySelectorAll("[data-receita]").forEach(function (receita) {
      var base = Number(receita.getAttribute("data-porcoes"));
      var passo = Number(receita.getAttribute("data-passo"));
      var rende = receita.querySelector("[data-rende]");
      var numero = receita.querySelector("[data-rende-numero]");
      var quantidades = receita.querySelectorAll("[data-qtd]");
      if (!base || !passo || !rende || !numero) return;

      var maximo = base * 3;
      var atual = base;

      var controle = criarElemento("div", "receita__porcoes");
      controle.setAttribute("role", "group");
      controle.setAttribute("aria-label", "Ajustar o rendimento da receita");
      var menos = criarElemento("button", "receita__botao", "−");
      menos.type = "button";
      menos.setAttribute("aria-label", "Diminuir o rendimento");
      var mais = criarElemento("button", "receita__botao", "+");
      mais.type = "button";
      mais.setAttribute("aria-label", "Aumentar o rendimento");
      controle.appendChild(menos);
      controle.appendChild(mais);
      rende.parentNode.insertBefore(controle, rende.nextSibling);
      rende.setAttribute("aria-live", "polite");

      function atualizar(novo) {
        atual = novo;
        numero.textContent = String(atual);
        quantidades.forEach(function (el) {
          var n = Number(el.getAttribute("data-qtd")) * atual / base;
          var nome = el.getAttribute(n <= 1 ? "data-um" : "data-varios");
          el.textContent = formatarQuantidade(n) + " " + nome;
        });
        menos.disabled = atual - passo < passo;
        mais.disabled = atual + passo > maximo;
      }

      menos.addEventListener("click", function () {
        atualizar(atual - passo);
      });
      mais.addEventListener("click", function () {
        atualizar(atual + passo);
      });

      atualizar(base);
    });
  }


  /* ========================================================================
     INICIALIZAÇÃO
     ==================================================================== */
  function iniciar() {
    iniciarMenu();
    iniciarTema();
    iniciarBanner();
    iniciarFlipCards();
    iniciarEscalaDosMapas();
    iniciarAtlas();
    iniciarLinhaTempo();
    iniciarGaleria();
    iniciarRevelar();
    iniciarVoltarTopo();
    iniciarAno();
    iniciarPassaporte();
    iniciarQuiz();
    iniciarCalendario();
    iniciarComparador();
    iniciarPlanejador();
    iniciarBusca();
    iniciarGlossario();
    iniciarReceitas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
