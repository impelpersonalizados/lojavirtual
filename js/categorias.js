async function carregarPaginaCategorias() {

    const lista = document.getElementById("lista-categorias");

    if (!lista) return;

    try {

        const resposta = await fetch("data/categorias.json");
        const categorias = await resposta.json();

        lista.innerHTML = "";

        categorias
            .filter(categoria => categoria.ativo)
            .sort((a, b) => a.ordem - b.ordem)
            .forEach(categoria => {

                lista.innerHTML += `
                    <a href="categorias.html?id=${categoria.id}" class="card-categoria-home">

                        <div class="categoria-imagem-home">
                            <img src="${categoria.imagem}" alt="${categoria.nome}">
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