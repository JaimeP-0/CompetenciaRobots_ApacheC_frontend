/**
 * Inicio (#/) — módulo 1 catálogo público.
 */
(function (w) {
    'use strict';

    function initInicio(outlet) {
        var root = (outlet && outlet.querySelector('#cr-inicio-root')) || outlet;
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();

        if (
            ses &&
            w.CRQueueRoutes &&
            typeof w.CRQueueRoutes.staffIsMatchSpectator === 'function' &&
            w.CRQueueRoutes.staffIsMatchSpectator(ses) &&
            typeof w.CRQueueRoutes.staffWorkspaceHash === 'function'
        ) {
            w.location.hash = w.CRQueueRoutes.staffWorkspaceHash(ses);
            return;
        }

        if (w.CRIcons && typeof w.CRIcons.decorate === 'function') {
            w.CRIcons.decorate(root || outlet);
        }
        if (w.CRStaffShell && typeof w.CRStaffShell.bind === 'function') {
            w.CRStaffShell.bind(root || outlet);
        }

        if (!root) {
            return;
        }
        var registroCard = root.querySelector('[data-route="/registro"]');
        if (
            registroCard &&
            ses &&
            w.CRQueueRoutes &&
            typeof w.CRQueueRoutes.staffMayUseRegistro === 'function' &&
            !w.CRQueueRoutes.staffMayUseRegistro(ses)
        ) {
            registroCard.classList.add('hidden');
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.inicio = initInicio;
})(window);
