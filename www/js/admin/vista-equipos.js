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

    function decorateIcons(el) {
        if (w.CRIcons && typeof w.CRIcons.decorate === 'function' && el) {
            w.CRIcons.decorate(el);
        }
    }

    function initAdminEquipos(outlet) {
        if (w.CRAdminNav) {
            w.CRAdminNav.mount(outlet, 'equipos');
        }
        decorateIcons(outlet);

        var listHost = outlet.querySelector('#admin-equipos-list');
        var countEl = outlet.querySelector('#admin-equipos-count');
        var pagTop = outlet.querySelector('#admin-equipos-pagination');
        var pagFoot = outlet.querySelector('#admin-equipos-pagination-foot');
        var msgEl = outlet.querySelector('#admin-equipos-msg');
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
                msgEl.textContent = '';
                return;
            }
            msgEl.textContent = text;
            msgEl.classList.remove('hidden');
            msgEl.classList.toggle('cr-admin-msg--error', !!isError);
            msgEl.classList.toggle('cr-admin-cats-toast--ok', !isError);
        }

        function updateCount() {
            if (!countEl) {
                return;
            }
            var n = state.total;
            countEl.textContent = n === 1 ? '1 equipo' : n + ' equipos';
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
                      ' · Página ' +
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

        function renderEquipoCard(t, cats) {
            var schoolLine = [t.school, t.grade].filter(Boolean).join(' · ') || '—';
            var teacher = t.teacher ? 'Tutor: ' + esc(t.teacher) : '';
            return (
                '<article class="cr-admin-equipo-card" data-team-id="' +
                esc(t.id) +
                '">' +
                '<div class="cr-admin-equipo-card-inner">' +
                '<header class="cr-admin-equipo-card-top">' +
                '<div class="cr-admin-cat-card-id" aria-label="Identificador">#' +
                esc(t.id) +
                '</div>' +
                '<div class="cr-admin-equipo-card-info">' +
                '<p class="cr-admin-equipo-card-name">' +
                esc(t.name) +
                '</p>' +
                '<p class="cr-admin-equipo-card-meta">' +
                esc(schoolLine) +
                '</p>' +
                (teacher ? '<p class="cr-admin-equipo-card-teacher">' + teacher + '</p>' : '') +
                '</div></header>' +
                '<section class="cr-admin-equipo-cat-panel" aria-labelledby="equipo-cat-' +
                esc(t.id) +
                '">' +
                '<h3 id="equipo-cat-' +
                esc(t.id) +
                '" class="cr-admin-equipo-cat-title">' +
                '<span class="cr-admin-cat-rules-title-icon" data-cr-icon="tag" aria-hidden="true"></span>' +
                'Categoría de competencia</h3>' +
                '<div class="cr-admin-equipo-cat-row">' +
                '<label class="sr-only" for="equipo-cat-sel-' +
                esc(t.id) +
                '">Categoría para ' +
                esc(t.name) +
                '</label>' +
                '<select id="equipo-cat-sel-' +
                esc(t.id) +
                '" class="cr-admin-select cr-admin-equipo-cat">' +
                optionsCategorias(cats, t.category_id) +
                '</select>' +
                '<button type="button" class="cr-admin-icon-btn cr-admin-btn-save-equipo" title="Guardar categoría">' +
                '<span data-cr-icon="check" data-cr-icon-class="cr-icon--btn-only"></span>' +
                '<span class="cr-admin-icon-btn-label">Guardar</span></button>' +
                '</div></section></div></article>'
            );
        }

        function renderList() {
            var teams = state.teams;
            var cats = state.cats;
            updateCount();

            if (!state.total) {
                listHost.innerHTML =
                    '<div class="cr-admin-cats-empty">' +
                    '<span class="cr-admin-cats-empty-icon" data-cr-icon="user-group" aria-hidden="true"></span>' +
                    '<p class="cr-admin-cats-empty-title">Sin equipos</p>' +
                    '<p class="cr-admin-cats-empty-desc">Prueba otro filtro o agrega equipos desde el registro.</p>' +
                    '</div>';
                decorateIcons(listHost);
                mountPagination();
                return;
            }

            listHost.innerHTML = teams.map(function (t) {
                return renderEquipoCard(t, cats);
            }).join('');
            decorateIcons(listHost);
            mountPagination();
        }

        function loadPage(opts) {
            opts = opts || {};
            listHost.setAttribute('aria-busy', 'true');
            listHost.innerHTML = '<p class="cr-admin-cats-loading">Cargando equipos…</p>';
            if (countEl) {
                countEl.textContent = '…';
            }
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
                    renderList();
                })
                .catch(function (err) {
                    listHost.innerHTML =
                        '<div class="cr-admin-cats-empty cr-admin-cats-empty--error">' +
                        '<span class="cr-admin-cats-empty-icon" data-cr-icon="exclamation-triangle" aria-hidden="true"></span>' +
                        '<p class="cr-admin-cats-empty-title">No se pudieron cargar</p>' +
                        '<p class="cr-admin-cats-empty-desc">' +
                        esc((err && err.message) || 'Error al cargar equipos') +
                        '</p></div>';
                    decorateIcons(listHost);
                    if (countEl) {
                        countEl.textContent = '—';
                    }
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
            var card = btn.closest('.cr-admin-equipo-card');
            if (!card) {
                return;
            }
            var teamId = card.getAttribute('data-team-id');
            var sel = card.querySelector('.cr-admin-equipo-cat');
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
