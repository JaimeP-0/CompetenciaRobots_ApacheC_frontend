/**
 * Admin: equipos, miembros y categoría (#/admin/equipos).
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
        var formNuevo = outlet.querySelector('#f-admin-nuevo-equipo');
        var inputBuscar = outlet.querySelector('#admin-equipos-buscar');
        var selFiltroCat = outlet.querySelector('#admin-equipos-filtro-cat');
        var selNuevoCat = outlet.querySelector('#admin-nuevo-equipo-cat');
        var inputNuevoNombre = outlet.querySelector('#admin-nuevo-equipo-nombre');
        var inputNuevoEscuela = outlet.querySelector('#admin-nuevo-equipo-escuela');
        var inputNuevoGrado = outlet.querySelector('#admin-nuevo-equipo-grado');
        var inputNuevoTutor = outlet.querySelector('#admin-nuevo-equipo-tutor');
        var btnFiltro = outlet.querySelector('#admin-equipos-filtro-btn');
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

        function fillCategoriaSelects(cats) {
            fillCategoriaFiltro(cats);
            if (!selNuevoCat) {
                return;
            }
            var html = '<option value="">— Sin categoría —</option>';
            (cats || []).forEach(function (c) {
                html += '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
            });
            selNuevoCat.innerHTML = html;
        }

        function hasCategorySelected() {
            return state.filtroCat != null && String(state.filtroCat).trim() !== '';
        }

        function syncFiltroControls() {
            var ok = hasCategorySelected();
            if (inputBuscar) {
                inputBuscar.disabled = !ok;
                if (!ok) {
                    inputBuscar.value = '';
                }
            }
            if (btnFiltro) {
                btnFiltro.disabled = !ok;
            }
        }

        function fillCategoriaFiltro(cats) {
            if (!selFiltroCat) {
                return;
            }
            var html = '<option value="">Elige una categoría…</option>';
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
            syncFiltroControls();
        }

        function renderPickCategory() {
            state.teams = [];
            state.total = 0;
            if (countEl) {
                countEl.textContent = '—';
            }
            [pagTop, pagFoot].forEach(function (el) {
                if (el) {
                    el.classList.add('hidden');
                    el.innerHTML = '';
                }
            });
            listHost.setAttribute('aria-busy', 'false');
            listHost.innerHTML =
                '<div class="cr-admin-cats-empty">' +
                '<span class="cr-admin-cats-empty-icon" data-cr-icon="tag" aria-hidden="true"></span>' +
                '<p class="cr-admin-cats-empty-title">Elige una categoría</p>' +
                '<p class="cr-admin-cats-empty-desc">Selecciona una categoría arriba y pulsa Buscar para ver sus equipos.</p>' +
                '</div>';
            decorateIcons(listHost);
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

        function renderMembers(t) {
            var members = t.members || [];
            var listHtml;
            if (!members.length) {
                listHtml =
                    '<p class="cr-admin-equipo-members-empty">Sin miembros. Agrega integrantes abajo.</p>';
            } else {
                listHtml =
                    '<ul class="cr-admin-equipo-member-list">' +
                    members
                        .map(function (m) {
                            var leader =
                                m.is_leader || m.isLeader
                                    ? '<span class="cr-admin-equipo-member-badge">Capitán</span>'
                                    : '';
                            var email = m.email
                                ? '<p class="cr-admin-equipo-member-email">' + esc(m.email) + '</p>'
                                : '';
                            return (
                                '<li class="cr-admin-equipo-member-row" data-member-id="' +
                                esc(m.id) +
                                '">' +
                                '<div class="cr-admin-equipo-member-info">' +
                                '<p class="cr-admin-equipo-member-name">' +
                                esc(m.name) +
                                leader +
                                '</p>' +
                                email +
                                '</div>' +
                                '<button type="button" class="cr-admin-icon-btn cr-admin-icon-btn--danger cr-admin-btn-del-miembro" title="Eliminar miembro">' +
                                '<span data-cr-icon="trash" data-cr-icon-class="cr-icon--btn-only"></span>' +
                                '<span class="sr-only">Eliminar</span></button></li>'
                            );
                        })
                        .join('') +
                    '</ul>';
            }

            return (
                '<section class="cr-admin-equipo-members-panel" aria-labelledby="equipo-miembros-' +
                esc(t.id) +
                '">' +
                '<h3 id="equipo-miembros-' +
                esc(t.id) +
                '" class="cr-admin-equipo-members-title">' +
                '<span class="cr-admin-cat-rules-title-icon" data-cr-icon="users" aria-hidden="true"></span>' +
                'Miembros (' +
                members.length +
                ')</h3>' +
                listHtml +
                '<div class="cr-admin-equipo-add-member" data-team-id="' +
                esc(t.id) +
                '">' +
                '<div><label class="cr-admin-label" for="miembro-nombre-' +
                esc(t.id) +
                '">Nombre</label>' +
                '<input id="miembro-nombre-' +
                esc(t.id) +
                '" type="text" class="cr-admin-input cr-admin-miembro-nombre" placeholder="Integrante" required /></div>' +
                '<div><label class="cr-admin-label" for="miembro-email-' +
                esc(t.id) +
                '">Correo</label>' +
                '<input id="miembro-email-' +
                esc(t.id) +
                '" type="email" class="cr-admin-input cr-admin-miembro-email" placeholder="Opcional" /></div>' +
                '<label class="cr-admin-equipo-add-member-leader">' +
                '<input type="checkbox" class="cr-admin-miembro-lider" /> Capitán</label>' +
                '<button type="button" class="cr-app-btn cr-app-btn--primary cr-admin-equipo-add-member-btn cr-admin-btn-add-miembro">Agregar</button>' +
                '</div></section>'
            );
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
                '</div></section>' +
                renderMembers(t) +
                '</div></article>'
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
                    '<p class="cr-admin-cats-empty-desc">No hay equipos en esta categoría con ese filtro.</p>' +
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
            if (!hasCategorySelected()) {
                return loadCategoriesOnly();
            }
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
                    fillCategoriaSelects(state.cats);
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

        function loadCategoriesOnly() {
            listHost.setAttribute('aria-busy', 'true');
            return Almacen.ensureSeeded()
                .then(function () {
                    return Almacen.getCategorias();
                })
                .then(function (cats) {
                    state.cats = cats || [];
                    fillCategoriaSelects(state.cats);
                    renderPickCategory();
                })
                .catch(function (err) {
                    listHost.innerHTML =
                        '<div class="cr-admin-cats-empty cr-admin-cats-empty--error">' +
                        '<span class="cr-admin-cats-empty-icon" data-cr-icon="exclamation-triangle" aria-hidden="true"></span>' +
                        '<p class="cr-admin-cats-empty-title">No se pudieron cargar las categorías</p>' +
                        '<p class="cr-admin-cats-empty-desc">' +
                        esc((err && err.message) || 'Error al cargar') +
                        '</p></div>';
                    decorateIcons(listHost);
                    if (countEl) {
                        countEl.textContent = '—';
                    }
                })
                .finally(function () {
                    listHost.setAttribute('aria-busy', 'false');
                });
        }

        function onNuevoEquipoSubmit(e) {
            e.preventDefault();
            if (!formNuevo) {
                return;
            }
            var btn = formNuevo.querySelector('[type="submit"]');
            var payload = {
                name: inputNuevoNombre ? inputNuevoNombre.value : '',
                school: inputNuevoEscuela ? inputNuevoEscuela.value : '',
                grade: inputNuevoGrado ? inputNuevoGrado.value : '',
                teacher: inputNuevoTutor ? inputNuevoTutor.value : '',
                category_id: selNuevoCat ? selNuevoCat.value : ''
            };
            if (btn) {
                btn.disabled = true;
            }
            Almacen.addEquipo(payload)
                .then(function () {
                    showMsg('Equipo creado.');
                    formNuevo.reset();
                    w.CRApi.clearRegistroCache();
                    state.page = 1;
                    if (payload.category_id) {
                        state.filtroCat = String(payload.category_id);
                        if (selFiltroCat) {
                            selFiltroCat.value = state.filtroCat;
                        }
                        syncFiltroControls();
                    }
                    if (!hasCategorySelected()) {
                        return loadCategoriesOnly();
                    }
                    return loadPage({ force: true });
                })
                .catch(function (err) {
                    showMsg(err.message, true);
                })
                .finally(function () {
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        }

        function onFiltroSubmit(e) {
            e.preventDefault();
            state.filtroCat = selFiltroCat ? selFiltroCat.value : '';
            if (!hasCategorySelected()) {
                showMsg('Elige una categoría antes de buscar equipos.', true);
                state.filtroQ = '';
                syncFiltroControls();
                renderPickCategory();
                return;
            }
            state.filtroQ = inputBuscar ? String(inputBuscar.value || '').trim() : '';
            state.page = 1;
            loadPage({ force: true });
        }

        function onFiltroCatChange() {
            state.filtroCat = selFiltroCat ? selFiltroCat.value : '';
            state.filtroQ = '';
            state.page = 1;
            syncFiltroControls();
            if (!hasCategorySelected()) {
                renderPickCategory();
                showMsg('');
                return;
            }
            loadPage({ force: true });
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

            var btnSave = e.target.closest('.cr-admin-btn-save-equipo');
            if (btnSave) {
                var cardSave = btnSave.closest('.cr-admin-equipo-card');
                if (!cardSave) {
                    return;
                }
                var teamIdSave = cardSave.getAttribute('data-team-id');
                var sel = cardSave.querySelector('.cr-admin-equipo-cat');
                var catId = sel ? sel.value : '';
                btnSave.disabled = true;
                Almacen.setEquipoCategoria(teamIdSave, catId === '' ? null : catId)
                    .then(function () {
                        showMsg('Categoría guardada.');
                        w.CRApi.clearRegistroCache();
                        return loadPage({ force: true });
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    })
                    .finally(function () {
                        btnSave.disabled = false;
                    });
                return;
            }

            var btnAdd = e.target.closest('.cr-admin-btn-add-miembro');
            if (btnAdd) {
                var addBox = btnAdd.closest('.cr-admin-equipo-add-member');
                var cardAdd = btnAdd.closest('.cr-admin-equipo-card');
                if (!addBox || !cardAdd) {
                    return;
                }
                var teamIdAdd = cardAdd.getAttribute('data-team-id');
                var nombreIn = addBox.querySelector('.cr-admin-miembro-nombre');
                var emailIn = addBox.querySelector('.cr-admin-miembro-email');
                var liderIn = addBox.querySelector('.cr-admin-miembro-lider');
                btnAdd.disabled = true;
                Almacen.addMiembro(teamIdAdd, {
                    name: nombreIn ? nombreIn.value : '',
                    email: emailIn ? emailIn.value : '',
                    is_leader: liderIn ? liderIn.checked : false
                })
                    .then(function () {
                        showMsg('Miembro agregado.');
                        w.CRApi.clearRegistroCache();
                        return loadPage({ force: true });
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    })
                    .finally(function () {
                        btnAdd.disabled = false;
                    });
                return;
            }

            var btnDel = e.target.closest('.cr-admin-btn-del-miembro');
            if (btnDel) {
                var row = btnDel.closest('.cr-admin-equipo-member-row');
                var cardDel = btnDel.closest('.cr-admin-equipo-card');
                if (!row || !cardDel) {
                    return;
                }
                var teamIdDel = cardDel.getAttribute('data-team-id');
                var memberId = row.getAttribute('data-member-id');
                if (!window.confirm('¿Eliminar este miembro del equipo?')) {
                    return;
                }
                btnDel.disabled = true;
                Almacen.deleteMiembro(teamIdDel, memberId)
                    .then(function () {
                        showMsg('Miembro eliminado.');
                        w.CRApi.clearRegistroCache();
                        return loadPage({ force: true });
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    })
                    .finally(function () {
                        btnDel.disabled = false;
                    });
                return;
            }
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
        if (selFiltroCat) {
            selFiltroCat.addEventListener('change', onFiltroCatChange, false);
        }
        if (formNuevo) {
            formNuevo.addEventListener('submit', onNuevoEquipoSubmit, false);
        }

        loadCategoriesOnly();

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
            if (selFiltroCat) {
                selFiltroCat.removeEventListener('change', onFiltroCatChange, false);
            }
            if (formNuevo) {
                formNuevo.removeEventListener('submit', onNuevoEquipoSubmit, false);
            }
        };
    }

    w.CRAdminVistaEquipos = { init: initAdminEquipos };
})(window);
