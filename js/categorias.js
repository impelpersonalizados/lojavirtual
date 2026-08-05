async function carregarPaginaCategorias() {

    const lista = document.getElementById("lista-categorias");

    if (!lista) return;

    try {

        const [resposta, categoriasComPaginaEspecial] = await Promise.all([
            fetch("data/categorias.json"),
            typeof obterCategoriasComPaginaEspecial === "function"
                ? obterCategoriasComPaginaEspecial()
                : Promise.resolve(new Set())
        ]);

        const categorias = await resposta.json();

        lista.innerHTML = "";

        categorias
            .filter(categoria => categoria.ativo)
            .sort((a, b) => a.ordem - b.ordem)
            .forEach(categoria => {

                const link = typeof linkParaCategoria === "function"
                    ? linkParaCategoria(categoria, categoriasComPaginaEspecial)
                    : `categorias.html?id=${categoria.id}`;

                lista.innerHTML += `
                    <a href="${link}" class="card-categoria-home">

                        <div class="categoria-imagem-home">
                            <img src="${obterUrlMiniatura(categoria.imagem)}" alt="${categoria.nome}" loading="lazy" decoding="async">
                        </div>

                        <div class="categoria-info-home">

                            <h2>${categoria.nome}</h2>

                            <span>Ver mais...</span>

                        </div>

                    </a>
                `;

            });

    } catch (erro) {

        console.error("Erro ao carregar categorias:", erro);

    }

}

carregarPaginaCategorias();