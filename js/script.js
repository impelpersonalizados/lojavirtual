/* ==========================================================
   PROJETO: CATÁLOGO IMPEL
   ARQUIVO: script.js
========================================================== */


/* ==========================================================
   ELEMENTOS
========================================================== */

const botaoMenu = document.getElementById("botao-menu-mobile");
const menuLateral = document.querySelector(".menu-lateral");
const fundoMenu = document.querySelector(".fundo-menu");
const menuSuspensoDesktop = document.getElementById("menu-suspenso-categorias-desktop");
const menuSuspensoMobile = document.getElementById("menu-suspenso-categorias-mobile");
const botaoMenuCategorias = document.getElementById("botao-menu-categorias");

const linksMenu = [];


/* ==========================================================
   FUNÇÕES
========================================================== */

/**
 * Abre o menu lateral.
 */

function abrirMenu() {

    menuLateral.classList.add("ativo");
    fundoMenu.classList.add("ativo");

}


/**
 * Fecha o menu lateral.
 */

function fecharMenu() {

    menuLateral.classList.remove("ativo");
    fundoMenu.classList.remove("ativo");

}


/**
 * Alterna entre abrir e fechar o menu.
 */

function alternarMenu() {

    menuLateral.classList.toggle("ativo");
    fundoMenu.classList.toggle("ativo");

}


/* ==========================================================
   EVENTOS
========================================================== */

/* Botão Menu */

if (botaoMenu) {
    botaoMenu.addEventListener("click", alternarMenu);
}

if (botaoMenuCategorias) {
    botaoMenuCategorias.addEventListener("click", (event) => {
        event.stopPropagation();

        if (window.innerWidth <= 900) {
            alternarMenu();
            if (menuSuspensoDesktop) {
                menuSuspensoDesktop.classList.remove("ativo");
            }
            if (menuSuspensoMobile) {
                menuSuspensoMobile.classList.remove("ativo");
            }
            return;
        }

        menuSuspensoDesktop.classList.toggle("ativo");
        if (menuSuspensoMobile) {
            menuSuspensoMobile.classList.remove("ativo");
        }
    });
}


/* Clique no fundo */

fundoMenu.addEventListener("click", fecharMenu);


/* Clique em qualquer categoria */

function fecharMenusSuspensos() {
    if (menuSuspensoDesktop) {
        menuSuspensoDesktop.classList.remove("ativo");
    }

    if (menuSuspensoMobile) {
        menuSuspensoMobile.classList.remove("ativo");
    }
}

function registrarLinksMenu() {
    document.querySelectorAll(".menu-lateral a, .menu-suspenso a").forEach(link => {
        link.addEventListener("click", () => {
            fecharMenu();
            fecharMenusSuspensos();
        });
    });
}

function aplicarFiltroBusca(termo) {

    if (typeof window.buscarProdutosCatalogo === "function") {
        window.buscarProdutosCatalogo(termo);
        return;
    }

    const consulta = termo.trim().toLowerCase();

    // Página inicial
    if (document.querySelector(".secao-produtos")) {

        document.querySelectorAll(".secao-produtos").forEach((secao) => {

            const cards = secao.querySelectorAll(".cartao-produto");

            let algumVisivel = false;

            cards.forEach(card => {

                const visivel = card.textContent.toLowerCase().includes(consulta);

                card.style.display = visivel ? "" : "none";

                algumVisivel ||= visivel;

            });

            secao.style.display = algumVisivel ? "" : "none";

        });

        return;
    }

    // Página da categoria
    document.querySelectorAll("#lista-produtos-categoria .cartao-produto").forEach(card => {

        const visivel = card.textContent.toLowerCase().includes(consulta);

        card.style.display = visivel ? "" : "none";

    });

}
function configurarBusca() {
    const camposBusca = document.querySelectorAll(".pesquisa-desktop input, .pesquisa-mobile input");

    camposBusca.forEach((input) => {
        input.addEventListener("input", (event) => {
            aplicarFiltroBusca(event.target.value);
        });

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                aplicarFiltroBusca(input.value);
            }
        });
    });

    document.querySelectorAll(".pesquisa-desktop button, .pesquisa-mobile button").forEach((botao) => {
        botao.addEventListener("click", () => {
            const campo = botao.closest(".pesquisa-desktop, .pesquisa-mobile")?.querySelector("input");
            if (campo) {
                aplicarFiltroBusca(campo.value);
            }
        });
    });
}


/* Tecla ESC */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        fecharMenu();

        fecharMenusSuspensos();

    }

});

document.addEventListener("click", (event) => {
    const clicouNoBotao = event.target === botaoMenu || event.target === botaoMenuCategorias;

    if (
        !clicouNoBotao &&
        !document.querySelector(".menu-suspenso.desktop")?.contains(event.target) &&
        !document.querySelector(".menu-suspenso")?.contains(event.target)
    ) {
        fecharMenusSuspensos();
    }
});

function atualizarVisibilidadeBarraNavegacao() {
    const barra = document.querySelector(".barra-navegacao");
    const botaoDesktop = document.getElementById("botao-menu-categorias");

    if (!barra) {
        return;
    }

    if (window.innerWidth <= 900) {
        barra.style.display = "none";
        if (botaoDesktop) {
            botaoDesktop.classList.remove("ativo");
        }
        fecharMenusSuspensos();
        return;
    }

    if (window.scrollY <= 10) {
        barra.classList.add("ativo");
        barra.style.maxHeight = barra.scrollHeight + "px";
        barra.style.display = "flex";
        if (botaoDesktop) {
            botaoDesktop.classList.remove("ativo");
        }
    } else {
        barra.classList.remove("ativo");
        barra.style.maxHeight = "0px";
        barra.style.display = "flex";
        if (botaoDesktop) {
            botaoDesktop.classList.add("ativo");
        }
        fecharMenusSuspensos();
    }

}

configurarBusca();
window.addEventListener("scroll", atualizarVisibilidadeBarraNavegacao);
window.addEventListener("load", atualizarVisibilidadeBarraNavegacao);
window.addEventListener("resize", atualizarVisibilidadeBarraNavegacao);

async function carregarMenuCategorias() {
    try {
        const resposta = await fetch("data/categorias.json");
        const categorias = await resposta.json();

        const menuDesktop = document.getElementById("menu-navegacao");
        const menuMobile = document.getElementById("menu-lateral-lista");

        if (!menuDesktop && !menuMobile) {
            return;
        }

        const isCategoriasPage = window.location.pathname.includes("categorias.html");

        const itens = categorias.map(categoria => `
            <li><a href="categorias.html?id=${categoria.id}">${categoria.nome}</a></li>
        `).join("");

        if (menuDesktop) {
            menuDesktop.innerHTML = `
                <li><a href="${isCategoriasPage ? 'index.html' : '#todos'}"><i class="fa-solid fa-bars"></i> Todas as Categorias</a></li>
                ${itens}
            `;
        }

        if (menuMobile) {
            menuMobile.innerHTML = `
                ${isCategoriasPage ? '<li><a href="index.html">Página inicial</a></li>' : ''}
                <li><a href="${isCategoriasPage ? 'index.html' : '#todos'}">Todos</a></li>
                ${itens}
            `;
        }

        if (menuSuspensoDesktop) {
            menuSuspensoDesktop.innerHTML = itens;
        }

        if (menuSuspensoMobile) {
            menuSuspensoMobile.innerHTML = itens;
        }

        registrarLinksMenu();

        atualizarVisibilidadeBarraNavegacao();

        document.querySelectorAll("#menu-navegacao a, #menu-lateral-lista a, .menu-suspenso a").forEach(link => {

            link.addEventListener("click", function (e) {

                const destino = this.getAttribute("href");

                if (!destino.startsWith("#")) return;

                const secao = document.querySelector(destino);

                if (!secao) return;

                e.preventDefault();

                const offset = 120;

                window.scrollTo({
                    top: secao.offsetTop - offset,
                    behavior: "smooth"
                });

            });

        });

    } catch (erro) {
        console.error("Erro ao carregar categorias do menu:", erro);
    }
}

window.carregarMenuCategorias = carregarMenuCategorias;

carregarMenuCategorias();
