/* ==========================================================================
   TERRA CATARINENSE — JavaScript único (vanilla, sem bibliotecas)
   Projeto escolar — Técnico em Informática / Front-End
   IFMT Campus Várzea Grande — Ronaldo Heitor Marques de Oliveira — 4 INF

   MÓDULOS (cada um só roda se os elementos existirem na página)
   01. Marcação "js" no <html>
   02. Menu sticky (hamburguer no mobile)
   03. Banner rotativo (index.html)
   04. Flip cards (toque/clique/teclado)
   05. Mapa interativo de regiões (cidades.html)
   06. Linha do tempo com scroll-reveal (cultura.html)
   07. Galeria com filtro por categoria (turismo.html)
   08. Scroll-reveal genérico
   09. Botão voltar ao topo
   10. Ano automático no rodapé
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

    cards.forEach(function (gatilho) {
      var card = gatilho.closest(".flip-card");
      if (!card) return;

      gatilho.addEventListener("click", function () {
        var virado = card.classList.toggle("flip-card--virado");
        gatilho.setAttribute("aria-expanded", String(virado));
      });
    });
  }


  /* ========================================================================
     05. MAPA INTERATIVO DE REGIÕES (cidades.html)
     Clicar numa região do SVG (ou no botão equivalente) troca o painel
     lateral sem recarregar a página.
     ==================================================================== */
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
        "Só na Ilha de Santa Catarina são mais de 40 praias — e o estado passa das 500 no total."
    },
    vale: {
      nome: "Vale do Itajaí",
      resumo:
        "Coração da imigração alemã e italiana, com arquitetura enxaimel, indústria têxtil forte e as maiores festas germânicas do país.",
      cidades: ["Blumenau", "Pomerode", "Brusque", "Timbó", "Indaial"],
      curiosidade:
        "Pomerode é conhecida como a cidade mais alemã do Brasil: boa parte da população ainda fala o dialeto pomerano."
    },
    norte: {
      nome: "Norte / Nordeste",
      resumo:
        "Maior polo industrial e metalmecânico do estado, com portos, escolas técnicas e a maior cidade catarinense em população.",
      cidades: ["Joinville", "São Bento do Sul", "Jaraguá do Sul", "São Francisco do Sul"],
      curiosidade:
        "São Francisco do Sul é uma das cidades mais antigas do Brasil e tem centro histórico tombado."
    },
    serra: {
      nome: "Planalto Serrano",
      resumo:
        "Região de altitude coberta por araucárias, com clima subtropical de altitude, tradição campeira e o inverno mais rigoroso do país.",
      cidades: ["Lages", "São Joaquim", "Urubici", "Urupema", "Bom Jardim da Serra"],
      curiosidade:
        "Urupema e São Joaquim disputam o título de cidade mais fria do Brasil, com marcas abaixo de -8 °C."
    },
    oeste: {
      nome: "Oeste",
      resumo:
        "Motor do agronegócio catarinense: aves, suínos e cooperativas. Colonização vinda do Rio Grande do Sul, de origem italiana e alemã.",
      cidades: ["Chapecó", "Concórdia", "Xanxerê", "São Miguel do Oeste"],
      curiosidade:
        "O oeste ajuda a fazer de Santa Catarina o maior exportador de carne de porco do Brasil."
    },
    sul: {
      nome: "Sul",
      resumo:
        "Região de carvão, cerâmica e descendência italiana, com praias tranquilas, dunas e as encostas da Serra do Rio do Rastro.",
      cidades: ["Criciúma", "Tubarão", "Laguna", "Araranguá"],
      curiosidade:
        "Laguna guarda o marco do Tratado de Tordesilhas e foi capital da efêmera República Juliana, em 1839."
    }
  };

  function iniciarMapaInterativo() {
    var painel = document.querySelector("[data-painel-regiao]");
    var gatilhos = document.querySelectorAll("[data-regiao]");
    if (!painel || !gatilhos.length) return;

    var elNome = painel.querySelector("[data-regiao-nome]");
    var elResumo = painel.querySelector("[data-regiao-resumo]");
    var elCidades = painel.querySelector("[data-regiao-cidades]");
    var elCuriosidade = painel.querySelector("[data-regiao-curiosidade]");

    function selecionar(chave) {
      var dados = REGIOES[chave];
      if (!dados) return;

      if (elNome) elNome.textContent = dados.nome;
      if (elResumo) elResumo.textContent = dados.resumo;

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

      // Marca o estado em TODOS os gatilhos da mesma região (mapa + botão)
      gatilhos.forEach(function (gatilho) {
        var ativo = gatilho.getAttribute("data-regiao") === chave;
        gatilho.setAttribute("aria-pressed", String(ativo));
        gatilho.classList.toggle("regiao--ativa", ativo);
      });
    }

    gatilhos.forEach(function (gatilho) {
      gatilho.addEventListener("click", function () {
        selecionar(gatilho.getAttribute("data-regiao"));
      });

      // Só os <path> do SVG precisam disso: um <button> nativo já dispara
      // click com Enter/Espaço, e o handler duplicado fazia Enter selecionar
      // duas vezes enquanto Espaço selecionava uma.
      if (gatilho.tagName.toLowerCase() === "button") return;

      gatilho.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          selecionar(gatilho.getAttribute("data-regiao"));
        }
      });
    });

    // Região inicial
    selecionar(painel.getAttribute("data-painel-regiao") || "litoral");
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
     INICIALIZAÇÃO
     ==================================================================== */
  function iniciar() {
    iniciarMenu();
    iniciarBanner();
    iniciarFlipCards();
    iniciarMapaInterativo();
    iniciarLinhaTempo();
    iniciarGaleria();
    iniciarRevelar();
    iniciarVoltarTopo();
    iniciarAno();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
