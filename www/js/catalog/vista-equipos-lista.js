/**
 * Listado de equipos por categoría o todos.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");

    function initEquipos(outlet, params) {
        var catId = params && params.categoryId != null && params.categoryId !== '' ? String(params.categoryId) : null;
        var titulo = outlet.querySelector('#cr-equipos-titulo');
        var subt = outlet.querySelector('#cr-equipos-sub');
        var listHost = outlet.querySelector('#cr-equipos-list');
        if (!listHost || !w.CRApi || typeof w.CRApi.getCatalogTeams !== 'function') {
            return;
        }
        var volver = outlet.querySelector('#cr-equipos-volver');
        if (volver) {
            volver.setAttribute('data-route', catId ? '/categoria/' + catId : '/categorias');
        }
        if (titulo) {
            titulo.textContent = catId ? 'Equipos de la categoría' : 'Todos los equipos';
        }
        if (subt) {
            subt.textContent = 'Cargando listado…';
        }
        listHost.innerHTML = CRDom.skeletonCards(3);
        w.CRApi.getCatalogTeams(catId ? { categoryId: catId } : {})
            .then(function (data) {
                var items = (data && data.items) || [];
                var catLabel = data && data.categoryName ? String(data.categoryName) : '';
                if (subt) {
                    if (catId && catLabel) {
                        subt.textContent = 'Filtrado por: ' + catLabel;
                    } else if (catId) {
                        subt.textContent = 'Equipos de la categoría seleccionada';
                    } else {
                        subt.textContent = 'Listado completo de equipos inscritos en todas las categorías.';
                    }
                }
                if (!items.length) {
                    listHost.innerHTML =
                        '<p class="cr-catalog-msg">No hay equipos que mostrar con este filtro.</p>';
                    return;
                }
                listHost.innerHTML = items
                    .map(function (t) {
                        var cap = String(t.captain_name || '').trim();
                        var capHtml = cap
                            ? '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Capitán</span> ' +
                              CRDom.escapeHtml(cap) +
                              '</span>'
                            : '<span class="cr-catalog-team-inline text-graphite/50"><span class="cr-catalog-team-inline-k">Capitán</span> —</span>';
                        var catChip =
                            t.category_name && !catId
                                ? '<span class="cr-catalog-team-chip">' + CRDom.escapeHtml(t.category_name) + '</span>'
                                : '';
                        return (
                            '<article class="cr-catalog-team-card cr-catalog-team-card--compact">' +
                            '<div class="cr-catalog-team-card-top">' +
                            '<a class="cr-catalog-team-name cr-catalog-team-name--compact" href="#/equipo/' +
                            t.id +
                            '">' +
                            CRDom.escapeHtml(t.name) +
                            '</a>' +
                            '<span class="cr-catalog-team-tag cr-catalog-team-tag--sm">' +
                            CRDom.escapeHtml(t.grade || '—') +
                            '</span></div>' +
                            '<p class="cr-catalog-team-line cr-catalog-team-line--school">' +
                            '<span class="min-w-0 truncate">' +
                            CRDom.escapeHtml(t.school) +
                            '</span>' +
                            catChip +
                            '</p>' +
                            '<p class="cr-catalog-team-line cr-catalog-team-line--dense">' +
                            capHtml +
                            '<span class="cr-catalog-team-dot" aria-hidden="true">·</span>' +
                            '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Tutor</span> ' +
                            CRDom.escapeHtml(t.teacher) +
                            '</span></p></article>'
                        );
                    })
                    .join('');
            })
            .catch(function () {
                if (subt) {
                    subt.textContent = '';
                }
                listHost.innerHTML =
                    '<p class="cr-catalog-msg cr-catalog-msg--error">Error al cargar equipos. Comprueba la conexión.</p>';
            });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.equiposLista = initEquipos;
})(window);
