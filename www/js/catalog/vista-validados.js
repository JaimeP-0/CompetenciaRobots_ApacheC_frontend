/**
 * Listado de equipos con verificación aprobada (#/validados).
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function parseItems(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        return [];
    }

    function formatFecha(iso) {
        if (!iso) {
            return '—';
        }
        try {
            var d = new Date(iso);
            if (isNaN(d.getTime())) {
                return String(iso);
            }
            return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return String(iso);
        }
    }

    function initValidados(outlet) {
        var listHost = outlet.querySelector('#cr-validados-list');
        var countEl = outlet.querySelector('#cr-validados-count');
        var form = outlet.querySelector('#f-validados-filtro');
        var inputBuscar = outlet.querySelector('#cr-validados-buscar');
        var selCat = outlet.querySelector('#cr-validados-cat');
        if (!listHost || !w.CRApi || typeof w.CRApi.getValidaciones !== 'function') {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(outlet);
        }

        var filtroQ = '';
        var filtroCat = '';

        function setCount(n, loading) {
            if (!countEl) {
                return;
            }
            if (loading || n === 0) {
                countEl.classList.add('hidden');
                countEl.textContent = '';
                return;
            }
            countEl.textContent = n === 1 ? '1 equipo validado' : n + ' equipos validados';
            countEl.classList.remove('hidden');
        }

        function fillCategorias() {
            if (!selCat || !w.CRApi.fetchCategorias) {
                return Promise.resolve();
            }
            return w.CRApi.fetchCategorias().then(function (cats) {
                var html = '<option value="">Todas las categorías</option>';
                (cats || []).forEach(function (c) {
                    html +=
                        '<option value="' +
                        CRDom.escapeHtml(c.id) +
                        '"' +
                        (String(filtroCat) === String(c.id) ? ' selected' : '') +
                        '>' +
                        CRDom.escapeHtml(c.name) +
                        '</option>';
                });
                selCat.innerHTML = html;
            });
        }

        function renderCard(t) {
            var cap = String(t.captain_name || '').trim();
            var capHtml = cap
                ? '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Capitán</span> ' +
                  CRDom.escapeHtml(cap) +
                  '</span>'
                : '';
            var catChip = t.category_name
                ? '<span class="cr-catalog-team-chip">' + CRDom.escapeHtml(t.category_name) + '</span>'
                : '';
            return (
                '<article class="cr-catalog-team-card cr-validados-card">' +
                '<div class="cr-catalog-team-card-top">' +
                '<a class="cr-catalog-team-name cr-catalog-team-name--compact" href="#/equipo/' +
                t.id +
                '">' +
                CRDom.escapeHtml(t.name) +
                '</a>' +
                '<span class="cr-validados-badge" title="Verificación aprobada">' +
                '<span class="cr-validados-badge-icon" data-cr-icon="check-circle" aria-hidden="true"></span>' +
                '<span class="cr-validados-badge-text">Validado</span></span></div>' +
                '<p class="cr-catalog-team-line cr-catalog-team-line--school">' +
                '<span class="min-w-0 truncate">' +
                CRDom.escapeHtml(t.school || '—') +
                '</span>' +
                catChip +
                '</p>' +
                '<p class="cr-catalog-team-line cr-catalog-team-line--dense">' +
                (capHtml ? capHtml + '<span class="cr-catalog-team-dot" aria-hidden="true">·</span>' : '') +
                '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Validado</span> ' +
                CRDom.escapeHtml(formatFecha(t.validated_at)) +
                '</span></p></article>'
            );
        }

        function renderEmpty() {
            var conFiltro = !!(filtroQ || filtroCat);
            listHost.innerHTML =
                '<div class="cr-validados-empty">' +
                '<span class="cr-validados-empty-icon" data-cr-icon="clipboard-document-check" aria-hidden="true"></span>' +
                '<h2 class="cr-validados-empty-title">' +
                (conFiltro ? 'Sin resultados' : 'Aún no hay equipos validados') +
                '</h2>' +
                '<p class="cr-validados-empty-desc">' +
                (conFiltro
                    ? 'Prueba otro término o quita el filtro de categoría.'
                    : 'Los equipos verificados en Registrar robots aparecerán aquí.') +
                '</p>' +
                '<a href="#/registro" data-route="/registro" class="cr-app-btn cr-app-btn--primary cr-validados-empty-cta">Registrar robots</a>' +
                '</div>';
            if (w.CRIcons) {
                w.CRIcons.decorate(listHost);
            }
        }

        function loadList() {
            listHost.setAttribute('aria-busy', 'true');
            setCount(0, true);
            listHost.innerHTML = '<p class="cr-validados-loading">Cargando equipos validados…</p>';
            var query = { pass: 1, limit: 100 };
            if (filtroQ) {
                query.q = filtroQ;
            }
            if (filtroCat) {
                query.category_id = filtroCat;
            }
            return w.CRApi.getValidaciones(query)
                .then(function (data) {
                    var items = parseItems(data);
                    setCount(items.length, false);
                    if (!items.length) {
                        renderEmpty();
                        return;
                    }
                    listHost.innerHTML = items.map(renderCard).join('');
                    if (w.CRIcons) {
                        w.CRIcons.decorate(listHost);
                    }
                })
                .catch(function () {
                    setCount(0, true);
                    listHost.innerHTML =
                        '<div class="cr-validados-empty cr-validados-empty--error">' +
                        '<span class="cr-validados-empty-icon" data-cr-icon="exclamation-triangle" aria-hidden="true"></span>' +
                        '<h2 class="cr-validados-empty-title">No se pudo cargar</h2>' +
                        '<p class="cr-validados-empty-desc">Comprueba tu conexión e inténtalo de nuevo.</p>' +
                        '</div>';
                    if (w.CRIcons) {
                        w.CRIcons.decorate(listHost);
                    }
                })
                .finally(function () {
                    listHost.setAttribute('aria-busy', 'false');
                });
        }

        fillCategorias().then(loadList);

        if (form) {
            form.addEventListener(
                'submit',
                function (e) {
                    e.preventDefault();
                    filtroQ = inputBuscar ? String(inputBuscar.value || '').trim() : '';
                    filtroCat = selCat ? selCat.value : '';
                    loadList();
                },
                false
            );
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.validados = initValidados;
})(window);
