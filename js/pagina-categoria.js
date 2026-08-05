/* PÁGINAS ESPECIAIS: seção padrão e seção com duas galerias */

let secoesCategoriaAtual = [];
let temasSelecionadosPagina = new Set();

function normalizarTemaPagina(tema) {
    return (tema || "").trim().toLocaleLowerCase("pt-BR");
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function obterImagensVariacao(secao, variacao, usarFallback = true) {
    if (variacao && Array.isArray(variacao.imagens) && variacao.imagens.length) {
        return variacao.imagens;
    }
    return usarFallback ? (secao.imagens || []) : [];
}

function obterUrlMiniatura(imagem) {
    if (!imagem) return "";
    if (imagem.miniatura) return imagem.miniatura;
    const url = imagem.url || "";
    if (/res\.cloudinary\.com\//i.test(url) && url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/w_160,h_160,c_fill,q_auto:eco,f_auto,dpr_auto/");
    }
    return url;
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
    return imagens.map((imagem, indice) => `
        <img src="${imagem.url}" alt="${escaparHtml(imagem.nome)}"
             class="${indice === 0 ? "ativo" : ""}" data-indice="${indice}"
             decoding="async" loading="${indice === 0 ? "eager" : "lazy"}"
             fetchpriority="${indice === 0 ? "high" : "low"}">
    `).join("");
}

function criarIndicadoresHTML(imagens) {
    return imagens.map((imagem, indice) => `
        <img src="${obterUrlMiniatura(imagem)}" alt="${escaparHtml(imagem.nome)}"
             title="${escaparHtml(imagem.nome)}" class="${indice === 0 ? "ativo" : ""}"
             data-indice="${indice}" width="56" height="56" loading="lazy"
             decoding="async" fetchpriority="low">
    `).join("");
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
              ${criarGaleriaHTML(secao.id, "produto", secao.tituloGaleriaPrincipal || "Fotos do Produto", secao.imagens || [])}
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
    const slider = elemento.querySelector(".slider-modal");
    const indicadores = elemento.querySelector(".indicadores-modal");
    const setas = elemento.querySelectorAll(".seta-galeria");
    const estado = { imagens: imagensIniciais || [], indice: 0 };

    function imagemAtual() { return estado.imagens[estado.indice] || null; }

    function atualizarControles() {
        const mostrar = estado.imagens.length > 1;
        setas.forEach(seta => seta.style.display = mostrar ? "flex" : "none");
        if (indicadores) indicadores.style.display = mostrar ? "flex" : "none";
    }

    function ligarMiniaturas() {
        indicadores?.querySelectorAll("img").forEach(img => {
            img.addEventListener("click", () => selecionar(Number(img.dataset.indice)));
        });
    }

    function selecionar(indice) {
        if (!estado.imagens.length) return;
        if (indice < 0) indice = estado.imagens.length - 1;
        if (indice >= estado.imagens.length) indice = 0;
        estado.indice = indice;
        slider.querySelectorAll("img").forEach(img => img.classList.toggle("ativo", Number(img.dataset.indice) === indice));
        indicadores?.querySelectorAll("img").forEach(img => img.classList.toggle("ativo", Number(img.dataset.indice) === indice));
        indicadores?.querySelector(`img[data-indice="${indice}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        aoSelecionar?.(imagemAtual());
    }

    function definirImagens(imagens) {
        estado.imagens = imagens || [];
        estado.indice = 0;
        slider.innerHTML = criarSlidesHTML(estado.imagens);
        if (indicadores) indicadores.innerHTML = criarIndicadoresHTML(estado.imagens);
        ligarMiniaturas();
        atualizarControles();
        aoSelecionar?.(imagemAtual());
    }

    setas.forEach(seta => seta.addEventListener("click", () => selecionar(estado.indice + Number(seta.dataset.direcao))));
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
    let imagemProduto = (secao.imagens || [])[0] || null;
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
            secao.imagens || [],
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

    contentor.innerHTML = secoes.map(criarSecaoHTML).join("");
    secoes.forEach(inicializarSecao);
}

function aplicarFiltroTemasPagina() {
    let secoesFiltradas = secoesCategoriaAtual;

    if (temasSelecionadosPagina.size > 0) {
        secoesFiltradas = secoesCategoriaAtual.filter(secao =>
            (secao.temas || []).some(tema =>
                temasSelecionadosPagina.has(normalizarTemaPagina(tema))
            )
        );
    }

    renderizarSecoesNaTela(secoesFiltradas);
}

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
            fetch("data/categorias.json").then(r => r.json()),
            fetch("data/secoes.json").then(r => r.json()),
            fetch("data/temas-paginas.json").then(r => r.ok ? r.json() : [])
        ]);
        const categoria = categorias.find(c => c.id === categoriaId);
        const nomeCategoria = categoria ? categoria.nome : categoriaId;
        if (tituloPagina) tituloPagina.textContent = nomeCategoria;
        if (tituloAba) tituloAba.textContent = `${nomeCategoria} - IMPEL`;

        const secoesCategoria = secoes.filter(s => s.categoria === categoriaId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        secoesCategoriaAtual = secoesCategoria;
        temasSelecionadosPagina = new Set();

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