let produtosCategoria = [];
let temaSelecionado = "";

function renderizarProdutos(produtos) {

    const lista = document.getElementById("lista-produtos-categoria");

    lista.innerHTML = "";

    produtos.forEach(produto => {

        lista.innerHTML += criarCard(produto);

    });

    iniciarHoverProdutos();
    iniciarSwipeProdutos();

}

function filtrarProdutos(texto) {

    texto = texto.trim().toLowerCase();

    if (!texto) {

        renderizarProdutos(produtosCategoria);

        return;

    }

    const produtosFiltrados = produtosCategoria.filter(produto => {

        const busca = [

            produto.nome,
            produto.id,
            ...(produto.temas || [])

        ]
            .join(" ")
            .toLowerCase();

        return busca.includes(texto);

    });

    renderizarProdutos(produtosFiltrados);

}

function normalizarTema(tema) {
    return (tema || "").trim().toLocaleLowerCase("pt-BR");
}

function filtrarPorTema(tema) {
    temaSelecionado = normalizarTema(tema);

    const produtosOrdenados = !temaSelecionado
        ? [...produtosCategoria]
        : [
            ...produtosCategoria.filter(produto =>
                (produto.temas || []).some(item => normalizarTema(item) === temaSelecionado)
            ),
            ...produtosCategoria.filter(produto =>
                !(produto.temas || []).some(item => normalizarTema(item) === temaSelecionado)
            )
        ];

    renderizarProdutos(produtosOrdenados);
    renderizarFiltrosTemas();
    document.getElementById("lista-produtos-categoria").scrollIntoView({ behavior: "smooth", block: "start" });
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
        botao.classList.toggle("ativo", temaSelecionado === normalizarTema(valor));
        botao.onclick = () => filtrarPorTema(valor);
        filtros.appendChild(botao);
    };

    criarBotao("Todos", "");
    temasConfigurados.forEach(tema => criarBotao(tema, tema));
}

async function carregarCategoria() {

    const titulo = document.getElementById("nome-categoria");
    const lista = document.getElementById("lista-produtos-categoria");
    const parametros = new URLSearchParams(window.location.search);
    const idCategoria = parametros.get("id");

    if (!idCategoria) {
        if (parametros.get("busca")) {
            titulo.textContent = "Pesquisa de Produtos";
        } else {
            titulo.textContent = "Escolha uma Categoria";
        }
        return;
    }

    try {
        const respostaCategorias = await fetch("data/categorias.json");
        const categorias = await respostaCategorias.json();


        const categoria = categorias.find(
            c => c.id === idCategoria
        );


        if (!categoria) {

            titulo.textContent = "Categoria não encontrada";

            return;

        }


        titulo.textContent = categoria.nome;



        // Busca produtos da categoria

        const respostaProdutos = await fetch(
            `data/${idCategoria}.json`
        );


        const produtos = await respostaProdutos.json();

        produtosCategoria = produtos;

        renderizarProdutos(produtosCategoria);

        const respostaTemas = await fetch("data/temas.json");
        const temas = respostaTemas.ok ? await respostaTemas.json() : [];
        renderizarFiltrosTemas(Array.isArray(temas) ? temas : []);


    } catch (erro) {

        console.error(
            "Erro ao carregar categoria:",
            erro
        );

    }


}




carregarCategoria().then(() => {

    document.querySelectorAll(
        ".pesquisa-desktop input, .pesquisa-mobile input"
    ).forEach(input => {

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

    document.querySelectorAll(
        ".pesquisa-desktop button, .pesquisa-mobile button"
    ).forEach(botao => {

        botao.addEventListener("click", () => {

            const campo = botao
                .closest(".pesquisa-desktop, .pesquisa-mobile")
                ?.querySelector("input");

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
