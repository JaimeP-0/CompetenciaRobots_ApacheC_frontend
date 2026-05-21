/**
 * Búsqueda de equipos.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");

    function initBuscar(outlet) {
        var input = outlet.querySelector('#cr-buscar-input');
        var btn = outlet.querySelector('#cr-buscar-btn');
        var results = outlet.querySelector('#cr-buscar-results');
        if (!input || !btn || !results || !w.CRApi || typeof w.CRApi.getCatalogSearchTeams !== 'function') {
            return;
        }
        function run() {
            var q = String(input.value || '').trim();
            if (!q) {
                results.innerHTML =
                    '<p class="cr-catalog-msg">Escribe un término de búsqueda (equipo, escuela, tutor o integrante).</p>';
                return;
            }
            results.innerHTML = '<div class="flex flex-col gap-2">' + CRDom.skeletonCards(3) + '</div>';
            w.CRApi.getCatalogSearchTeams(q)
                .then(function (data) {
                    var items = (data && data.items) || [];
                    results.innerHTML = items.length
                        ? '<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/55">' +
                          items.length +
                          (items.length === 1 ? ' resultado' : ' resultados') +
                          '</p><div class="cr-catalog-hit-list">' +
                          items
                              .map(function (t) {
                                  var cap = String(t.captain_name || '').trim();
                                  var capPart = cap ? ' · Capitán: ' + CRDom.escapeHtml(cap) : '';
                                  return (
                                      '<a class="cr-catalog-hit cr-catalog-hit--compact" href="#/equipo/' +
                                      t.id +
                                      '"><span class="cr-catalog-hit-title">' +
                                      CRDom.escapeHtml(t.name) +
                                      '</span><span class="cr-catalog-hit-sub">' +
                                      CRDom.escapeHtml(t.school) +
                                      capPart +
                                      ' · ' +
                                      CRDom.escapeHtml(t.category_name || 'Categoría') +
                                      '</span></a>'
                                  );
                              })
                              .join('') +
                          '</div>'
                        : '<p class="cr-catalog-msg">No hay coincidencias. Prueba con otra palabra o revisa la ortografía.</p>';
                })
                .catch(function () {
                    results.innerHTML =
                        '<p class="cr-catalog-msg cr-catalog-msg--error">Error al buscar. Revisa la conexión e inténtalo de nuevo.</p>';
                });
        }
        btn.addEventListener('click', run, false);
        input.addEventListener(
            'keydown',
            function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    run();
                }
            },
            false
        );
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.buscar = initBuscar;
})(window);
