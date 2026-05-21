/**
 * Admin: asignar categoría (#/admin/equipos). Paginación según config (cliente o servidor).
 */
(function (w) {
    'use strict';

    var Almacen = w.CRAdminAlmacen;
    var Dom = w.CRDom;

    function pageSize() {
        var n = Number((w.CR_CONFIG || w.CR_APP || {}).adminEquiposPorPagina);
        if (isNaN(n) || n < 1) {
            return 15;
        }
        return Math.min(100, Math.floor(n));
    }

    function esc(s) {
        return Dom && Dom.escapeHtml ? Dom.escapeHtml(s) : String(s == null ? '' : s);
    }

    function initAdminEquipos(outlet) {
        if (w.CRAdminNav) {
            w.CRAdminNav.mount(outlet, 'equipos');
        }
        var listHost = outlet.querySelector('#admin-equipos-list');
        var pagTop = outlet.querySelector('#admin-equipos-pagination');
        var pagFoot = outlet.querySelector('#admin-equipos-pagination-foot');
        var msgEl = outlet.querySelector('#admin-equipos-msg');
        var modoEl = outlet.querySelector('#admin-equipos-modo');
        var formFiltro = outlet.querySelector('#f-admin-equipos-filtro');
        var inputBuscar = outlet.querySelector('#admin-equipos-buscar');
        var selFiltroCat = outlet.querySelector('#admin-equipos-filtro-cat');
        if (!listHost || !Almacen || !w.CRApi || typeof w.CRApi.fetchRegistroTeamsPage !== 'function') {
            return function () {};
        }

        var state = {
            page: 1,
            total: 0,
            teams: [],
            cats: [],
            modo: 'cliente',
            filtroQ: '',
            filtroCat: ''
        };

        function showMsg(text, isError) {
            if (!msgEl) {
                return;
            }
            if (!text) {
                msgEl.classList.add('hidden');
                return;
            }
            msgEl.textContent = text;
            msgEl.classList.remove('hidden');
            msgEl.classList.toggle('cr-admin-msg--error', !!isError);
        }

        function updateModoLabel(aviso) {
            if (!modoEl) {
                return;
            }
            var cfgModo =
                typeof w.CRApi.adminEquiposPaginacionModo === 'function'
                    ? w.CRApi.adminEquiposPaginacionModo()
                    : 'cliente';
            var texto =
                cfgModo === 'servidor'
                    ? 'Paginación desde el servidor (GET /registro con page y limit).'
                    : 'Una sola carga del listado; filtro y páginas en el navegador.';
            if (aviso) {
                texto += ' ' + aviso;
            }
            modoEl.textContent = texto;
        }

        function fillCategoriaFiltro(cats) {
            if (!selFiltroCat) {
                return;
            }
            var html = '<option value="">Todas</option>';
            (cats || []).forEach(function (c) {
                html +=
                    '<option value="' +
                    esc(c.id) +
                    '"' +
                    (String(state.filtroCat) === String(c.id) ? ' selected' : '') +
                    '>' +
                    esc(c.name) +
                    '</option>';
            });
            selFiltroCat.innerHTML = html;
        }

        function optionsCategorias(cats, selectedId) {
            var sel = Number(selectedId, 10);
            var html = '<option value="">— Sin categoría —</option>';
            cats.forEach(function (c) {
                var id = Number(c.id, 10);
                html +=
                    '<option value="' +
                    esc(c.id) +
                    '"' +
                    (id === sel ? ' selected' : '') +
                    '>' +
                    esc(c.name) +
                    '</option>';
            });
            return html;
        }

        function totalPages() {
            var ps = pageSize();
            return state.total ? Math.ceil(state.total / ps) : 1;
        }

        function paginationHtml() {
            var tp = totalPages();
            var ps = pageSize();
            var start = state.total ? (state.page - 1) * ps + 1 : 0;
            var end = Math.min(state.page * ps, state.total);
            var prevDisabled = state.page <= 1;
            var nextDisabled = state.page >= tp;

            return (
                '<div class="cr-admin-pagination-inner">' +
                '<p class="cr-admin-pagination-info">' +
                (state.total
                    ? 'Mostrando ' +
                      start +
                      '–' +
                      end +
                      ' de ' +
                      state.total +
                      ' equipos · Página ' +
                      state.page +
                      ' de ' +
                      tp
                    : 'Sin equipos con este filtro') +
                '</p>' +
                '<div class="cr-admin-pagination-btns">' +
                '<button type="button" class="cr-app-btn cr-app-btn--outline cr-admin-page-prev"' +
                (prevDisabled ? ' disabled' : '') +
                '>Anterior</button>' +
                '<button type="button" class="cr-app-btn cr-app-btn--outline cr-admin-page-next"' +
                (nextDisabled ? ' disabled' : '') +
                '>Siguiente</button>' +
                '</div></div>'
            );
        }

        function mountPagination() {
            var html = paginationHtml();
            var show = state.total > pageSize();
            [pagTop, pagFoot].forEach(function (el) {
                if (!el) {
                    return;
                }
                if (show) {
                    el.innerHTML = html;
                    el.classList.remove('hidden');
                } else {
                    el.innerHTML = state.total ? paginationHtml() : '';
                    el.classList.toggle('hidden', !state.total);
                }
            });
        }

        function renderTable() {
            var teams = state.teams;
            var cats = state.cats;
            if (!state.total) {
                listHost.innerHTML =
                    '<p class="cr-catalog-msg">No hay equipos que coincidan. Prueba otro filtro o revisa el registro en el servidor.</p>';
                mountPagination();
                return;
            }
            listHost.innerHTML =
                '<div class="cr-admin-equipos-table-wrap">' +
                '<table class="cr-admin-equipos-table">' +
                '<thead><tr>' +
                '<th scope="col">Equipo</th>' +
                '<th scope="col">Escuela</th>' +
                '<th scope="col">Categoría</th>' +
                '<th scope="col"><span class="sr-only">Acción</span></th>' +
                '</tr></thead><tbody>' +
                teams
                    .map(function (t) {
                        return (
                            '<tr class="cr-admin-equipo-row" data-team-id="' +
                            esc(t.id) +
                            '">' +
                            '<td class="cr-admin-equipo-name">' +
                            esc(t.name) +
                            '</td>' +
                            '<td class="cr-admin-equipo-meta" data-label="Escuela">' +
                            esc(t.school || '—') +
                            '</td>' +
                            '<td data-label="Categoría">' +
                            '<label class="sr-only">Categoría para ' +
                            esc(t.name) +
                            '</label>' +
                            '<select class="cr-admin-select cr-admin-equipo-cat">' +
                            optionsCategorias(cats, t.category_id) +
                            '</select></td>' +
                            '<td class="cr-admin-equipo-actions">' +
                            '<button type="button" class="cr-app-btn cr-app-btn--primary cr-admin-btn-save-equipo">Guardar</button>' +
                            '</td></tr>'
                        );
                    })
                    .join('') +
                '</tbody></table></div>';
            mountPagination();
        }

        function loadPage(opts) {
            opts = opts || {};
            listHost.setAttribute('aria-busy', 'true');
            [pagTop, pagFoot].forEach(function (el) {
                if (el) {
                    el.classList.add('hidden');
                }
            });

            return Almacen.ensureSeeded()
                .then(function () {
                    return Almacen.getCategorias();
                })
                .then(function (cats) {
                    state.cats = cats || [];
                    fillCategoriaFiltro(state.cats);
                    return w.CRApi.fetchRegistroTeamsPage({
                        page: state.page,
                        limit: pageSize(),
                        q: state.filtroQ,
                        categoryId: state.filtroCat,
                        force: !!opts.force
                    });
                })
                .then(function (res) {
                    res = res || {};
                    state.teams = res.items || [];
                    state.total = Number(res.total, 10) || 0;
                    state.modo = res.modo || 'cliente';
                    if (res.page != null) {
                        state.page = res.page;
                    }
                    var tp = totalPages();
                    if (state.page > tp) {
                        state.page = tp || 1;
                        return loadPage({ force: opts.force });
                    }
                    updateModoLabel(res.aviso || '');
                    renderTable();
                })
                .catch(function (err) {
                    listHost.innerHTML =
                        '<p class="cr-catalog-msg cr-catalog-msg--error">' +
                        esc((err && err.message) || 'Error al cargar equipos') +
                        '</p>';
                    [pagTop, pagFoot].forEach(function (el) {
                        if (el) {
                            el.classList.add('hidden');
                        }
                    });
                })
                .finally(function () {
                    listHost.setAttribute('aria-busy', 'false');
                });
        }

        function onFiltroSubmit(e) {
            e.preventDefault();
            state.filtroQ = inputBuscar ? String(inputBuscar.value || '').trim() : '';
            state.filtroCat = selFiltroCat ? selFiltroCat.value : '';
            state.page = 1;
            loadPage({ force: state.modo === 'servidor' });
        }

        function onListClick(e) {
            var prev = e.target.closest('.cr-admin-page-prev');
            var next = e.target.closest('.cr-admin-page-next');
            if (prev && !prev.disabled) {
                state.page -= 1;
                loadPage();
                return;
            }
            if (next && !next.disabled) {
                state.page += 1;
                loadPage();
                return;
            }

            var btn = e.target.closest('.cr-admin-btn-save-equipo');
            if (!btn) {
                return;
            }
            var row = btn.closest('tr.cr-admin-equipo-row');
            if (!row) {
                return;
            }
            var teamId = row.getAttribute('data-team-id');
            var sel = row.querySelector('.cr-admin-equipo-cat');
            var catId = sel ? sel.value : '';
            btn.disabled = true;
            Almacen.setEquipoCategoria(teamId, catId === '' ? null : catId)
                .then(function () {
                    showMsg('Categoría guardada.');
                    w.CRApi.clearRegistroCache();
                    return loadPage({ force: true });
                })
                .catch(function (err) {
                    showMsg(err.message, true);
                })
                .finally(function () {
                    btn.disabled = false;
                });
        }

        listHost.addEventListener('click', onListClick, false);
        if (pagTop) {
            pagTop.addEventListener('click', onListClick, false);
        }
        if (pagFoot) {
            pagFoot.addEventListener('click', onListClick, false);
        }
        if (formFiltro) {
            formFiltro.addEventListener('submit', onFiltroSubmit, false);
        }

        loadPage();

        return function cleanup() {
            listHost.removeEventListener('click', onListClick, false);
            if (pagTop) {
                pagTop.removeEventListener('click', onListClick, false);
            }
            if (pagFoot) {
                pagFoot.removeEventListener('click', onListClick, false);
            }
            if (formFiltro) {
                formFiltro.removeEventListener('submit', onFiltroSubmit, false);
            }
        };
    }

    w.CRAdminVistaEquipos = { init: initAdminEquipos };
})(window);
