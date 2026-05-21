/**
 * Enlaza vistas del catálogo con routes.js (catalogInit).
 */
(function (w) {
    'use strict';

    var V = w.CRCatalogViews;
    if (!V) throw new Error('Carga catalog/vista-*.js antes');

    w.CRCatalog = {
        initInicio: V.inicio,
        initCategorias: V.categorias,
        initCategoriaDetalle: V.categoriaDetalle,
        initEquipos: V.equiposLista,
        initEquipoDetalle: V.equipoDetalle,
        initValidados: V.validados,
        initBuscar: V.buscar
    };
})(window);
