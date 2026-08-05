/* ==========================================================
   LISTA DE PEDIDOS
========================================================== */

class ListaPedidos {

    static STORAGE = CONFIG.lista.storage;

    // js/lista-pedidos.js

    static obter() {
        const lista = JSON.parse(localStorage.getItem(this.STORAGE) || "[]");

        // 🔥 MIGRAÇÃO: Adiciona idUnico para itens antigos
        return lista.map(item => {
            if (!item.idUnico) {
                const variacao = item.variacaoEscolhida || null;
                item.idUnico = variacao
                    ? `${item.id}-${variacao.replace(/\s+/g, '-').toLowerCase()}`
                    : String(item.id);
            }
            return item;
        });
    }

    static salvar(lista) {

        localStorage.setItem(
            this.STORAGE,
            JSON.stringify(lista)
        );

        // 🔥 CORREÇÃO: atualizarContador() já dispara o evento
        // "listaPedidosAtualizada". Disparar de novo aqui fazia o evento
        // acontecer duas vezes por salvamento, o que fazia a página
        // "Minha Lista" renderizar os produtos em dobro.
        this.atualizarContador();

    }

    static existe(id) {

        return this.obter().some(item => item.id == id);

    }

    // js/lista-pedidos.js

    static existeVariacao(id, variacao = null) {
        const lista = this.obter();

        if (!variacao) {
            // Sem variação: verifica só pelo ID
            return lista.some(item => String(item.id) === String(id));
        }

        // Com variação: verifica pelo ID + variação
        const idUnico = `${id}-${variacao.replace(/\s+/g, '-').toLowerCase()}`;
        return lista.some(item => item.idUnico === idUnico);
    }

    // js/lista-pedidos.js

    static adicionar(produto) {
        const lista = this.obter();
        const variacaoNova = produto.variacaoEscolhida || null;

        // 🔥 CRIA UM ID ÚNICO PARA CADA VARIAÇÃO
        const idUnico = variacaoNova
            ? `${produto.id}-${variacaoNova.replace(/\s+/g, '-').toLowerCase()}`
            : String(produto.id);

        // Verifica se já existe essa variação ESPECÍFICA na lista
        const indiceExistente = lista.findIndex(item => item.idUnico === idUnico);

        if (indiceExistente !== -1) {
            this.toast(`"${produto.nomeCompleto || produto.nome}" já está na sua lista.`, true);
            return false;
        }

        // Cria o item com ID único
        const itemParaSalvar = {
            id: produto.id,
            idUnico: idUnico,              // ← NOVO: identificador único por variação
            quantidade: 1,
            selecionado: true
        };

        if (produto.variacaoEscolhida) {
            itemParaSalvar.variacaoEscolhida = produto.variacaoEscolhida;
            itemParaSalvar.nomeCompleto = produto.nomeCompleto || produto.nome;
        }

        lista.push(itemParaSalvar);
        this.salvar(lista);

        const mensagem = produto.variacaoEscolhida
            ? `"${produto.nomeCompleto}" adicionado à sua lista.`
            : `"${produto.nome}" adicionado à sua lista.`;

        this.toast(mensagem, true);
        return true;
    }

    // js/lista-pedidos.js

    static remover(id, variacao = null) {
        const lista = this.obter();

        let novaLista;

        if (variacao) {
            // Remove variação específica
            const idUnico = `${id}-${variacao.replace(/\s+/g, '-').toLowerCase()}`;
            novaLista = lista.filter(item => item.idUnico !== idUnico);
        } else {
            // Remove todos os itens com esse ID (sem variação)
            novaLista = lista.filter(item => String(item.id) !== String(id));
        }

        this.salvar(novaLista);
    }

    static alternar(produto) {

        if (this.existe(produto.id)) {

            this.remover(produto.id);

            // Anima o botão ao remover
            this.animarBotao(produto.id);

            return false;

        }

        this.adicionar(produto);

        // Anima o botão ao adicionar
        this.animarBotao(produto.id);

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

        // 🔥 DISPARA EVENTO PARA REAVALIAR OS BOTÕES
        document.dispatchEvent(
            new CustomEvent("listaPedidosAtualizada", {
                detail: {
                    quantidade: this.quantidade(),
                    lista: this.obter()
                }
            })
        );

    }

    static toast(texto, mostrarBotao = false) {

        // Remove toast anterior se existir
        const toastExistente = document.getElementById("toast-lista");
        if (toastExistente) {
            toastExistente.remove();
        }

        // Cria o novo toast
        const toast = document.createElement("div");
        toast.id = "toast-lista";
        toast.className = "toast-lista";

        // Cria o conteúdo
        const span = document.createElement("span");
        span.textContent = texto;
        toast.appendChild(span);

        if (mostrarBotao) {
            const link = document.createElement("a");
            link.href = "lista-pedidos.html";
            link.textContent = "Ver Lista";
            toast.appendChild(link);
        }

        document.body.appendChild(toast);

        // Força o reflow para garantir que a transição funcione
        void toast.offsetWidth;

        // Mostra o toast
        toast.classList.add("mostrar");

        // Limpa o timer anterior
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
        }

        // Esconde após 3 segundos
        this._toastTimer = setTimeout(() => {
            toast.classList.remove("mostrar");
            // Remove do DOM após a transição
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 400);
        }, 3000);

    }

    static async buscarProduto(id) {

        const catalogo = await carregarCatalogoCompleto();

        return catalogo.find(produto => String(produto.id) === String(id));

    }

    static animarBotao(id) {
        const botoes = document.querySelectorAll(`.botao-lista[data-id="${id}"]`);
        botoes.forEach(botao => {
            // Reinicia a animação mesmo que o botão já esteja com a classe
            // (ex.: cliques rápidos em sequência)
            botao.classList.remove("adicionando");
            void botao.offsetWidth; // força reflow para reiniciar a animação
            botao.classList.add("adicionando");
            setTimeout(() => {
                botao.classList.remove("adicionando");
            }, 500); // igual à duração da animação heartBeat/pulsoAnel no CSS
        });
    }

    // ==========================================================
    //   ÚLTIMO PEDIDO (SALVAR/RECUPERAR)
    // ==========================================================

    static STORAGE_ULTIMO = "impel_ultimo_pedido";

    static salvarUltimoPedido(itens) {
        if (!itens || itens.length === 0) return;

        const ultimoPedido = {
            itens: itens,
            data: new Date().toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }),
            timestamp: Date.now()
        };

        localStorage.setItem(
            this.STORAGE_ULTIMO,
            JSON.stringify(ultimoPedido)
        );
    }

    static obterUltimoPedido() {
        const dados = localStorage.getItem(this.STORAGE_ULTIMO);
        if (!dados) return null;

        try {
            return JSON.parse(dados);
        } catch {
            return null;
        }
    }

    static limparUltimoPedido() {
        localStorage.removeItem(this.STORAGE_ULTIMO);
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