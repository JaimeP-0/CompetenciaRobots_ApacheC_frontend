/**
 * Inicio (#/) — módulo 1 catálogo público.
 */
(function (w) {
    'use strict';

    function initInicio(outlet) {
        if (w.CRIcons && typeof w.CRIcons.decorate === 'function') {
            w.CRIcons.decorate(outlet);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.inicio = initInicio;
})(window);
