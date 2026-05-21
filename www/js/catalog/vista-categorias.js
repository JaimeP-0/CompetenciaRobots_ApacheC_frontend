/**
 * Lista de categorías (#/categorias).
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");

    function initCategorias(outlet) {
        var host = outlet.querySelector('#cr-cat-list');
        if (!host || !w.CRApi || typeof w.CRApi.getCatalogCategories !== 'function') {
            return;
        }
        host.innerHTML = CRDom.skeletonCards(4);
        w.CRApi.getCatalogCategories()
            .then(function (data) {
                var items = (data && data.items) || [];
                if (!items.length) {
                    host.innerHTML = '<p class="cr-catalog-msg sm:col-span-2">Aún no hay categorías publicadas.</p>';
                    return;
                }
                host.innerHTML = items
                    .map(function (c) {
                        return (
                            '<a role="listitem" href="#/categoria/' +
                            c.id +
                            '" class="cr-catalog-cat-card cr-catalog-cat-card--icon">' +
                            '<span class="cr-catalog-cat-card-icon" data-cr-icon="document-text"></span>' +
                            '<span class="cr-catalog-cat-card-title">' +
                            CRDom.escapeHtml(c.name) +
                            '</span>' +
                            '<span class="cr-catalog-cat-card-meta cr-catalog-meta--sm">Reglamento y equipos</span>' +
                            '<span class="cr-catalog-cat-card-arrow" aria-hidden="true">›</span></a>'
                        );
                    })
                    .join('');
            })
            .catch(function () {
                host.innerHTML = '<p class="cr-catalog-msg cr-catalog-msg--error sm:col-span-2">No se pudieron cargar las categorías. Revisa la conexión e inténtalo de nuevo.</p>';
            });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.categorias = initCategorias;
})(window);
