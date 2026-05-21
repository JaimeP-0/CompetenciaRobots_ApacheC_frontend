/**
 * Reglamento de una categoría.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");

    function initCategoriaDetalle(outlet, params) {
        var id = String((params && params.categoryId) || '').trim();
        var titleEl = outlet.querySelector('#cr-cat-detalle-titulo');
        var rulesEl = outlet.querySelector('#cr-cat-detalle-reglas');
        var equiposBtn = outlet.querySelector('#cr-cat-detalle-equipos-btn');
        if (!titleEl || !rulesEl || !w.CRApi || typeof w.CRApi.getCatalogCategory !== 'function') {
            return;
        }
        titleEl.textContent = 'Cargando…';
        rulesEl.innerHTML =
            '<div class="space-y-3">' +
            '<div class="cr-catalog-skel cr-catalog-skel-line max-w-md"></div>' +
            '<div class="cr-catalog-skel cr-catalog-skel-line max-w-lg"></div>' +
            '<div class="cr-catalog-skel cr-catalog-skel-line max-w-sm"></div></div>';
        if (equiposBtn) {
            equiposBtn.setAttribute('data-route', '/categoria/' + id + '/equipos');
        }
        w.CRApi.getCatalogCategory(id)
            .then(function (data) {
                var cat = data && data.category;
                var rules = (data && data.rules) || [];
                if (!cat) {
                    titleEl.textContent = 'Categoría no encontrada';
                    rulesEl.innerHTML =
                        '<p class="cr-catalog-msg cr-catalog-msg--error">No existe esta categoría o ya no está disponible.</p>';
                    return;
                }
                titleEl.textContent = cat.name || 'Categoría';
                rulesEl.innerHTML = rules.length
                    ? '<div class="cr-catalog-rule-list" role="list">' +
                      rules
                          .map(function (r, idx) {
                              return (
                                  '<div class="cr-catalog-rule" role="listitem">' +
                                  '<span class="cr-catalog-rule-num" aria-hidden="true">' +
                                  (idx + 1) +
                                  '</span>' +
                                  '<p class="cr-catalog-rule-text">' +
                                  CRDom.escapeHtml(r.description) +
                                  '</p></div>'
                              );
                          })
                          .join('') +
                      '</div>'
                    : '<p class="cr-catalog-msg">No hay reglas registradas para esta categoría todavía.</p>';
            })
            .catch(function () {
                titleEl.textContent = 'Categoría';
                rulesEl.innerHTML =
                    '<p class="cr-catalog-msg cr-catalog-msg--error">No se pudo cargar la categoría. Inténtalo más tarde.</p>';
            });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.categoriaDetalle = initCategoriaDetalle;
})(window);
