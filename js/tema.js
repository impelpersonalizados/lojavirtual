const botaoTema = document.getElementById("botao-tema");

function aplicarTema(tema){

    document.body.classList.toggle(
        "tema-dark",
        tema === "dark"
    );

    if(botaoTema){

        botaoTema.innerHTML =
            tema === "dark"
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';

    }

    const logoImagem = document.getElementById("logo-imagem");

    if (logoImagem) {

        logoImagem.src = tema === "dark" ? "logo1.png" : "logo.png";

    }

}

function carregarTema(){

    let tema = localStorage.getItem("tema");

    if(!tema){

        tema = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

    }

    aplicarTema(tema);

}

function alternarTema(){

    const dark =
        document.body.classList.contains("tema-dark");

    const tema = dark ? "light" : "dark";

    localStorage.setItem("tema", tema);

    aplicarTema(tema);

}

botaoTema?.addEventListener(
    "click",
    alternarTema
);

carregarTema();