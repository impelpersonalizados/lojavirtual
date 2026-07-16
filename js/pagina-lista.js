/* ==========================================================
   PÁGINA MINHA LISTA DE PEDIDOS
========================================================== */


async function carregarPaginaLista() {


    const area = document.getElementById(
        "lista-produtos-pedidos"
    );


    if (!area) return;



    const lista = ListaPedidos.obter();



    if (lista.length === 0) {


        area.innerHTML = `

            <div class="lista-vazia">

                <i class="fa-regular fa-heart"></i>

                <h2>
                    Sua lista está vazia
                </h2>


                <p>
                    Adicione produtos ao catálogo para montar seu pedido.
                </p>


                <a href="index.html">

                    Voltar ao catálogo

                </a>

            </div>

        `;


        return;

    }



    area.innerHTML = "";



    for (const item of lista) {


        const produto = await ListaPedidos.buscarProduto(
            item.id
        );


        if (!produto) continue;



        const card = document.createElement("article");


        card.className = "card-lista-pedido";



        card.innerHTML = `

            <input 
                type="checkbox"
                class="selecionar-produto"
                data-id="${produto.id}"
                ${item.selecionado ? "checked" : ""}>


            <img 
                src="${produto.imagem}"
                alt="${produto.nome}">



            <div class="info-lista-pedido">


                <h3>
                    ${produto.nome}
                </h3>


                <p>
                    Código: ${produto.id}
                </p>


                <strong>
                    R$ ${produto.preco
                .toFixed(2)
                .replace(".", ",")}
                </strong>



                <div class="controle-quantidade">


                    <button 
                        class="diminuir-quantidade"
                        data-id="${produto.id}">

                        −

                    </button>



                    <span>

                        ${item.quantidade}

                    </span>



                    <button 
                        class="aumentar-quantidade"
                        data-id="${produto.id}">

                        +

                    </button>


                </div>



            </div>



            <button 
                class="remover-produto"
                data-id="${produto.id}">

                🗑 Remover

            </button>


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


    const id = evento.target.dataset.id;


    if (!id) return;



    if (
        evento.target.classList.contains(
            "aumentar-quantidade"
        )
    ) {


        ListaPedidos.aumentar(id);

    }



    if (
        evento.target.classList.contains(
            "diminuir-quantidade"
        )
    ) {


        ListaPedidos.diminuir(id);


    }



    if (
        evento.target.classList.contains(
            "remover-produto"
        )
    ) {


        ListaPedidos.remover(id);

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

        mensagem += `✔ ${item.quantidade}x ${produto.nome}
${totalProduto.toLocaleString(
            CONFIG.pedido.locale,
            {
                style: "currency",
                currency: CONFIG.pedido.moeda
            }
        )}

`;

    }

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

document.addEventListener(
    "click",
    async (evento) => {

        if (
            evento.target.closest(
                "#botao-enviar-whatsapp"
            )
        ) {

            const mensagem =
                await gerarMensagemPedido();

            const telefone = CONFIG.empresa.whatsapp;

            window.open(

                `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,

                "_blank"

            );

        }

    }
);

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