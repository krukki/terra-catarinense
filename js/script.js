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
   05. Atlas interativo: zoom, clima e roteiro (cidades.html)
   06. Linha do tempo com scroll-reveal (cultura.html)
   07. Galeria com filtro por categoria (turismo.html)
   08. Scroll-reveal genérico
   09. Botão voltar ao topo
   10. Ano automático no rodapé
   11. Passaporte catarinense (rodapé)
   12. Quiz "Qual Santa Catarina é a sua?" (curiosidades.html)
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
     roteiro, em que os pinos das cidades viram paradas de viagem.
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

    // Pinos: posição (do transform) e coordenadas reais (dos data-*)
    var pinos = Array.prototype.map.call(
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

      gatilho.addEventListener("click", function () {
        selecionar(chave, true);
      });

      // Só os <path> do SVG precisam do resto: um <button> nativo já
      // dispara click com Enter/Espaço.
      if (gatilho.tagName.toLowerCase() === "button") return;

      gatilho.addEventListener("pointermove", function (evento) {
        moverDica(evento, chave);
      });
      gatilho.addEventListener("pointerleave", esconderDica);

      gatilho.addEventListener("keydown", function (evento) {
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

      // Recupera o roteiro salvo, descartando ids que não existem mais
      var salvo = lerGuardado(CHAVE_ROTEIRO);
      if (Array.isArray(salvo)) {
        paradas = salvo.filter(function (id) {
          return Object.prototype.hasOwnProperty.call(pinoPorId, id);
        });
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
      };

      var salvarRoteiro = function () {
        guardar(CHAVE_ROTEIRO, paradas);
      };

      var adicionarParada = function (id) {
        if (!pinoPorId[id]) return;
        // Clicar duas vezes na mesma cidade não cria uma parada repetida
        if (paradas[paradas.length - 1] === id) return;
        paradas.push(id);
        salvarRoteiro();
        desenharRoteiro();
      };

      var ligarModoRota = function (ligar) {
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
    }

    /* --- Estado inicial --- */
    ajustarZoomDoMapa(svg);
    atualizarEscala(ajustarZoomDoMapa(svg));

    // cidades.html?regiao=serra#mapa (link do quiz) já abre aproximado
    var pedida = /[?&]regiao=([a-z]+)/.exec(window.location.search);
    if (pedida && REGIOES[pedida[1]]) {
      selecionar(pedida[1], true);
    } else {
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
     Cada página visitada rende um carimbo, e terminar o quiz rende outro.
     Tudo fica no localStorage do navegador; se ele estiver bloqueado, o
     bloco continua escondido e nada quebra.
     ==================================================================== */
  var CARIMBOS = [
    { id: "inicio", nome: "Início", icone: "✦" },
    { id: "panorama", nome: "Panorama", icone: "▲" },
    { id: "cidades", nome: "Cidades", icone: "◉" },
    { id: "cultura", nome: "Cultura", icone: "✿" },
    { id: "turismo", nome: "Turismo", icone: "☀" },
    { id: "curiosidades", nome: "Curiosidades", icone: "?" },
    { id: "quiz", nome: "Quiz", icone: "★" }
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
    if (existe) {
      carimbarPassaporte(pagina);
    } else {
      desenhar();
    }
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
