
/* ==========================================================
   CRIAR CARD DE PRODUTO
========================================================== */

function criarCard(produto) {

    const mensagem = encodeURIComponent(
        `Olá, gostaria de pedir o produto: ${produto.nome} (ID: ${produto.id})`
    );

    const numeroWhatsApp = "5574999641627";

    // Compatibilidade com produtos antigos
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length
        ? produto.imagens
        : [produto.imagem];

    // Se o produto tem variações, cada uma tem seu próprio preço.
    // Então no card mostramos o MENOR preço entre elas, com "A partir de".
    const temVariacoes = Array.isArray(produto.variacoes) && produto.variacoes.length > 0;

    const precoExibido = temVariacoes
        ? Math.min(...produto.variacoes.map(variacao => Number(variacao.preco)))
        : produto.preco;

    const estaNaLista = ListaPedidos.existe(produto.id);


    return `

    <article
        class="cartao-produto"
        id="produto-${produto.id}"
    >

        <div
            class="imagem-produto"
            data-produto="${produto.id}"
        >

            <button
                class="botao-lista ${estaNaLista ? "ativo" : ""}"
                data-id="${produto.id}"
                title="${estaNaLista ? "Remover da minha lista" : "Adicionar à minha lista"}"
                aria-label="${estaNaLista ? "Remover da minha lista" : "Adicionar à minha lista"}"
            >
                <i class="${estaNaLista ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>

            <div class="slider-produto">

                ${imagens.map((imagem, indice) => `

                    <img
                        src="${imagem}"
                        alt="${produto.nome}"
                        class="slide-produto ${indice === 0 ? "ativo" : ""}"
                        data-index="${indice}"
                        data-posicao="${(produto.enquadramento && produto.enquadramento[imagem]) || "50% 50%"}"
                        style="object-position: ${(produto.enquadramento && produto.enquadramento[imagem]) || "50% 50%"}"
                    >

                `).join("")}

            </div>

            ${imagens.length > 1

            ?

            `
                <div class="indicadores-produto">

                    ${imagens.map((_, indice) => `

                        <span
                            class="${indice === 0 ? "ativo" : ""}"
                        ></span>

                    `).join("")}

                </div>
                `

            :

            ""

        }

        </div>

        <div class="informacoes-produto">

            <h3>${produto.nome}</h3>

            <span class="produto-id">

                Código: ${produto.id}

            </span>

            <div class="avaliacao">

                ★★★★★

            </div>

           ${(produto.mostrarPreco !== false || temVariacoes) ? `   

                ${temVariacoes ? `<span class="a-partir-de">A partir de</span>` : ""}

                <div class="preco">

                    <span class="moeda">

                        R$

                    </span>

                    <span class="valor">

                        ${Math.floor(precoExibido)}

                    </span>

                    <span class="centavos">

                        ,${String((precoExibido % 1).toFixed(2)).split(".")[1]}

                    </span>

                </div>

            ` : ""}

            ${produto.variacoes?.length

            ?

            `

            <button
                class="botao-whatsapp botao-opcoes"
                data-produto="${produto.id}"
            >

            Ver opções

            </button>

            `

            :

            `

            <div class="acoes-produto">

                <a
                    href="https://wa.me/${numeroWhatsApp}?text=${mensagem}"
                    target="_blank"
                    class="botao-whatsapp"
                >
                    Pedir no WhatsApp
                </a>

            </div>

            `

        }

        </div>

    </article>

    `;

}

let catalogoCompleto = null;


async function carregarCatalogoCompleto() {
    if (catalogoCompleto) return catalogoCompleto;

    const respostaCategorias = await fetch("data/categorias.json");
    const categorias = await respostaCategorias.json();

    const produtosPorCategoria = await Promise.all(
        categorias.map(async categoria => {
            const respostaProdutos = await fetch(`data/${categoria.id}.json`);
            const produtos = respostaProdutos.ok ? await respostaProdutos.json() : [];

            return produtos.map(produto => ({
                ...produto,
                categoriaNome: categoria.nome
            }));
        })
    );

    catalogoCompleto = produtosPorCategoria.flat();
    return catalogoCompleto;
}

function obterAreaResultadosBusca() {
    let area = document.getElementById("resultados-busca-global");

    if (area) return area;

    area = document.createElement("section");
    area.id = "resultados-busca-global";
    area.className = "resultados-busca-global";

    const pagina = document.querySelector("main.pagina-categorias");

    if (pagina) {
        pagina.insertAdjacentElement("beforebegin", area);
    } else {
        document.body.prepend(area);
    }

    return area;
}

function obterAreaRecomendacoesBusca() {
    let area = document.getElementById("recomendacoes-busca-global");

    if (area) return area;

    area = document.createElement("section");
    area.id = "recomendacoes-busca-global";
    area.className = "recomendacoes-busca-global";

    const areaBusca = obterAreaResultadosBusca();
    areaBusca.insertAdjacentElement("afterend", area);

    return area;
}

async function mostrarResultados(produtos, titulo, area) {

    area.innerHTML = `
        <h2>${titulo}</h2>
        <p>${produtos.length} produto${produtos.length === 1 ? "" : "s"}</p>
        <div class="grade-produtos resultados-busca-lista"></div>
    `;

    const lista = area.querySelector(".resultados-busca-lista");

    produtos.forEach(produto => {
        lista.insertAdjacentHTML("beforeend", criarCard(produto));
    });

    area.hidden = false;
    area.style.display = "block";

    iniciarHoverProdutos();

    iniciarSwipeProdutos();
}

async function buscarProdutosCatalogo(termo) {

    const consulta = termo.trim().toLocaleLowerCase("pt-BR");

    const veioDoBanner =
        new URLSearchParams(window.location.search).has("busca");

    const area = obterAreaResultadosBusca();
    const areaRecom = obterAreaRecomendacoesBusca();
    const paginaInicial = document.body.contains(document.getElementById("catalogo-secoes"));
    const conteudoPadrao = paginaInicial
        ? [document.querySelector(".pagina-categorias"), document.getElementById("catalogo-secoes")]
        : [document.querySelector(".pagina-categorias")];

    if (!consulta) {

        if (veioDoBanner) {

            const produtos = await carregarCatalogoCompleto();

            const ativos = produtos.filter(produto => produto.ativo !== false);

            await mostrarResultados(
                ativos,
                "Você também pode gostar",
                area
            );

            areaRecom.innerHTML = "";
            areaRecom.hidden = true;
            areaRecom.style.display = "none";

            conteudoPadrao.forEach(elemento => {
                if (elemento) {
                    elemento.hidden = true;
                    elemento.style.display = "none";
                }
            });

            return;
        }

        area.hidden = true;
        area.style.display = "none";

        areaRecom.hidden = true;
        areaRecom.style.display = "none";

        conteudoPadrao.forEach(elemento => {
            if (elemento) {
                elemento.hidden = false;
                elemento.style.display = "";
            }
        });

        return;
    }

    try {
        const produtos = await carregarCatalogoCompleto();
        const resultados = [];
        const outros = [];

        produtos.forEach(produto => {
            if (produto.ativo === false) return;
            const busca = [produto.nome, produto.id, produto.categoriaNome, ...(produto.temas || [])]
                .join(" ")
                .toLocaleLowerCase("pt-BR");

            if (busca.includes(consulta)) {
                resultados.push(produto);
            } else {
                outros.push(produto);
            }
        });

        // Resultados
        await mostrarResultados(
            resultados,
            `Resultados para "${termo.trim()}"`,
            area
        );

        // Recomendações
        if (!paginaInicial && outros.length > 0) {
            areaRecom.innerHTML = `
                <div class="recomendados-secao">
                    <div class="titulo-recomendados">
                        <h2>Você também pode gostar</h2>
                    </div>
                    <div class="grade-produtos recomendados-lista"></div>
                </div>
            `;
            const recomendadosLista = areaRecom.querySelector(".recomendados-lista");
            outros.forEach(produto => recomendadosLista.insertAdjacentHTML("beforeend", criarCard(produto)));

            areaRecom.hidden = false;
            areaRecom.style.display = "block";
        } else {
            areaRecom.innerHTML = "";
            areaRecom.hidden = true;
            areaRecom.style.display = "none";
        }

        conteudoPadrao.forEach(elemento => {
            if (elemento) {
                elemento.hidden = true;
                elemento.style.display = "none";
            }
        });
        area.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
    }
}

window.buscarProdutosCatalogo = buscarProdutosCatalogo;

async function carregarTodosProdutos() {

    const container = document.getElementById("todos-produtos-lista");

    if (!container) return;

    const produtos = await carregarCatalogoCompleto();

    container.innerHTML = "";

    produtos
        .filter(produto => produto.ativo !== false)
        .forEach(produto => {
            container.insertAdjacentHTML(
                "beforeend",
                criarCard(produto)
            );
        });

    iniciarHoverProdutos();

    iniciarSwipeProdutos();

}


/* ==========================================================
   INICIAR AO CARREGAR A PÁGINA
========================================================== */

function rolarParaProduto() {
    const hash = window.location.hash;

    if (!hash.startsWith("#produto-")) {
        return;
    }

    const id = hash.replace("#produto-", "");
    const elemento = document.getElementById(`produto-${id}`);

    if (elemento) {
        elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

async function inicializarBanner() {
    const banner = document.getElementById("banner-principal");

    if (!banner) {
        return;
    }

    try {
        const resposta = await fetch("data/banner.json");
        const dados = await resposta.json();
        const isMobile = window.matchMedia("(max-width: 768px)").matches || window.innerWidth <= 768;
        const config = isMobile ? (dados.mobile || dados.desktop || dados) : (dados.desktop || dados.mobile || dados);

        const imagem = config.imagem || dados.imagem || "imagens/produtos/canecas01.jpg";
        const slides = (Array.isArray(config.slides) && config.slides.length)
            ? config.slides
            : [...new Set([imagem, ...(Array.isArray(config.imagens) ? config.imagens : [])].filter(Boolean))]
                .map(imagemSlide => ({ imagem: imagemSlide, link: config.link || dados.link || "#categorias", texto: "" }));
        const link = config.link || dados.link || "#categorias";
        const mostrarTexto = config.mostrarTexto !== false && dados.mostrarTexto !== false;
        const classeBanner = mostrarTexto ? "banner-item" : "banner-item sem-texto";

        banner.innerHTML = `
            <div class="${classeBanner}">
                ${mostrarTexto ? `
                    <div class="banner-conteudo">
                        <h2>${config.titulo || dados.titulo || "Novidades IMPEL"}</h2>
                        <p>${slides[0].texto || config.texto || dados.texto || "Descubra produtos personalizados com estilo, qualidade e destaque para o seu dia a dia."}</p>
                        <a href="${slides[0].link || link}" class="botao-whatsapp">Ver produtos</a>
                    </div>
                ` : ""}
                <a class="banner-imagem banner-slides" href="${slides[0].link || link}" aria-label="Abrir destino do banner">
                    ${slides.map((slide, indice) => `
                        <img src="${slide.imagem}" alt="Banner promocional IMPEL" class="banner-slide${indice === 0 ? " ativo" : ""}">
                    `).join("")}
                </a>
            </div>
            ${slides.length > 1 ? `<div class="banner-indicadores">${slides.map((_, indice) => `<span class="${indice === 0 ? "ativo" : ""}"></span>`).join("")}</div>` : ""}
        `;

        iniciarRotacaoBanner(banner, slides);
    } catch (erro) {
        console.error("Erro ao carregar banner:", erro);
    }
}

let intervaloBanner;

function iniciarRotacaoBanner(banner, slidesConfigurados) {
    clearInterval(intervaloBanner);

    const quantidadeSlides = slidesConfigurados.length;
    if (quantidadeSlides < 2) return;

    let indiceAtual = 0;
    const slides = banner.querySelectorAll(".banner-slide");
    const indicadores = banner.querySelectorAll(".banner-indicadores span");
    const linkImagem = banner.querySelector(".banner-slides");
    const linkTexto = banner.querySelector(".banner-conteudo .botao-whatsapp");
    const texto = banner.querySelector(".banner-conteudo p");

    intervaloBanner = setInterval(() => {
        slides[indiceAtual].classList.remove("ativo");
        indicadores[indiceAtual].classList.remove("ativo");

        indiceAtual = (indiceAtual + 1) % quantidadeSlides;

        slides[indiceAtual].classList.add("ativo");
        indicadores[indiceAtual].classList.add("ativo");

        const configuracao = slidesConfigurados[indiceAtual];
        linkImagem.href = configuracao.link || "#categorias";
        if (linkTexto) linkTexto.href = configuracao.link || "#categorias";
        if (texto && configuracao.texto) texto.textContent = configuracao.texto;
    }, 5000);
}

/* ==========================================================
   MODAL DAS VARIAÇÕES
========================================================== */

let catalogoVariacoes = [];

async function abrirModalVariacoes(produtoId) {

    if (catalogoVariacoes.length === 0) {
        catalogoVariacoes = await carregarCatalogoCompleto();
    }

    const produto = catalogoVariacoes.find(p => p.id == produtoId);

    if (!produto) return;

    const titulo = document.getElementById("tituloModalVariacoes");
    const lista = document.getElementById("listaModalVariacoes");
    const tituloLista = document.getElementById("tituloListaVariacoes");
    const slider = document.getElementById("sliderModalVariacao");
    const indicadores = document.getElementById("indicadoresModalVariacao");
    const botao = document.getElementById("botaoWhatsappVariacao");

    titulo.textContent = produto.nome;
    tituloLista.textContent = produto.tituloVariacoes || "Escolha uma opção";

    lista.innerHTML = "";
    slider.innerHTML = "";
    indicadores.innerHTML = "";

    function carregarSlider(fotos) {

        slider.innerHTML = "";
        indicadores.innerHTML = "";

        fotos.forEach((foto, indice) => {

            const posicao = (produto.enquadramento && produto.enquadramento[foto]) || "50% 50%";

            const img = document.createElement("img");

            img.src = foto;
            img.className = "slide-produto";
            img.style.objectPosition = posicao;

            if (indice === 0) img.classList.add("ativo");

            slider.appendChild(img);

            // Miniatura clicável (mostra pro cliente que existem outras fotos)
            const miniatura = document.createElement("img");

            miniatura.src = foto;
            miniatura.style.objectPosition = posicao;

            if (indice === 0) miniatura.classList.add("ativo");

            miniatura.onclick = () => {

                slider.querySelectorAll("img").forEach(i => i.classList.remove("ativo"));
                indicadores.querySelectorAll("img").forEach(i => i.classList.remove("ativo"));

                slider.children[indice].classList.add("ativo");
                miniatura.classList.add("ativo");

            };

            indicadores.appendChild(miniatura);

        });
        // Só mostra a fileira de miniaturas se houver mais de 1 foto
        indicadores.style.display = fotos.length > 1 ? "flex" : "none";

    }

    function selecionarVariacao(variacao, label) {

        lista.querySelectorAll(".opcao-variacao")
            .forEach(item => item.classList.remove("selecionada"));

        label.classList.add("selecionada");

        carregarSlider(
            variacao.fotos?.length
                ? variacao.fotos
                : (produto.imagens?.length
                    ? produto.imagens
                    : [produto.imagem])
        );

        const modeloMensagem =
            produto.mensagemWhatsapp && produto.mensagemWhatsapp.trim()
                ? produto.mensagemWhatsapp
                : `Olá, gostaria da opção "{opcao}" do produto {produto} (ID: {id})`;

        const mensagem = encodeURIComponent(
            modeloMensagem
                .replaceAll("{opcao}", variacao.nome)
                .replaceAll("{produto}", produto.nome)
                .replaceAll("{id}", produto.id)
        );

        botao.href = `https://wa.me/5574999641627?text=${mensagem}`;

    }

    produto.variacoes.forEach((variacao, indice) => {

        const label = document.createElement("label");

        label.className = "opcao-variacao";

        label.innerHTML = `
            <input type="radio" name="variacaoProduto">

            <div class="conteudo-variacao">

                <strong>${variacao.nome}</strong>

                ${variacao.descricao ? `<small>${variacao.descricao}</small>` : ""}

            </div>

            <span class="preco-variacao">R$ ${Number(variacao.preco).toFixed(2).replace(".", ",")}</span>
        `;

        label.onclick = () => selecionarVariacao(variacao, label);

        lista.appendChild(label);

        if (indice === 0) {
            selecionarVariacao(variacao, label);
        }

    });

    document.getElementById("modalVariacoes")
        .classList.add("aberto");

}

function fecharModalVariacoes() {

    document
        .getElementById("modalVariacoes")
        .classList.remove("aberto");

}

document.addEventListener("DOMContentLoaded", () => {
    inicializarBanner();
    carregarTodosProdutos();

    const temaDaBusca = new URLSearchParams(window.location.search).get("busca");

    if (temaDaBusca) {
        document.querySelectorAll(".pesquisa-desktop input, .pesquisa-mobile input").forEach(input => {
            input.value = temaDaBusca;
        });

        buscarProdutosCatalogo(temaDaBusca);
    }
    window.addEventListener("hashchange", rolarParaProduto);
    window.addEventListener("resize", inicializarBanner);

    const lightbox = document.getElementById("lightbox");

    lightbox.addEventListener("click", (e) => {

        if (
            e.target.id === "lightbox" ||
            e.target.closest("#fechar-lightbox")
        ) {

            fecharLightbox();

        }

    });

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            fecharLightbox();

        }

    });

    document
        .getElementById("fecharModalVariacoes")
        ?.addEventListener("click", fecharModalVariacoes);

    document
        .getElementById("modalVariacoes")
        ?.addEventListener("click", (e) => {

            if (e.target.id === "modalVariacoes") {

                fecharModalVariacoes();

            }

        });
});
/* ==========================================================
   LIGHTBOX
========================================================== */

function abrirLightbox(imagens, indiceInicial = 0, titulo = "") {

    const lightbox = document.getElementById("lightbox");
    const imagem = document.getElementById("imagem-lightbox");
    const indicadores = document.getElementById("indicadores-lightbox");
    const tituloEl = document.getElementById("titulo-lightbox");

    if (!lightbox || !imagem) return;

    if (tituloEl) tituloEl.textContent = titulo;

    // Compatibilidade: aceita uma string única, um array de strings (uso
    // antigo) ou um array de { src, posicao } com o enquadramento salvo
    const listaBruta = Array.isArray(imagens) ? imagens : [imagens];

    const galeria = listaBruta.map(item =>
        typeof item === "string"
            ? { src: item, posicao: "50% 50%" }
            : { src: item.src, posicao: item.posicao || "50% 50%" }
    );

    let indiceAtual = indiceInicial;

    function mostrar(indice) {

        indiceAtual = indice;
        imagem.src = galeria[indiceAtual].src;
        imagem.style.objectPosition = galeria[indiceAtual].posicao;

        if (indicadores) {
            [...indicadores.querySelectorAll("img")].forEach((miniatura, i) => {
                miniatura.classList.toggle("ativo", i === indiceAtual);
            });
        }

    }

    if (indicadores) {

        indicadores.innerHTML = "";

        if (galeria.length > 1) {

            galeria.forEach((item, indice) => {

                const miniatura = document.createElement("img");

                miniatura.src = item.src;
                miniatura.style.objectPosition = item.posicao;
                miniatura.className = indice === indiceInicial ? "ativo" : "";
                miniatura.addEventListener("click", () => mostrar(indice));

                indicadores.appendChild(miniatura);

            });

        }

    }

    mostrar(indiceInicial);

    lightbox.classList.add("ativo");

    lightbox.dataset.total = galeria.length;

    lightbox._navegarLightbox = (direcao) => {
        const total = galeria.length;
        if (total <= 1) return;
        mostrar((indiceAtual + direcao + total) % total);
    };

}

function fecharLightbox() {

    document.getElementById("lightbox")?.classList.remove("ativo");

}

/* Delegação: funciona mesmo para cards criados dinamicamente,
   inclusive os clonados pelo carrossel infinito. */

document.addEventListener("click", (e) => {

    const imagem = e.target.closest(".imagem-produto img");

    if (!imagem) return;

    const card = imagem.closest(".imagem-produto");

    const galeria = card
        ? [...card.querySelectorAll(".slide-produto")].map(img => ({
            src: img.src,
            posicao: img.dataset.posicao || "50% 50%"
        }))
        : [{ src: imagem.src, posicao: imagem.dataset.posicao || "50% 50%" }];

    const indiceClicado = galeria.findIndex(item => item.src === imagem.src);

    abrirLightbox(galeria, indiceClicado >= 0 ? indiceClicado : 0, imagem.alt || "");

});

/* Navegação por teclado (setas) quando há mais de uma imagem */

document.addEventListener("keydown", (e) => {

    const lightbox = document.getElementById("lightbox");

    if (!lightbox || !lightbox.classList.contains("ativo")) return;

    if (e.key === "ArrowRight") lightbox._navegarLightbox?.(1);
    if (e.key === "ArrowLeft") lightbox._navegarLightbox?.(-1);

});

/* ==========================================================
   HOVER NAS IMAGENS DOS PRODUTOS
========================================================== */

function iniciarHoverProdutos() {

    if (window.innerWidth <= 768) {
        return;
    }

    document.querySelectorAll(".imagem-produto").forEach(card => {

        if (card.dataset.hover === "1") {
            return;
        }

        card.dataset.hover = "1";

        const imagens = [
            ...card.querySelectorAll(".slide-produto")
        ];

        const indicadores = [
            ...card.querySelectorAll(".indicadores-produto span")
        ];

        if (imagens.length <= 1) {
            return;
        }

        let indice = 0;

        let intervalo = null;

        function mostrar(i) {

            imagens.forEach(img => img.classList.remove("ativo"));

            indicadores.forEach(b => b.classList.remove("ativo"));

            imagens[i].classList.add("ativo");

            if (indicadores[i]) {

                indicadores[i].classList.add("ativo");

            }

        }

        card.addEventListener("mouseenter", () => {

            intervalo = setInterval(() => {

                if (indice >= imagens.length - 1) {

                    clearInterval(intervalo);
                    return;

                }

                indice++;

                mostrar(indice);

            }, 800);

        });

        card.addEventListener("mouseleave", () => {

            clearInterval(intervalo);

            indice = 0;

            mostrar(0);

        });

    });

}

/* ==========================================================
   SWIPE DAS IMAGENS (CELULAR)
========================================================== */

function iniciarSwipeProdutos() {

    if (window.innerWidth > 768) {
        return;
    }

    document.querySelectorAll(".imagem-produto").forEach(card => {

        if (card.dataset.swipe == "1") {
            return;
        }

        card.dataset.swipe = "1";

        const slider = card.querySelector(".slider-produto");
        const imagens = [...card.querySelectorAll(".slide-produto")];
        const indicadores = [...card.querySelectorAll(".indicadores-produto span")];

        if (imagens.length <= 1) {
            return;
        }

        let indice = 0;
        let inicioX = 0;
        let deslocamento = 0;
        let arrastando = false;

        function irPara(i, comAnimacao = true) {

            indice = Math.max(0, Math.min(i, imagens.length - 1));

            slider.style.transition = comAnimacao ? "transform .3s ease" : "none";
            slider.style.transform = `translateX(-${indice * 100}%)`;

            indicadores.forEach(ind => ind.classList.remove("ativo"));

            if (indicadores[indice]) {
                indicadores[indice].classList.add("ativo");
            }

        }

        card.addEventListener("touchstart", (e) => {

            inicioX = e.touches[0].clientX;
            arrastando = true;

            slider.style.transition = "none";

        }, { passive: true });

        card.addEventListener("touchmove", (e) => {

            if (!arrastando) return;

            deslocamento = e.touches[0].clientX - inicioX;

            const larguraCard = card.offsetWidth;
            const percentual = (deslocamento / larguraCard) * 100;

            slider.style.transform =
                `translateX(calc(-${indice * 100}% + ${percentual}%))`;

        }, { passive: true });

        card.addEventListener("touchend", () => {

            arrastando = false;

            const larguraCard = card.offsetWidth;

            if (Math.abs(deslocamento) > larguraCard * 0.15) {

                if (deslocamento < 0) {

                    let novo = indice + 1;

                    if (novo >= imagens.length) {
                        novo = 0;
                    }

                    irPara(novo);

                } else {

                    let novo = indice - 1;

                    if (novo < 0) {
                        novo = imagens.length - 1;
                    }

                    irPara(novo);

                }

            } else {

                irPara(indice);

            }

            deslocamento = 0;

        });

        irPara(0, false);

    });

}

document.addEventListener("click", async (e) => {

    const botao = e.target.closest(".botao-opcoes");

    if (!botao) {
        return;
    }

    await abrirModalVariacoes(botao.dataset.produto);

});

/* ==========================================================
   BOTÃO DA LISTA DE PEDIDOS
========================================================== */

document.addEventListener("click", async (e) => {

    const botao = e.target.closest(".botao-lista");

    if (!botao) return;

    const produto = await ListaPedidos.buscarProduto(botao.dataset.id);

    if (!produto) return;

    ListaPedidos.alternar(produto);

});
/* ==========================================================
   SINCRONIZAR BOTÕES DA LISTA
========================================================== */

function atualizarBotoesListaPedidos() {

    document.querySelectorAll(".botao-lista").forEach(botao => {

        const estaNaLista = ListaPedidos.existe(botao.dataset.id);

        const icone = botao.querySelector("i");

        if (!icone) return;

        if (estaNaLista) {

            botao.classList.add("ativo");

            botao.title = "Remover da minha lista";

            botao.setAttribute(
                "aria-label",
                "Remover da minha lista"
            );

            icone.classList.remove("fa-regular");
            icone.classList.add("fa-solid");

        } else {

            botao.classList.remove("ativo");

            botao.title = "Adicionar à minha lista";

            botao.setAttribute(
                "aria-label",
                "Adicionar à minha lista"
            );

            icone.classList.remove("fa-solid");
            icone.classList.add("fa-regular");

        }

    });

}

document.addEventListener(
    "listaPedidosAtualizada",
    atualizarBotoesListaPedidos
);

document.addEventListener(
    "DOMContentLoaded",
    atualizarBotoesListaPedidos
);