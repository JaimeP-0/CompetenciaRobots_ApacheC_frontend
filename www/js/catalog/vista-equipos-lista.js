/**
 * Listado de equipos por categoría (GET /categorias/{id}/equipos).
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function initEquipos(outlet, params) {
        var routeCatId =
            params && params.categoryId != null && params.categoryId !== ''
                ? String(params.categoryId)
                : null;
        var titulo = outlet.querySelector('#cr-equipos-titulo');
        var subt = outlet.querySelector('#cr-equipos-sub');
        var listHost = outlet.querySelector('#cr-equipos-list');
        var selCat = outlet.querySelector('#cr-equipos-filtro-categoria');
        if (!listHost || !w.CRApi || typeof w.CRApi.getCatalogTeams !== 'function') {
            return;
        }
        var cfg = w.CR_CONFIG || w.CR_APP || {};
        var rawItems = [];
        var mq = w.matchMedia('(min-width: 640px)');

        if (w._crEquiposMq) {
            w._crEquiposMq.mq.removeEventListener('change', w._crEquiposMq.fn);
            w._crEquiposMq = null;
        }
        if (typeof w._crEquiposCatCleanup === 'function') {
            w._crEquiposCatCleanup();
            w._crEquiposCatCleanup = null;
        }

        function pintarLista() {
            var items = cfg.aplicarOrdenUnoEnLista(
                rawItems,
                cfg.catalogEquipoPosicionId,
                cfg.catalogEquipoPosicion,
                cfg.catalogEquipoPosicionSm
            );
            listHost.innerHTML = items
                .map(function (t) {
                    var cap = String(t.captain_name || '').trim();
                    var capHtml = cap
                        ? '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Capitán</span> ' +
                          CRDom.escapeHtml(cap) +
                          '</span>'
                        : '<span class="cr-catalog-team-inline text-graphite/50"><span class="cr-catalog-team-inline-k">Capitán</span> —</span>';
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
                        '</span></p>' +
                        '<p class="cr-catalog-team-line cr-catalog-team-line--dense">' +
                        capHtml +
                        '<span class="cr-catalog-team-dot" aria-hidden="true">·</span>' +
                        '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Tutor</span> ' +
                        CRDom.escapeHtml(t.teacher) +
                        '</span></p></article>'
                    );
                })
                .join('');
        }

        w._crEquiposMq = { mq: mq, fn: pintarLista };
        mq.addEventListener('change', pintarLista);

        function showPickCategory() {
            if (titulo) {
                titulo.textContent = 'Equipos';
            }
            if (subt) {
                subt.textContent = 'Elige una categoría para ver sus equipos.';
            }
            listHost.innerHTML =
                '<p class="cr-catalog-msg">Selecciona una categoría arriba.</p>';
        }

        function loadTeams(catId) {
            if (!catId) {
                showPickCategory();
                return;
            }
            if (titulo) {
                titulo.textContent = 'Equipos de la categoría';
            }
            if (subt) {
                subt.textContent = 'Cargando listado…';
            }
            listHost.innerHTML = CRDom.skeletonCards(3);
            w.CRApi.getCatalogTeams({ categoryId: catId })
                .then(function (data) {
                    rawItems = (data && data.items) || [];
                    var catLabel = data && data.categoryName ? String(data.categoryName) : '';
                    if (subt) {
                        subt.textContent = catLabel
                            ? 'Categoría: ' + catLabel
                            : 'Equipos de la categoría seleccionada.';
                    }
                    if (!rawItems.length) {
                        listHost.innerHTML =
                            '<p class="cr-catalog-msg">No hay equipos en esta categoría.</p>';
                        return;
                    }
                    pintarLista();
                })
                .catch(function () {
                    if (subt) {
                        subt.textContent = '';
                    }
                    listHost.innerHTML =
                        '<p class="cr-catalog-msg cr-catalog-msg--error">Error al cargar equipos. Comprueba la conexión.</p>';
                });
        }

        function fillCategorySelect(cats) {
            if (!selCat) {
                loadTeams(routeCatId);
                return;
            }
            var html = '<option value="">— Elige categoría —</option>';
            (cats || []).forEach(function (c) {
                if (c && c.id != null && c.name) {
                    html +=
                        '<option value="' +
                        CRDom.escapeHtml(String(c.id)) +
                        '">' +
                        CRDom.escapeHtml(c.name) +
                        '</option>';
                }
            });
            selCat.innerHTML = html;
            var initial = routeCatId || selCat.value;
            if (initial) {
                selCat.value = initial;
            }
            loadTeams(selCat.value || null);
        }

        function onCategoryChange() {
            loadTeams(selCat && selCat.value ? selCat.value : null);
        }

        if (selCat) {
            selCat.addEventListener('change', onCategoryChange, false);
            w._crEquiposCatCleanup = function () {
                selCat.removeEventListener('change', onCategoryChange, false);
            };
        }

        showPickCategory();
        if (w.CRApi && typeof w.CRApi.fetchCategorias === 'function') {
            w.CRApi.fetchCategorias()
                .then(fillCategorySelect)
                .catch(function () {
                    fillCategorySelect([]);
                });
        } else {
            fillCategorySelect([]);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.equiposLista = initEquipos;
})(window);
