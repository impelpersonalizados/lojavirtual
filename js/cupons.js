/* ==========================================================
   CUPONS DE DESCONTO
========================================================== */

class Cupons {

    static cache = null;

    static async carregar() {

        if (this.cache) {

            return this.cache;

        }

        const resposta = await fetch(
            "data/cupons.json"
        );

        this.cache = await resposta.json();

        return this.cache;

    }

    static async buscar(codigo) {

        const cupons = await this.carregar();

        return cupons.find(cupom =>

            cupom.codigo.toUpperCase() ===
            codigo.toUpperCase()

            &&

            cupom.ativo

        );

    }

}

/* ==========================================================
   TOAST DOS CUPONS
========================================================== */

function toastCupom(texto, sucesso = true) {

    let toast = document.getElementById("toast-cupom");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "toast-cupom";

        toast.className = "toast-cupom";

        document.body.appendChild(toast);

    }

    toast.textContent = texto;

    toast.classList.remove("sucesso", "erro");

    toast.classList.add(
        sucesso ? "sucesso" : "erro"
    );

    toast.classList.add("mostrar");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

        toast.classList.remove("mostrar");

    }, 3000);

}