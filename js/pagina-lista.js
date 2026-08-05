/* ==========================================================
   PÁGINA MINHA LISTA DE PEDIDOS
========================================================== */

// FUNÇÃO LOCAL PARA RESOLVER CAMINHO DA IMAGEM
function resolverImagemLocal(caminho) {
    if (!caminho) return "";
    if (/^https?:\/\//i.test(caminho)) return caminho;
    return "/front-end/" + caminho;
}

let _renderizandoListaPedidos = false;

async function carregarPaginaLista() {

    const area = document.getElementById("lista-produtos-pedidos");

    if (!area) return;

    // 🔥 TRAVA DE SEGURANÇA: evita que duas chamadas sobrepostas
    // (ex.: disparadas quase ao mesmo tempo) limpem e redesenhem
    // a área ao mesmo tempo, o que causava produtos duplicados na tela.
    if (_renderizandoListaPedidos) return;
    _renderizandoListaPedidos = true;

    try {
        await _renderizarListaPedidos(area);
    } finally {
        _renderizandoListaPedidos = false;
    }

}

async function _renderizarListaPedidos(area) {

    const lista = ListaPedidos.obter();

    if (lista.length === 0) {

        area.innerHTML = `
            <div class="lista-vazia">
                <i class="fa-regular fa-heart"></i>
                <h2>Sua lista está vazia</h2>
                <p>Adicione produtos ao catálogo para montar seu pedido.</p>
                <a href="index.html">Voltar ao catálogo</a>
            </div>
        `;

        return;

    }

    area.innerHTML = "";

    for (const item of lista) {

        const produto = await ListaPedidos.buscarProduto(item.id);

        if (!produto) continue;

        const card = document.createElement("article");
        card.className = "card-lista-pedido";

        // 🔥 MOSTRA O NOME COM A VARIAÇÃO SE EXISTIR (APENAS NO NOME)
        const nomeExibido = item.nomeCompleto || produto.nome;

        const imagemProduto = produto.imagens && produto.imagens.length > 0
            ? produto.imagens[0]
            : produto.imagem;

        card.innerHTML = `
            <div class="linha-conteudo">
                <div class="coluna-esquerda">
                    <input 
                        type="checkbox"
                        class="selecionar-produto"
                        data-id="${produto.id}"
                        ${item.selecionado ? "checked" : ""}>

                    <button class="remover-produto" data-id="${produto.id}">
                        <img src="https://cdn-icons-png.flaticon.com/512/73/73806.png" alt="Remover" class="icone-lixeira">
                    </button>
                </div>

                <img 
                    src="${obterUrlMiniatura(resolverImagemLocal(imagemProduto), 200)}"
                    alt="${nomeExibido}"
                    loading="lazy"
                    decoding="async">

                <div class="info-lista-pedido">
                    <h3>${nomeExibido}</h3>
                    <p>Código: ${produto.id}</p>
                    <strong>R$ ${produto.preco.toFixed(2).replace(".", ",")}</strong>

                    <div class="controle-quantidade">
                        <button class="diminuir-quantidade" data-id="${produto.id}">−</button>
                        <span>${item.quantidade}</span>
                        <button class="aumentar-quantidade" data-id="${produto.id}">+</button>
                    </div>
                </div>
            </div>
        `;

        area.appendChild(card);

    }

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await carregarPaginaLista();

        await atualizarResumoLista();

        atualizarCupomAplicado();

    }
);

document.addEventListener("click", (evento) => {

    // 🔥 VERIFICA SE O CLIQUE FOI NO BOTÃO REMOVER OU NO ÍCONE DENTRO DELE
    const botaoRemover = evento.target.closest(".remover-produto");

    if (botaoRemover) {
        const id = botaoRemover.dataset.id;
        if (id) {
            ListaPedidos.remover(id);
            return;
        }
    }

    // Verifica os outros botões
    const id = evento.target.dataset.id;
    if (!id) return;

    if (evento.target.classList.contains("aumentar-quantidade")) {
        ListaPedidos.aumentar(id);
    }

    if (evento.target.classList.contains("diminuir-quantidade")) {
        ListaPedidos.diminuir(id);
    }

});



document.addEventListener(
    "listaPedidosAtualizada",
    () => {

        carregarPaginaLista();

        atualizarResumoLista();

    }
);

document.addEventListener(
    "change",
    (evento) => {


        if (
            evento.target.classList.contains(
                "selecionar-produto"
            )
        ) {


            const id = evento.target.dataset.id;


            ListaPedidos.selecionar(
                id,
                evento.target.checked
            );

            atualizarResumoLista();

        }


    }
);

/* ==========================================================
   CALCULAR SUBTOTAL
========================================================== */

async function atualizarResumoLista() {


    const subtotalElemento = document.getElementById(
        "subtotal-pedido"
    );

    const descontoElemento = document.getElementById(
        "desconto-pedido"
    );


    const totalElemento = document.getElementById(
        "total-pedido"
    );

    if (
        !subtotalElemento ||
        !descontoElemento ||
        !totalElemento
    ) return;



    const lista = ListaPedidos.obter();


    let subtotal = 0;

    let desconto = 0;



    for (const item of lista) {


        if (!item.selecionado) continue;



        const produto = await ListaPedidos.buscarProduto(
            item.id
        );


        if (!produto) continue;



        subtotal += produto.preco * item.quantidade;


    }



    subtotalElemento.textContent =
        subtotal.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        );

    const cupom = JSON.parse(
        localStorage.getItem("impel_cupom")
    );

    if (cupom) {

        if (cupom.tipo === "percentual") {

            desconto =
                subtotal * cupom.valor / 100;

        }

        if (cupom.tipo === "fixo") {

            desconto = cupom.valor;

        }

    }

    const total = subtotal - desconto;

    descontoElemento.textContent =
        desconto.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        );

    totalElemento.textContent =
        total.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        );


}

/* ==========================================================
   ATUALIZAR VISUAL DO CUPOM
========================================================== */

function atualizarCupomAplicado() {

    const area = document.getElementById(
        "cupom-aplicado"
    );

    const texto = document.getElementById(
        "texto-cupom"
    );

    if (!area || !texto) return;

    const cupom = JSON.parse(
        localStorage.getItem("impel_cupom")
    );

    if (!cupom) {

        area.classList.remove("ativo");

        return;

    }

    texto.textContent =
        `✓ Cupom aplicado: ${cupom.codigo}`;

    area.classList.add("ativo");

}

/* ==========================================================
   GERAR MENSAGEM DO PEDIDO
========================================================== */

async function gerarMensagemPedido() {

    const lista = ListaPedidos.obter();

    let subtotal = 0;
    let desconto = 0;
    let total = 0;

    let mensagem = `Olá!

Gostaria de solicitar um orçamento.

*Produtos:*

`;

    for (const item of lista) {

        if (!item.selecionado) continue;

        const produto = await ListaPedidos.buscarProduto(item.id);

        if (!produto) continue;

        const totalProduto = produto.preco * item.quantidade;

        subtotal += totalProduto;

        // 🔥 MOSTRA O NOME COM A VARIAÇÃO SE EXISTIR
        const nomeExibido = item.nomeCompleto || produto.nome;
        const variacaoTexto = item.variacaoEscolhida ? ` (${item.variacaoEscolhida})` : "";

        mensagem += `✔ ${item.quantidade}x ${nomeExibido}${variacaoTexto}
${totalProduto.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        )}

`;

    }

    // ... resto do código (cupom, total, observações)
    const cupom = JSON.parse(localStorage.getItem("impel_cupom"));

    if (cupom) {

        if (cupom.tipo === "percentual") {
            desconto = subtotal * cupom.valor / 100;
        }

        if (cupom.tipo === "fixo") {
            desconto = cupom.valor;
        }

    }

    total = subtotal - desconto;

    mensagem +=
        `━━━━━━━━━━━━━━━━━━

💰 Resumo

Subtotal:
${subtotal.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        )}
`;

    if (cupom) {

        mensagem +=
            `Cupom:
${cupom.codigo}

Desconto:
-${desconto.toLocaleString(
                CONFIG.pedido.locale,
                {
                    style: "currency",
                    currency: CONFIG.pedido.moeda
                }
            )}
`;

    }

    mensagem +=
        `
Total:
${total.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        )}
`;

    const observacoes = document
        .getElementById("observacoes-pedido")
        ?.value
        .trim();

    if (observacoes) {

        mensagem += `

Observações:
${observacoes}`;

    }

    return mensagem;

}

/* ==========================================================
   ENVIAR PELO WHATSAPP
========================================================== */

document.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("#botao-enviar-whatsapp");
    if (!botao) return;

    const lista = ListaPedidos.obter();
    const itensSelecionados = lista.filter(item => item.selecionado);

    if (itensSelecionados.length === 0) {
        toastCupom("Selecione pelo menos um produto para enviar.", false);
        return;
    }

    // 🔥 SALVA O ÚLTIMO PEDIDO ANTES DE LIMPAR
    const itensCompletos = await Promise.all(
        itensSelecionados.map(async (item) => {
            const produto = await ListaPedidos.buscarProduto(item.id);
            return {
                ...item,
                nome: produto?.nome || "Produto",
                preco: produto?.preco || 0,
                imagem: produto?.imagens?.[0] || produto?.imagem || ""
            };
        })
    );

    ListaPedidos.salvarUltimoPedido(itensCompletos);

    // Gera a mensagem
    const mensagem = await gerarMensagemPedido();
    const telefone = CONFIG.empresa.whatsapp;

    // Abre o WhatsApp
    window.open(
        `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,
        "_blank"
    );

    // 🔥 LIMPA A LISTA
    const idsParaRemover = itensSelecionados.map(item => item.id);
    idsParaRemover.forEach(id => {
        ListaPedidos.remover(id);
    });

    // 🔥 REDIRECIONA PARA A PÁGINA INICIAL
    window.location.href = "index.html";
});

/* ==========================================================
   CARREGAR ÚLTIMO PEDIDO
========================================================== */

function carregarUltimoPedido() {
    const container = document.getElementById("ultimoPedidoContainer");
    const resumo = document.getElementById("ultimoPedidoResumo");
    const data = document.getElementById("ultimoPedidoData");

    const ultimoPedido = ListaPedidos.obterUltimoPedido();

    if (!ultimoPedido || !ultimoPedido.itens || ultimoPedido.itens.length === 0) {
        container.style.display = "none";
        return;
    }

    const total = ultimoPedido.itens.reduce((sum, item) => {
        return sum + (item.preco || 0) * (item.quantidade || 1);
    }, 0);

    const totalProdutos = ultimoPedido.itens.reduce((sum, item) => {
        return sum + (item.quantidade || 1);
    }, 0);

    resumo.textContent = `${totalProdutos} produto${totalProdutos > 1 ? 's' : ''} • R$ ${total.toFixed(2).replace('.', ',')}`;
    data.textContent = `Enviado em ${ultimoPedido.data}`;

    container.style.display = "block";
}

/* ==========================================================
   ABRIR MODAL ÚLTIMO PEDIDO
========================================================== */

let ultimoPedidoItens = [];

function abrirModalUltimoPedido() {
    const ultimoPedido = ListaPedidos.obterUltimoPedido();
    if (!ultimoPedido || !ultimoPedido.itens || ultimoPedido.itens.length === 0) return;

    ultimoPedidoItens = ultimoPedido.itens;

    const modal = document.getElementById("modalUltimoPedido");
    const lista = document.getElementById("modalUltimoPedidoLista");
    const data = document.getElementById("modalUltimoPedidoData");

    // Atualiza a data
    data.textContent = `Pedido enviado em ${ultimoPedido.data}`;

    // Limpa a lista
    lista.innerHTML = "";

    // Adiciona os itens com checkbox
    ultimoPedido.itens.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "ultimo-pedido-item";
        div.innerHTML = `
            <input type="checkbox" class="ultimo-pedido-checkbox" data-index="${index}" checked>
            <img src="${item.imagem || ''}" alt="${item.nome}" class="item-imagem" onerror="this.style.display='none'">
            <div class="item-info">
                <span class="item-nome">${item.nome}</span>
                <span class="item-detalhes">${item.variacaoEscolhida ? item.variacaoEscolhida + ' • ' : ''}${item.quantidade || 1}x</span>
                <span class="item-preco">R$ ${(item.preco || 0).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        lista.appendChild(div);
    });

    // Atualiza o botão
    atualizarBotaoAdicionarUltimo();

    modal.classList.add("ativo");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function fecharModalUltimoPedido() {
    const modal = document.getElementById("modalUltimoPedido");
    modal.classList.remove("ativo");
    modal.style.display = "none";
    document.body.style.overflow = "";
}

function atualizarBotaoAdicionarUltimo() {
    const checkboxes = document.querySelectorAll(".ultimo-pedido-checkbox");
    const btn = document.getElementById("modalUltimoAdicionarTodos");
    const selecionados = document.querySelectorAll(".ultimo-pedido-checkbox:checked");

    btn.disabled = selecionados.length === 0;
    btn.innerHTML = `
        <i class="fa-regular fa-heart"></i>
        Adicionar Selecionados à Lista (${selecionados.length})
    `;
}

/* ==========================================================
   EVENTOS DO MODAL ÚLTIMO PEDIDO
========================================================== */

// Abrir modal ao clicar no card
document.addEventListener("click", (evento) => {
    if (evento.target.closest("#ultimoPedidoCard") ||
        evento.target.closest("#abrirModalUltimoPedido")) {
        abrirModalUltimoPedido();
    }
});

// Fechar modal
document.addEventListener("click", (evento) => {
    if (evento.target.closest("#fecharModalUltimoPedido") ||
        evento.target.closest("#modalUltimoFechar")) {
        fecharModalUltimoPedido();
    }
});

// Fechar ao clicar no overlay
document.addEventListener("click", (evento) => {
    if (evento.target.closest(".modal-ultimo-overlay")) {
        fecharModalUltimoPedido();
    }
});

// Atualizar botão ao marcar/desmarcar checkbox
document.addEventListener("change", (evento) => {
    if (evento.target.classList.contains("ultimo-pedido-checkbox")) {
        atualizarBotaoAdicionarUltimo();
    }
});

// Adicionar selecionados à lista
// Adicionar selecionados à lista
document.addEventListener("click", async (evento) => {
    if (evento.target.closest("#modalUltimoAdicionarTodos")) {
        const checkboxes = document.querySelectorAll(".ultimo-pedido-checkbox:checked");

        if (checkboxes.length === 0) return;

        let adicionados = 0;

        for (const checkbox of checkboxes) {
            const index = parseInt(checkbox.dataset.index);
            const item = ultimoPedidoItens[index];

            if (item) {
                // Verifica se já existe na lista
                if (!ListaPedidos.existeVariacao(item.id, item.variacaoEscolhida || null)) {
                    ListaPedidos.adicionar({
                        id: item.id,
                        nome: item.nome,
                        nomeCompleto: item.nomeCompleto || item.nome,
                        variacaoEscolhida: item.variacaoEscolhida || null,
                        preco: item.preco || 0,
                        imagens: item.imagem ? [item.imagem] : []
                    });
                    adicionados++;
                }
            }
        }

        // 🔥 FECHA O MODAL
        fecharModalUltimoPedido();

        // 🔥 ATUALIZA A LISTA NA TELA IMEDIATAMENTE
        await carregarPaginaLista();
        await atualizarResumoLista();

        // 🔥 ATUALIZA OS BOTÕES DE CORAÇÃO EM TODA A PÁGINA
        if (typeof atualizarBotoesListaPedidos === 'function') {
            atualizarBotoesListaPedidos();
        }

        // 🔥 ATUALIZA O CONTADOR DA LISTA
        ListaPedidos.atualizarContador();

        // Mostra o toast
        if (adicionados > 0) {
            toastCupom(`✅ ${adicionados} produto${adicionados > 1 ? 's' : ''} adicionado${adicionados > 1 ? 's' : ''} à lista!`, true);
        } else {
            toastCupom("⚠️ Os produtos já estão na sua lista.", false);
        }
    }
}); 

// Fechar com ESC
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharModalUltimoPedido();
    }
});

/* ==========================================================
   INICIALIZAR
========================================================== */

// Carregar último pedido ao iniciar
document.addEventListener("DOMContentLoaded", async () => {
    // ... código existente ...

    // Carrega o último pedido
    carregarUltimoPedido();
});

/* ==========================================================
   FUNÇÕES DO MODAL LIMPAR LISTA
========================================================== */

let itensParaLimpar = [];

function abrirModalLimparLista(itens) {
    itensParaLimpar = itens;
    const modal = document.getElementById("modalLimparLista");
    if (modal) {
        modal.classList.add("ativo");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Impede scroll
    }
}

function fecharModalLimparLista() {
    const modal = document.getElementById("modalLimparLista");
    if (modal) {
        modal.classList.remove("ativo");
        modal.style.display = "none";
        document.body.style.overflow = ""; // Restaura scroll
    }
}

// Botão "Manter Lista"
document.addEventListener("click", async (evento) => {
    if (evento.target.closest("#modalLimparManter")) {
        fecharModalLimparLista();
        toastCupom("📋 Lista mantida para próximo pedido.", true);

        // Redireciona para a página inicial
        window.location.href = "index.html";
    }
});

// Botão "Limpar Lista"
document.addEventListener("click", async (evento) => {
    if (evento.target.closest("#modalLimparRemover")) {
        // Remove os itens selecionados
        const idsParaRemover = itensParaLimpar.map(item => item.id);
        idsParaRemover.forEach(id => {
            ListaPedidos.remover(id);
        });

        fecharModalLimparLista();

        toastCupom("🧹 Lista limpa com sucesso!", true);

        // Redireciona para a página inicial
        window.location.href = "index.html";
    }
});

// Fechar ao clicar no overlay
document.addEventListener("click", (evento) => {
    if (evento.target.closest(".modal-limpar-overlay")) {
        fecharModalLimparLista();
    }
});

// Fechar com a tecla ESC
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharModalLimparLista();
    }
});

/* ==========================================================
   APLICAR CUPOM
========================================================== */

document
    .getElementById("botao-aplicar-cupom")
    ?.addEventListener(
        "click",
        async () => {

            const campo = document.getElementById(
                "codigo-cupom"
            );

            const codigo = campo.value.trim();

            if (!codigo) {

                toastCupom(
                    "Digite um cupom.",
                    false
                );

                return;

            }

            const cupom =
                await Cupons.buscar(codigo);

            if (!cupom) {

                toastCupom(
                    "Cupom inválido.",
                    false
                );

                return;

            }

            localStorage.setItem(
                "impel_cupom",
                JSON.stringify(cupom)
            );

            atualizarResumoLista();

            atualizarCupomAplicado();

            toastCupom(
                `Cupom ${cupom.codigo} aplicado!`
            );

        }
    );

/* ==========================================================
REMOVER CUPOM
========================================================== */

document
    .getElementById("botao-remover-cupom")
    ?.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "impel_cupom"
            );

            atualizarResumoLista();

            atualizarCupomAplicado();

            toastCupom(
                "Cupom removido."
            );

        }
    );