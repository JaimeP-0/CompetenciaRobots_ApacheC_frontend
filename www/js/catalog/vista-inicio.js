/**
 * Inicio (#/) — módulo 1 catálogo público.
 */
(function (w) {
    'use strict';

    function initInicio(outlet) {
        var root = (outlet && outlet.querySelector('#cr-inicio-root')) || outlet;
        if (w.CRIcons && typeof w.CRIcons.decorate === 'function') {
            w.CRIcons.decorate(root || outlet);
        }
        if (w.CRStaffShell && typeof w.CRStaffShell.bind === 'function') {
            w.CRStaffShell.bind(root || outlet);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.inicio = initInicio;
})(window);
