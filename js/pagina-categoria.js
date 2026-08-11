/* PÁGINAS ESPECIAIS: seção padrão e seção com duas galerias */

let secoesCategoriaAtual = [];
let temasSelecionadosPagina = new Set();
let termoBuscaPagina = "";

function normalizarTemaPagina(tema) {
    return (tema || "").trim().toLocaleLowerCase("pt-BR");
}

function normalizarBuscaPagina(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR");
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function escaparAtributo(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function obterImagensValidas(imagens) {
    if (!Array.isArray(imagens)) return [];

    return imagens
        .filter(imagem => imagem && typeof imagem.url === "string" && imagem.url.trim())
        .map(imagem => ({
            ...imagem,
            nome: String(imagem.nome || "Imagem do produto"),
            url: imagem.url.trim()
        }));
}

function obterImagensVariacao(secao, variacao, usarFallback = true) {
    const imagensVariacao = obterImagensValidas(variacao?.imagens);
    if (imagensVariacao.length) return imagensVariacao;
    return usarFallback ? obterImagensValidas(secao.imagens) : [];
}

function aplicarTransformacaoCloudinary(url, transformacao) {
    if (!url || !/res\.cloudinary\.com\//i.test(url) || !url.includes("/upload/")) {
        return url || "";
    }

    return url.replace("/upload/", `/upload/${transformacao}/`);
}

function obterUrlMiniaturaPagina(imagem) {
    if (!imagem) return "";
    if (imagem.miniatura) return imagem.miniatura;
    return aplicarTransformacaoCloudinary(
        imagem.url || "",
        "w_160,h_160,c_fill,g_auto,q_auto:eco,f_auto,dpr_auto"
    );
}

function obterUrlImagemPrincipal(imagem) {
    return aplicarTransformacaoCloudinary(
        imagem?.url || "",
        "w_1000,h_1000,c_limit,q_auto:good,f_auto"
    );
}

const IMAGEM_INDISPONIVEL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <rect width="600" height="600" fill="#f3f4f6"/>
        <g fill="none" stroke="#9ca3af" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
            <rect x="135" y="155" width="330" height="255" rx="24"/>
            <circle cx="240" cy="245" r="35"/>
            <path d="M160 380l105-100 70 65 45-42 60 77"/>
        </g>
        <text x="300" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#6b7280">Imagem indisponível</text>
    </svg>
`)}`;

function configurarFallbackImagem(img) {
    if (!img || img.dataset.fallbackConfigurado === "1") return;
    img.dataset.fallbackConfigurado = "1";

    img.addEventListener("error", () => {
        const original = img.dataset.originalSrc || "";
        const atual = img.getAttribute("src") || "";

        if (original && img.dataset.fallbackOriginalUsado !== "1" && atual !== original) {
            img.dataset.fallbackOriginalUsado = "1";
            img.src = original;
            return;
        }

        console.warn("Não foi possível carregar a imagem:", original || atual);
        img.classList.add("imagem-com-erro");

        if (img.classList.contains("miniatura-galeria")) {
            img.hidden = true;
            return;
        }

        if (atual !== IMAGEM_INDISPONIVEL) {
            img.src = IMAGEM_INDISPONIVEL;
        }
    });
}

function carregarImagemElemento(img) {
    if (!img) return;
    configurarFallbackImagem(img);

    if (!img.getAttribute("src") && img.dataset.src) {
        img.src = img.dataset.src;
    }
}

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function montarMensagemSecao(secao, variacao, imagemProduto, imagemVariacao) {
    const modeloPadrao =
        "Olá! Tenho interesse no produto {produto}.\nVariação: {opcao}.\nPreço: {preco}.\nImagem do produto: {imagem_produto}.\nImagem da variação: {imagem_variacao}.";

    const modelo = secao.mensagemWhatsapp?.trim() || modeloPadrao;
    const imagemPreferencial = imagemVariacao || imagemProduto;

    const texto = modelo
        .replaceAll("{produto}", secao.nome || "")
        .replaceAll("{opcao}", variacao?.nome || "")
        .replaceAll("{preco}", variacao ? formatarPreco(variacao.preco) : "")
        .replaceAll("{imagem}", imagemPreferencial?.nome || "")
        .replaceAll("{imagem_produto}", imagemProduto?.nome || "")
        .replaceAll("{imagem_variacao}", imagemVariacao?.nome || "");

    return encodeURIComponent(texto);
}

function criarSlidesHTML(imagens) {
    if (!imagens.length) {
        return '<div class="galeria-vazia">Nenhuma imagem cadastrada.</div>';
    }

    return imagens.map((imagem, indice) => {
        const urlOtimizada = obterUrlImagemPrincipal(imagem);
        const urlOriginal = imagem.url || "";
        const fonteInicial = `data-src="${escaparAtributo(urlOtimizada)}"`;

        return `
        <img ${fonteInicial} data-original-src="${escaparAtributo(urlOriginal)}"
             alt="${escaparAtributo(imagem.nome)}"
             class="imagem-slide ${indice === 0 ? "ativo" : ""}" data-indice="${indice}"
             decoding="async" loading="${indice === 0 ? "eager" : "lazy"}"
             fetchpriority="${indice === 0 ? "high" : "low"}">`;
    }).join("");
}

function criarIndicadoresHTML(imagens) {
    return imagens.map((imagem, indice) => {
        const miniatura = obterUrlMiniaturaPagina(imagem);
        const fonteInicial = `data-src="${escaparAtributo(miniatura)}"`;

        return `
        <img ${fonteInicial} data-original-src="${escaparAtributo(imagem.url || "")}"
             alt="${escaparAtributo(imagem.nome)}" title="${escaparAtributo(imagem.nome)}"
             class="miniatura-galeria ${indice === 0 ? "ativo" : ""}"
             data-indice="${indice}" width="56" height="56" loading="lazy"
             decoding="async" fetchpriority="low">`;
    }).join("");
}

function criarGaleriaHTML(secaoId, chave, titulo, imagens) {
    return `
        <div class="galeria-especial" data-galeria="${chave}" data-secao="${secaoId}">
            ${titulo ? `<h3 class="titulo-galeria-especial">${escaparHtml(titulo)}</h3>` : ""}
            <div class="slider-wrapper">
                <div class="slider-modal" data-slider="${chave}">${criarSlidesHTML(imagens)}</div>
                <button type="button" class="seta-galeria seta-anterior" data-direcao="-1" aria-label="Imagem anterior">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button type="button" class="seta-galeria seta-proxima" data-direcao="1" aria-label="Próxima imagem">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            <div class="indicadores-modal" data-indicadores="${chave}">${criarIndicadoresHTML(imagens)}</div>
        </div>`;
}

function criarVariacoesHTML(secao) {
    return (secao.variacoes || []).map((variacao, indice) => `
        <label class="opcao-variacao${indice === 0 ? " selecionada" : ""}" data-indice="${indice}">
            <input type="radio" name="variacao-${secao.id}" ${indice === 0 ? "checked" : ""}>
            <div class="conteudo-variacao"><strong>${escaparHtml(variacao.nome)}</strong></div>
            <span class="preco-variacao">${formatarPreco(variacao.preco)}</span>
        </label>`).join("");
}

function criarSecaoHTML(secao) {
    const variacoes = secao.variacoes || [];
    const variacaoInicial = variacoes[0] || null;
    const duasGalerias = secao.tipo === "duas-galerias";

    const areaGalerias = duasGalerias
        ? `<div class="duas-galerias-especiais">
              ${criarGaleriaHTML(secao.id, "produto", secao.tituloGaleriaPrincipal || "Fotos do Produto", obterImagensValidas(secao.imagens))}
              ${criarGaleriaHTML(secao.id, "variacao", secao.tituloGaleriaVariacao || "Fotos da Variação Selecionada", obterImagensVariacao(secao, variacaoInicial, false))}
           </div>`
        : criarGaleriaHTML(secao.id, "padrao", "", obterImagensVariacao(secao, variacaoInicial));

    return `
        <section class="secao-produtos secao-especial ${duasGalerias ? "secao-duas-galerias" : "secao-padrao"}" id="secao-${secao.id}">
            <div class="container">
                <div class="titulo-secao"><h2>${escaparHtml(secao.nome)}</h2></div>
                <div class="bloco-secao-especial">
                    <div class="modal-imagens">${areaGalerias}</div>
                    <div class="modal-info">
                        <h3 style="margin-bottom:10px;">Escolha uma opção</h3>
                        <div class="lista-modal-variacoes">${criarVariacoesHTML(secao)}</div>
                        <a class="botao-whatsapp" target="_blank" rel="noopener" href="#">Pedir no WhatsApp</a>
                    </div>
                </div>
            </div>
        </section>`;
}

function criarControladorGaleria(elemento, imagensIniciais, aoSelecionar) {
    if (!elemento) {
        return { definirImagens() {}, imagemAtual() { return null; } };
    }

    const slider = elemento.querySelector(".slider-modal");
    const indicadores = elemento.querySelector(".indicadores-modal");
    const setas = elemento.querySelectorAll(".seta-galeria");
    const estado = { imagens: obterImagensValidas(imagensIniciais), indice: 0 };
    let observadorMiniaturas = null;

    function imagemAtual() {
        return estado.imagens[estado.indice] || null;
    }

    function atualizarControles() {
        const mostrar = estado.imagens.length > 1;
        setas.forEach(seta => seta.style.display = mostrar ? "flex" : "none");
        if (indicadores) indicadores.style.display = mostrar ? "flex" : "none";
    }

    function carregarSlide(indice) {
        const img = slider?.querySelector(`img[data-indice="${indice}"]`);
        carregarImagemElemento(img);
    }

    function prepararSlides() {
        slider?.querySelectorAll("img.imagem-slide").forEach(configurarFallbackImagem);
        carregarSlide(estado.indice);
    }

    function prepararMiniaturas() {
        observadorMiniaturas?.disconnect();
        observadorMiniaturas = null;

        const miniaturas = Array.from(indicadores?.querySelectorAll("img.miniatura-galeria") || []);
        miniaturas.forEach(configurarFallbackImagem);
        carregarImagemElemento(miniaturas[estado.indice]);

        if (!("IntersectionObserver" in window)) {
            miniaturas.forEach(carregarImagemElemento);
            return;
        }

        observadorMiniaturas = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                carregarImagemElemento(entrada.target);
                observadorMiniaturas?.unobserve(entrada.target);
            });
        }, { root: null, rootMargin: "300px 120px", threshold: 0.01 });

        miniaturas.forEach(img => {
            if (img.getAttribute("src")) return;
            observadorMiniaturas.observe(img);
        });
    }

    function ligarMiniaturas() {
        indicadores?.querySelectorAll("img.miniatura-galeria").forEach(img => {
            img.addEventListener("click", () => selecionar(Number(img.dataset.indice)));
        });
        prepararMiniaturas();
    }

    function selecionar(indice) {
        if (!estado.imagens.length) return;
        if (indice < 0) indice = estado.imagens.length - 1;
        if (indice >= estado.imagens.length) indice = 0;

        estado.indice = indice;
        carregarSlide(indice);

        // Depois da escolha do usuário, deixa apenas as vizinhas prontas.
        if (estado.imagens.length > 1) {
            carregarSlide((indice + 1) % estado.imagens.length);
            carregarSlide((indice - 1 + estado.imagens.length) % estado.imagens.length);
        }

        slider?.querySelectorAll("img.imagem-slide").forEach(img => {
            img.classList.toggle("ativo", Number(img.dataset.indice) === indice);
        });
        indicadores?.querySelectorAll("img.miniatura-galeria").forEach(img => {
            img.classList.toggle("ativo", Number(img.dataset.indice) === indice);
        });

        const miniaturaSelecionada = indicadores?.querySelector(`img[data-indice="${indice}"]`);
        carregarImagemElemento(miniaturaSelecionada);
        miniaturaSelecionada?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        aoSelecionar?.(imagemAtual());
    }

    function definirImagens(imagens) {
        estado.imagens = obterImagensValidas(imagens);
        estado.indice = 0;
        if (slider) slider.innerHTML = criarSlidesHTML(estado.imagens);
        if (indicadores) indicadores.innerHTML = criarIndicadoresHTML(estado.imagens);
        prepararSlides();
        ligarMiniaturas();
        atualizarControles();
        aoSelecionar?.(imagemAtual());
    }

    setas.forEach(seta => {
        seta.addEventListener("click", () => selecionar(estado.indice + Number(seta.dataset.direcao)));
    });

    prepararSlides();
    ligarMiniaturas();
    atualizarControles();

    return { definirImagens, imagemAtual };
}

function inicializarSecao(secao) {
    const raiz = document.getElementById(`secao-${secao.id}`);
    if (!raiz) return;

    const duasGalerias = secao.tipo === "duas-galerias";
    const variacoes = secao.variacoes || [];
    const botaoWhatsapp = raiz.querySelector(".botao-whatsapp");
    const listaVariacoes = raiz.querySelector(".lista-modal-variacoes");
    let variacaoAtual = variacoes[0] || null;
    let imagemProduto = obterImagensValidas(secao.imagens)[0] || null;
    let imagemVariacao = duasGalerias
        ? (obterImagensVariacao(secao, variacaoAtual, false)[0] || null)
        : (obterImagensVariacao(secao, variacaoAtual)[0] || null);

    function atualizarWhatsapp() {
        const numero = CONFIG.empresa.whatsapp;
        botaoWhatsapp.href = `https://wa.me/${numero}?text=${montarMensagemSecao(secao, variacaoAtual, imagemProduto, imagemVariacao)}`;
    }

    let galeriaProduto = null;
    let galeriaVariacao = null;
    let galeriaPadrao = null;

    if (duasGalerias) {
        galeriaProduto = criarControladorGaleria(
            raiz.querySelector('[data-galeria="produto"]'),
            obterImagensValidas(secao.imagens),
            imagem => { imagemProduto = imagem; atualizarWhatsapp(); }
        );
        galeriaVariacao = criarControladorGaleria(
            raiz.querySelector('[data-galeria="variacao"]'),
            obterImagensVariacao(secao, variacaoAtual, false),
            imagem => { imagemVariacao = imagem; atualizarWhatsapp(); }
        );
    } else {
        galeriaPadrao = criarControladorGaleria(
            raiz.querySelector('[data-galeria="padrao"]'),
            obterImagensVariacao(secao, variacaoAtual),
            imagem => { imagemVariacao = imagem; atualizarWhatsapp(); }
        );
        imagemProduto = null;
    }

    listaVariacoes?.querySelectorAll(".opcao-variacao").forEach(opcao => {
        opcao.addEventListener("click", () => {
            const indice = Number(opcao.dataset.indice);
            variacaoAtual = variacoes[indice] || null;
            listaVariacoes.querySelectorAll(".opcao-variacao").forEach(item => item.classList.remove("selecionada"));
            opcao.classList.add("selecionada");
            const radio = opcao.querySelector("input");
            if (radio) radio.checked = true;

            if (duasGalerias) {
                galeriaVariacao.definirImagens(obterImagensVariacao(secao, variacaoAtual, false));
            } else {
                galeriaPadrao.definirImagens(obterImagensVariacao(secao, variacaoAtual));
            }
            atualizarWhatsapp();
        });
    });

    atualizarWhatsapp();
}

/* ==========================================================
   FILTRO DE TEMAS
   Mostra, acima das seções, os mesmos botões de tema usados
   na página de categoria comum — mas só os temas que estiverem
   atribuídos a alguma seção desta página especial.
========================================================== */

function renderizarSecoesNaTela(secoes) {
    const contentor = document.getElementById("secoes-personalizadas");

    if (!secoes.length) {
        contentor.innerHTML = '<div class="container"><p>Nenhum produto encontrado para este tema.</p></div>';
        return;
    }

    // A primeira seção é montada de imediato (evita tela em branco no topo
    // enquanto o usuário ainda não rolou a página).
    //
    // As demais seções só são montadas (HTML + galerias) quando chegam perto
    // da tela. Isso evita criar de uma vez centenas de elementos <img> de
    // seções que estão lá embaixo — algumas variações têm mais de 100 fotos.
    const [primeiraSecao, ...demaisSecoes] = secoes;

    const placeholdersHTML = demaisSecoes
        .map(secao => `<div class="placeholder-secao-especial" data-secao-lazy="${secao.id}"></div>`)
        .join("");

    contentor.innerHTML = criarSecaoHTML(primeiraSecao) + placeholdersHTML;
    inicializarSecao(primeiraSecao);

    if (!demaisSecoes.length) return;

    function montarSecaoNoPlaceholder(placeholder, secao) {
        placeholder.outerHTML = criarSecaoHTML(secao);
        inicializarSecao(secao);
    }

    if (!("IntersectionObserver" in window)) {
        // Sem suporte ao IntersectionObserver: mantém o comportamento antigo.
        demaisSecoes.forEach(secao => {
            const placeholder = contentor.querySelector(`[data-secao-lazy="${secao.id}"]`);
            if (placeholder) montarSecaoNoPlaceholder(placeholder, secao);
        });
        return;
    }

    const secoesPorId = new Map(demaisSecoes.map(secao => [secao.id, secao]));

    const observadorSecoes = new IntersectionObserver((entradas, obs) => {
        entradas.forEach(entrada => {
            if (!entrada.isIntersecting) return;
            obs.unobserve(entrada.target);
            const secao = secoesPorId.get(entrada.target.dataset.secaoLazy);
            if (secao) montarSecaoNoPlaceholder(entrada.target, secao);
        });
    }, { root: null, rootMargin: "600px 0px", threshold: 0.01 });

    contentor.querySelectorAll("[data-secao-lazy]").forEach(placeholder => {
        observadorSecoes.observe(placeholder);
    });
}

function aplicarFiltroTemasPagina() {
    let secoesFiltradas = secoesCategoriaAtual;

    if (temasSelecionadosPagina.size > 0) {
        secoesFiltradas = secoesFiltradas.filter(secao =>
            (secao.temas || []).some(tema =>
                temasSelecionadosPagina.has(normalizarTemaPagina(tema))
            )
        );
    }

    if (termoBuscaPagina) {
        secoesFiltradas = secoesFiltradas.filter(secao => {
            const textoPesquisavel = [
                secao.nome,
                ...(secao.temas || []),
                ...(secao.variacoes || []).map(variacao => variacao.nome),
                ...obterImagensValidas(secao.imagens).map(imagem => imagem.nome),
                ...(secao.variacoes || []).flatMap(variacao =>
                    obterImagensValidas(variacao.imagens).map(imagem => imagem.nome)
                )
            ].join(" ");

            return normalizarBuscaPagina(textoPesquisavel).includes(termoBuscaPagina);
        });
    }

    renderizarSecoesNaTela(secoesFiltradas);
}

window.buscarProdutosCatalogo = function buscarProdutosPaginaEspecial(termo) {
    termoBuscaPagina = normalizarBuscaPagina(termo);
    aplicarFiltroTemasPagina();
};

function atualizarBotoesTemasPagina() {
    document.querySelectorAll("#filtros-temas .filtro-tema").forEach(botao => {
        const tema = botao.dataset.tema;
        const estaAtivo = tema === ""
            ? temasSelecionadosPagina.size === 0
            : temasSelecionadosPagina.has(normalizarTemaPagina(tema));
        botao.classList.toggle("ativo", estaAtivo);
    });
}

function alternarTemaPagina(tema) {
    const temaNormalizado = normalizarTemaPagina(tema);

    if (temaNormalizado === "") {
        temasSelecionadosPagina.clear();
    } else if (temasSelecionadosPagina.has(temaNormalizado)) {
        // Clicou no mesmo tema já selecionado – desmarca (volta para "Todos")
        temasSelecionadosPagina.clear();
    } else {
        // Seleção única – substitui o que estava marcado
        temasSelecionadosPagina.clear();
        temasSelecionadosPagina.add(temaNormalizado);
    }

    aplicarFiltroTemasPagina();
    atualizarBotoesTemasPagina();
}

function renderizarFiltrosTemasPagina(temas) {
    const filtros = document.getElementById("filtros-temas");
    if (!filtros) return;

    filtros.innerHTML = "";

    if (!temas.length) return;

    const criarBotao = (nome, valor) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "filtro-tema";
        botao.textContent = nome;
        botao.dataset.tema = valor;
        botao.onclick = () => alternarTemaPagina(valor);
        filtros.appendChild(botao);
    };

    criarBotao("Todos", "");
    temas.forEach(tema => criarBotao(tema, tema));

    temasSelecionadosPagina.clear();
    atualizarBotoesTemasPagina();
}

async function carregarJsonPagina(caminho, opcional = false) {
    try {
        const resposta = await fetch(caminho, { cache: "no-store" });
        if (!resposta.ok) {
            throw new Error(`${caminho}: HTTP ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        if (opcional) {
            console.warn(`Arquivo opcional não carregado (${caminho}):`, erro);
            return [];
        }
        throw erro;
    }
}

async function carregarPaginaCategoria() {
    const categoriaId = new URLSearchParams(window.location.search).get("categoria");
    const contentor = document.getElementById("secoes-personalizadas");
    const tituloPagina = document.getElementById("titulo-pagina-categoria");
    const tituloAba = document.getElementById("titulo-aba");

    if (!categoriaId) {
        contentor.innerHTML = '<div class="container"><p>Nenhuma categoria foi informada no link.</p></div>';
        return;
    }

    try {
        const [categorias, secoes, temas] = await Promise.all([
            carregarJsonPagina("data/categorias.json"),
            carregarJsonPagina("data/secoes.json"),
            carregarJsonPagina("data/temas-paginas.json", true)
        ]);
        const categoria = categorias.find(c => c.id === categoriaId);
        const nomeCategoria = categoria ? categoria.nome : categoriaId;
        if (tituloPagina) tituloPagina.textContent = nomeCategoria;
        if (tituloAba) tituloAba.textContent = `${nomeCategoria} - IMPEL`;

        const secoesCategoria = secoes.filter(s => s.categoria === categoriaId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        secoesCategoriaAtual = secoesCategoria;
        temasSelecionadosPagina = new Set();
        termoBuscaPagina = "";

        if (!secoesCategoria.length) {
            contentor.innerHTML = '<div class="container"><p>Nenhum produto cadastrado nesta página especial ainda.</p></div>';
            return;
        }

        // Só mostra no filtro os temas que realmente estão em uso
        // por alguma seção desta página, mantendo a ordem cadastrada
        // em "Temas do filtro".
        const temasEmUso = new Set();
        secoesCategoria.forEach(secao => {
            (secao.temas || []).forEach(tema => temasEmUso.add(normalizarTemaPagina(tema)));
        });

        const temasParaFiltro = (Array.isArray(temas) ? temas : [])
            .filter(tema => temasEmUso.has(normalizarTemaPagina(tema)));

        renderizarFiltrosTemasPagina(temasParaFiltro);
        aplicarFiltroTemasPagina();
    } catch (erro) {
        console.error("Erro ao carregar a página especial:", erro);
        contentor.innerHTML = '<div class="container"><p>Não foi possível carregar os produtos desta página agora.</p></div>';
    }
}

carregarPaginaCategoria();
