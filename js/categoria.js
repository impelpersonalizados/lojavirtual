let produtosCategoria = [];
let temasSelecionados = new Set();

function renderizarProdutos(produtos) {
    const lista = document.getElementById("lista-produtos-categoria");
    lista.innerHTML = "";
    produtos.forEach(produto => {
        lista.innerHTML += criarCard(produto);
    });
    iniciarHoverProdutos();
    iniciarSwipeProdutos();
}

function normalizarTema(tema) {
    return (tema || "").trim().toLocaleLowerCase("pt-BR");
}

// ==========================================================
// ORDENAÇÃO POR RELEVÂNCIA DE TEMAS
// ==========================================================
function ordenarPorRelevanciaDeTemas(produtos) {
    if (temasSelecionados.size === 0) return produtos;

    return [...produtos].sort((a, b) => {
        const aTemas = (a.temas || []).map(normalizarTema);
        const bTemas = (b.temas || []).map(normalizarTema);

        const aMatch = aTemas.filter(t => temasSelecionados.has(t)).length;
        const bMatch = bTemas.filter(t => temasSelecionados.has(t)).length;

        return bMatch - aMatch; // maior número de matches primeiro
    });
}

function aplicarFiltros() {
    let produtosFiltrados = [...produtosCategoria];

    // Filtra por temas (se houver seleção)
    if (temasSelecionados.size > 0) {
        produtosFiltrados = produtosFiltrados.filter(produto =>
            (produto.temas || []).some(tema =>
                temasSelecionados.has(normalizarTema(tema))
            )
        );
    }

    // Ordena por relevância
    produtosFiltrados = ordenarPorRelevanciaDeTemas(produtosFiltrados);

    renderizarProdutos(produtosFiltrados);
    atualizarBotoesTemas();
}

function filtrarProdutos(texto) {
    texto = texto.trim().toLowerCase();

    let produtosBase = [...produtosCategoria];

    // Filtra por temas
    if (temasSelecionados.size > 0) {
        produtosBase = produtosBase.filter(produto =>
            (produto.temas || []).some(tema =>
                temasSelecionados.has(normalizarTema(tema))
            )
        );
    }

    // Ordena por relevância (antes do filtro de texto)
    produtosBase = ordenarPorRelevanciaDeTemas(produtosBase);

    // Filtra por texto
    if (texto) {
        produtosBase = produtosBase.filter(produto => {
            const busca = [
                produto.nome,
                produto.id,
                ...(produto.temas || [])
            ]
                .join(" ")
                .toLowerCase();
            return busca.includes(texto);
        });
    }

    renderizarProdutos(produtosBase);
}

function alternarTema(tema) {
    const temaNormalizado = normalizarTema(tema);

    if (temaNormalizado === "") {
        // "Todos" – limpa a seleção
        temasSelecionados.clear();
    } else if (temasSelecionados.has(temaNormalizado)) {
        // Clicou no mesmo tema já selecionado – desmarca (volta para "Todos")
        temasSelecionados.clear();
    } else {
        // Seleção única – substitui o que estava marcado
        temasSelecionados.clear();
        temasSelecionados.add(temaNormalizado);
    }

    aplicarFiltros();
}

function atualizarBotoesTemas() {
    const botoes = document.querySelectorAll(".filtro-tema");
    botoes.forEach(botao => {
        const tema = botao.dataset.tema;
        const estaAtivo = temasSelecionados.has(normalizarTema(tema));
        botao.classList.toggle("ativo", estaAtivo);
    });
}

function renderizarFiltrosTemas(temas = []) {
    const filtros = document.getElementById("filtros-temas");

    if (temas.length) {
        filtros.dataset.temas = JSON.stringify(temas);
    }

    const temasConfigurados = JSON.parse(filtros.dataset.temas || "[]");
    filtros.innerHTML = "";

    const criarBotao = (nome, valor) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "filtro-tema";
        botao.textContent = nome;
        botao.dataset.tema = valor;
        botao.onclick = () => alternarTema(valor);
        filtros.appendChild(botao);
    };

    criarBotao("Todos", "");

    const temasFiltrados = temasConfigurados.filter(tema =>
        normalizarTema(tema) !== "todos os produtos"
    );

    temasFiltrados.forEach(tema => criarBotao(tema, tema));

    temasSelecionados.clear();
    atualizarBotoesTemas();
}

async function carregarCategoria() {
    const titulo = document.getElementById("nome-categoria");
    const parametros = new URLSearchParams(window.location.search);
    const idCategoria = parametros.get("id");

    if (!idCategoria) {
        titulo.textContent = parametros.get("busca") ? "Pesquisa de Produtos" : "Escolha uma Categoria";
        return;
    }

    try {
        const respostaCategorias = await fetch("data/categorias.json");
        const categorias = await respostaCategorias.json();
        const categoria = categorias.find(c => c.id === idCategoria);

        if (!categoria) {
            titulo.textContent = "Categoria não encontrada";
            return;
        }

        titulo.textContent = categoria.nome;

        const respostaProdutos = await fetch(`data/${idCategoria}.json`);
        const produtos = await respostaProdutos.json();
        produtosCategoria = produtos;

        let temas;

        if (Array.isArray(categoria.temasFiltro) && categoria.temasFiltro.length) {
            // Categoria tem temas específicos configurados no admin
            temas = categoria.temasFiltro;
        } else {
            // Sem configuração específica – usa todos os temas cadastrados
            const respostaTemas = await fetch("data/temas.json");
            temas = respostaTemas.ok ? await respostaTemas.json() : [];
        }

        renderizarFiltrosTemas(Array.isArray(temas) ? temas : []);

        aplicarFiltros(); // exibe todos inicialmente

    } catch (erro) {
        console.error("Erro ao carregar categoria:", erro);
    }
}

// Inicialização
carregarCategoria().then(() => {
    document.querySelectorAll(".pesquisa-desktop input, .pesquisa-mobile input").forEach(input => {
        input.addEventListener("input", (e) => {
            if (typeof window.buscarProdutosCatalogo === "function") {
                window.buscarProdutosCatalogo(e.target.value);
            } else {
                filtrarProdutos(e.target.value);
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (typeof window.buscarProdutosCatalogo === "function") {
                    window.buscarProdutosCatalogo(input.value);
                } else {
                    filtrarProdutos(input.value);
                }
            }
        });
    });

    document.querySelectorAll(".pesquisa-desktop button, .pesquisa-mobile button").forEach(botao => {
        botao.addEventListener("click", () => {
            const campo = botao.closest(".pesquisa-desktop, .pesquisa-mobile")?.querySelector("input");
            if (campo) {
                if (typeof window.buscarProdutosCatalogo === "function") {
                    window.buscarProdutosCatalogo(campo.value);
                } else {
                    filtrarProdutos(campo.value);
                }
            }
        });
    });
});