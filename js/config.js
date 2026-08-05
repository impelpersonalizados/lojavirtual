/* ==========================================================
   CONFIGURAÇÕES DO CATÁLOGO
========================================================== */

const CONFIG = {

    empresa: {

        nome: "Impel Personalizados",

        whatsapp: "5574999641627",

        instagram: "impel_personalizados"

    },

    pedido: {

        moeda: "BRL",

        locale: "pt-BR"

    },

    lista: {

        storage: "impel_lista_pedidos"

    }

};

/* ==========================================================
   MINIATURAS (CLOUDINARY)
   Gera uma URL de miniatura a partir da URL original, para
   evitar carregar a imagem em resolução total nos cards.
========================================================== */

function obterUrlMiniatura(url, largura = 400) {

    if (!url) return url;

    if (/res\.cloudinary\.com\//i.test(url) && url.includes("/upload/")) {
        return url.replace(
            "/upload/",
            `/upload/w_${largura},h_${largura},c_fill,q_auto:eco,f_auto,dpr_auto/`
        );
    }

    return url;

}