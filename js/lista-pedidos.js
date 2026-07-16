/* ==========================================================
   LISTA DE PEDIDOS
========================================================== */

class ListaPedidos {

    static STORAGE = CONFIG.lista.storage;

    static obter() {

        return JSON.parse(
            localStorage.getItem(this.STORAGE) || "[]"
        );

    }

    static salvar(lista) {

        localStorage.setItem(
            this.STORAGE,
            JSON.stringify(lista)
        );

        this.atualizarContador();

        document.dispatchEvent(
            new CustomEvent("listaPedidosAtualizada", {
                detail: {
                    quantidade: this.quantidade(),
                    lista
                }
            })
        );

    }

    static existe(id) {

        return this.obter().some(item => item.id == id);

    }

    static adicionar(produto) {

        const lista = this.obter();

        if (lista.some(item => item.id == produto.id)) {

            return false;

        }

        lista.push({

            id: produto.id,
            quantidade: 1,
            selecionado: true

        });

        this.salvar(lista);

        this.toast(
            "Produto adicionado à sua lista.",
            true
        );

        return true;

    }

    static remover(id) {

        const lista = this.obter().filter(item => item.id != id);

        this.salvar(lista);

        this.toast(
            "Produto removido da sua lista."
        );

    }

    static alternar(produto) {

        if (this.existe(produto.id)) {

            this.remover(produto.id);

            return false;

        }

        this.adicionar(produto);

        return true;

    }

    static quantidade() {

        return this.obter().length;

    }

    static alterarQuantidade(id, quantidade) {

        const lista = this.obter();

        const item = lista.find(item => item.id == id);

        if (!item) return;

        item.quantidade = Math.max(1, quantidade);

        this.salvar(lista);

    }

    static aumentar(id) {

        const lista = this.obter();

        const item = lista.find(item => item.id == id);

        if (!item) return;

        item.quantidade++;

        this.salvar(lista);

    }

    static diminuir(id) {

        const lista = this.obter();

        const item = lista.find(item => item.id == id);

        if (!item) return;

        item.quantidade--;

        if (item.quantidade < 1) {

            this.remover(id);

            return;

        }

        this.salvar(lista);

    }

    static selecionar(id, selecionado) {

        const lista = this.obter();

        const item = lista.find(item => item.id == id);

        if (!item) return;

        item.selecionado = selecionado;

        this.salvar(lista);

    }

    static atualizarContador() {

        const contador = document.getElementById("contador-lista");

        if (!contador) return;

        contador.textContent = this.quantidade();

        contador.classList.remove("pulse");

        void contador.offsetWidth;

        contador.classList.add("pulse");

    }

    static toast(texto, mostrarBotao = false) {

        let toast = document.getElementById("toast-lista");

        if (!toast) {

            toast = document.createElement("div");

            toast.id = "toast-lista";

            toast.className = "toast-lista";

            document.body.appendChild(toast);

        }

        toast.innerHTML = `
            <span>${texto}</span>

            ${mostrarBotao
                ? `<a href="lista-pedidos.html">Ver Lista</a>`
                : ""}
        `;

        toast.classList.add("mostrar");

        clearTimeout(this.timer);

        this.timer = setTimeout(() => {

            toast.classList.remove("mostrar");

        }, 3000);

    }

    static async buscarProduto(id) {

        const catalogo = await carregarCatalogoCompleto();

        return catalogo.find(produto => String(produto.id) === String(id));

    }

}

/* ==========================================================
   CARREGAR CATÁLOGO COMPLETO
========================================================== */

/* ==========================================================
   CACHE DO CATÁLOGO
========================================================== */

let catalogoCache = null;

/* ==========================================================
   CARREGAR TODOS OS PRODUTOS DO CATÁLOGO
========================================================== */

async function carregarCatalogoCompleto() {

    if (catalogoCache) {
        return catalogoCache;
    }

    const respostaCategorias = await fetch(
        "data/categorias.json"
    );

    const categorias = await respostaCategorias.json();

    let produtos = [];

    for (const categoria of categorias) {

        try {

            const arquivo = encodeURIComponent(
                categoria.id
            );

            const resposta = await fetch(
                `data/${arquivo}.json`
            );

            if (!resposta.ok) continue;

            const lista = await resposta.json();

            produtos = produtos.concat(lista);

        } catch (erro) {

            console.warn(
                "Erro ao carregar categoria:",
                categoria.id
            );

        }

    }

    catalogoCache = produtos;

    return catalogoCache;

}

document.addEventListener("DOMContentLoaded", () => {

    ListaPedidos.atualizarContador();

});