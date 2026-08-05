/* ==========================================================
   AUTOCOMPLETE DAS BARRAS DE PESQUISA
   Funciona em qualquer página que tenha .pesquisa-desktop
   e/ou .pesquisa-mobile, independente de outros scripts.
========================================================== */

(function () {

    let catalogoBusca = null;
    let carregandoCatalogo = null;

    function normalizar(texto) {
        return (texto || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }

    async function carregarCatalogoBusca() {
        if (catalogoBusca) return catalogoBusca;
        if (carregandoCatalogo) return carregandoCatalogo;

        carregandoCatalogo = (async () => {
            try {
                const respCategorias = await fetch("data/categorias.json");
                const categorias = respCategorias.ok ? await respCategorias.json() : [];

                const listas = await Promise.all(
                    categorias.map(async categoria => {
                        try {
                            const resp = await fetch(`data/${categoria.id}.json`);
                            const produtos = resp.ok ? await resp.json() : [];

                            return produtos
                                .filter(produto => produto.ativo !== false && produto.nome)
                                .map(produto => ({
                                    nome: produto.nome,
                                    imagem: produto.imagem || (produto.imagens || [])[0] || "",
                                    categoriaId: categoria.id,
                                    categoriaNome: categoria.nome
                                }));

                        } catch (erro) {
                            return [];
                        }
                    })
                );

                catalogoBusca = listas.flat();

            } catch (erro) {
                console.error("Erro ao carregar catálogo para autocomplete:", erro);
                catalogoBusca = [];
            }

            return catalogoBusca;
        })();

        return carregandoCatalogo;
    }

    function obterSugestoes(termo, limite = 8) {
        const consulta = normalizar(termo);
        if (!consulta || !catalogoBusca) return [];

        const vistos = new Set();
        const sugestoes = [];

        for (const produto of catalogoBusca) {
            const nomeNormalizado = normalizar(produto.nome);
            if (!nomeNormalizado.includes(consulta)) continue;

            const chave = `${nomeNormalizado}|${produto.categoriaId}`;
            if (vistos.has(chave)) continue;

            vistos.add(chave);
            sugestoes.push(produto);
        }

        // Prioriza os que começam com o termo digitado
        sugestoes.sort((a, b) => {
            const aComeca = normalizar(a.nome).startsWith(consulta) ? 0 : 1;
            const bComeca = normalizar(b.nome).startsWith(consulta) ? 0 : 1;
            return aComeca - bComeca;
        });

        return sugestoes.slice(0, limite);
    }

    function fecharDropdown(input) {
        const wrapper = input.closest(".pesquisa-desktop, .pesquisa-mobile");
        wrapper?.querySelector(".autocomplete-lista")?.remove();
        input.setAttribute("aria-expanded", "false");
    }

    function dispararBusca(input, valor) {
        input.value = valor;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        fecharDropdown(input);
    }

    function abrirDropdown(input, sugestoes) {
        const wrapper = input.closest(".pesquisa-desktop, .pesquisa-mobile");
        if (!wrapper) return;

        fecharDropdown(input);

        if (!sugestoes.length) return;

        const dropdown = document.createElement("ul");
        dropdown.className = "autocomplete-lista";
        dropdown.setAttribute("role", "listbox");

        sugestoes.forEach(produto => {
            const item = document.createElement("li");
            item.className = "autocomplete-item";
            item.setAttribute("role", "option");

            const miniatura = document.createElement("img");
            miniatura.className = "autocomplete-imagem";
            miniatura.src = produto.imagem;
            miniatura.alt = "";
            miniatura.loading = "lazy";
            miniatura.decoding = "async";
            miniatura.onerror = () => miniatura.remove();

            const textos = document.createElement("div");
            textos.className = "autocomplete-textos";

            const nomeSpan = document.createElement("span");
            nomeSpan.className = "autocomplete-nome";
            nomeSpan.textContent = produto.nome;

            const categoriaSpan = document.createElement("span");
            categoriaSpan.className = "autocomplete-categoria";
            categoriaSpan.textContent = produto.categoriaNome;

            textos.appendChild(nomeSpan);
            textos.appendChild(categoriaSpan);

            if (produto.imagem) {
                item.appendChild(miniatura);
            }
            item.appendChild(textos);

            // mousedown (não click) evita que o "blur" do input feche
            // o dropdown antes do clique ser processado.
            item.addEventListener("mousedown", (evento) => {
                evento.preventDefault();
                dispararBusca(input, produto.nome);
            });

            dropdown.appendChild(item);
        });

        wrapper.appendChild(dropdown);
        input.setAttribute("aria-expanded", "true");
    }

    function configurarAutocomplete(input) {
        if (input.dataset.autocompleteConfigurado) return;
        input.dataset.autocompleteConfigurado = "true";

        input.setAttribute("autocomplete", "off");
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-expanded", "false");
        input.setAttribute("aria-autocomplete", "list");

        let indiceAtivo = -1;

        input.addEventListener("input", async () => {
            const termo = input.value;

            if (!termo.trim()) {
                fecharDropdown(input);
                return;
            }

            await carregarCatalogoBusca();

            indiceAtivo = -1;
            abrirDropdown(input, obterSugestoes(termo));
        });

        input.addEventListener("keydown", (evento) => {
            const wrapper = input.closest(".pesquisa-desktop, .pesquisa-mobile");
            const dropdown = wrapper?.querySelector(".autocomplete-lista");
            if (!dropdown) return;

            const itens = Array.from(dropdown.querySelectorAll(".autocomplete-item"));
            if (!itens.length) return;

            if (evento.key === "ArrowDown") {
                evento.preventDefault();
                indiceAtivo = (indiceAtivo + 1) % itens.length;
                itens.forEach((item, i) => item.classList.toggle("ativo", i === indiceAtivo));
                itens[indiceAtivo].scrollIntoView({ block: "nearest" });

            } else if (evento.key === "ArrowUp") {
                evento.preventDefault();
                indiceAtivo = (indiceAtivo - 1 + itens.length) % itens.length;
                itens.forEach((item, i) => item.classList.toggle("ativo", i === indiceAtivo));
                itens[indiceAtivo].scrollIntoView({ block: "nearest" });

            } else if (evento.key === "Enter") {
                if (indiceAtivo > -1 && itens[indiceAtivo]) {
                    evento.preventDefault();
                    const nome = itens[indiceAtivo].querySelector(".autocomplete-nome").textContent;
                    dispararBusca(input, nome);
                } else {
                    fecharDropdown(input);
                }

            } else if (evento.key === "Escape") {
                fecharDropdown(input);
            }
        });

        input.addEventListener("blur", () => {
            // pequeno atraso para o "mousedown" do item rodar antes do fechamento
            setTimeout(() => fecharDropdown(input), 120);
        });
    }

    function iniciarAutocomplete() {
        document
            .querySelectorAll(".pesquisa-desktop input, .pesquisa-mobile input")
            .forEach(configurarAutocomplete);

        // Pré-carrega o catálogo em segundo plano para a 1ª sugestão ser instantânea
        carregarCatalogoBusca();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarAutocomplete);
    } else {
        iniciarAutocomplete();
    }

})();