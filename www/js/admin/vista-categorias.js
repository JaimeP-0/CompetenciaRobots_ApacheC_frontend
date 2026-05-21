/**
 * Admin: CRUD categorías y reglas (#/admin/categorias).
 */
(function (w) {
    'use strict';

    var Almacen = w.CRAdminAlmacen;
    var Dom = w.CRDom;

    function esc(s) {
        return Dom && Dom.escapeHtml ? Dom.escapeHtml(s) : String(s == null ? '' : s);
    }

    function decorateIcons(el) {
        if (w.CRIcons && typeof w.CRIcons.decorate === 'function' && el) {
            w.CRIcons.decorate(el);
        }
    }

    function initAdminCategorias(outlet) {
        if (w.CRAdminNav) {
            w.CRAdminNav.mount(outlet, 'categorias');
        }
        decorateIcons(outlet);

        var listHost = outlet.querySelector('#admin-cat-list');
        var countEl = outlet.querySelector('#admin-cat-count');
        var form = outlet.querySelector('#f-admin-nueva-cat');
        var inputNombre = outlet.querySelector('#admin-nueva-cat-nombre');
        var msgEl = outlet.querySelector('#admin-cat-msg');
        if (!listHost || !Almacen) {
            return function () {};
        }

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

        function renderRules(cat) {
            var rules = cat.rules || [];
            if (!rules.length) {
                return (
                    '<p class="cr-admin-cats-empty-rules">Aún no hay reglas. Agrega la primera abajo.</p>'
                );
            }
            return (
                '<ol class="cr-admin-rule-list">' +
                rules
                    .map(function (r, idx) {
                        return (
                            '<li class="cr-admin-rule-row cr-admin-regla-item" data-cat-id="' +
                            esc(cat.id) +
                            '" data-regla-id="' +
                            esc(r.id) +
                            '">' +
                            '<span class="cr-admin-rule-num" aria-hidden="true">' +
                            (idx + 1) +
                            '</span>' +
                            '<input type="text" class="cr-admin-input cr-admin-regla-text" value="' +
                            esc(r.description) +
                            '" aria-label="Regla ' +
                            (idx + 1) +
                            '" />' +
                            '<div class="cr-admin-rule-actions">' +
                            '<button type="button" class="cr-admin-icon-btn cr-admin-btn-save-regla" title="Guardar regla">' +
                            '<span data-cr-icon="check" data-cr-icon-class="cr-icon--btn-only"></span>' +
                            '<span class="sr-only">Guardar</span></button>' +
                            '<button type="button" class="cr-admin-icon-btn cr-admin-icon-btn--danger cr-admin-btn-del-regla" title="Eliminar regla">' +
                            '<span data-cr-icon="trash" data-cr-icon-class="cr-icon--btn-only"></span>' +
                            '<span class="sr-only">Eliminar</span></button>' +
                            '</div></li>'
                        );
                    })
                    .join('') +
                '</ol>'
            );
        }

        function renderCard(cat) {
            var ruleCount = (cat.rules || []).length;
            return (
                '<article class="cr-admin-cat-card" data-cat-id="' +
                esc(cat.id) +
                '">' +
                '<div class="cr-admin-cat-card-inner">' +
                '<header class="cr-admin-cat-card-top">' +
                '<div class="cr-admin-cat-card-id" aria-label="Identificador">#' +
                esc(cat.id) +
                '</div>' +
                '<div class="cr-admin-cat-card-name-wrap">' +
                '<label class="cr-admin-label" for="cat-name-' +
                esc(cat.id) +
                '">Nombre</label>' +
                '<input id="cat-name-' +
                esc(cat.id) +
                '" type="text" class="cr-admin-input cr-admin-cat-name" value="' +
                esc(cat.name) +
                '" />' +
                '</div>' +
                '<div class="cr-admin-cat-card-toolbar">' +
                '<button type="button" class="cr-admin-icon-btn cr-admin-btn-save-cat" title="Guardar categoría">' +
                '<span data-cr-icon="check" data-cr-icon-class="cr-icon--btn-only"></span>' +
                '<span class="cr-admin-icon-btn-label">Guardar</span></button>' +
                '<button type="button" class="cr-admin-icon-btn cr-admin-icon-btn--danger cr-admin-btn-del-cat" title="Eliminar categoría">' +
                '<span data-cr-icon="trash" data-cr-icon-class="cr-icon--btn-only"></span>' +
                '<span class="cr-admin-icon-btn-label cr-admin-icon-btn-label--hide-sm">Eliminar</span></button>' +
                '</div></header>' +
                '<section class="cr-admin-cat-rules-panel" aria-labelledby="cat-rules-title-' +
                esc(cat.id) +
                '">' +
                '<h3 id="cat-rules-title-' +
                esc(cat.id) +
                '" class="cr-admin-cat-rules-title">' +
                '<span class="cr-admin-cat-rules-title-icon" data-cr-icon="document-text" aria-hidden="true"></span>' +
                'Reglamento' +
                '<span class="cr-admin-cat-rules-badge">' +
                ruleCount +
                ' ' +
                (ruleCount === 1 ? 'regla' : 'reglas') +
                '</span></h3>' +
                renderRules(cat) +
                '<form class="cr-admin-rule-add cr-admin-add-regla" data-cat-id="' +
                esc(cat.id) +
                '" action="#">' +
                '<input type="text" class="cr-admin-input" placeholder="Nueva regla del reglamento…" required aria-label="Texto de nueva regla" />' +
                '<button type="submit" class="cr-app-btn cr-app-btn--primary cr-admin-rule-add-btn">' +
                '<span data-cr-icon="plus" data-cr-icon-class="cr-icon--btn"></span>' +
                '<span>Regla</span></button></form></section></div></article>'
            );
        }

        function render() {
            listHost.setAttribute('aria-busy', 'true');
            Almacen.getCategorias()
                .then(function (cats) {
                    if (countEl) {
                        countEl.textContent =
                            cats.length === 0
                                ? '0'
                                : cats.length + (cats.length === 1 ? ' categoría' : ' categorías');
                    }
                    if (!cats.length) {
                        listHost.innerHTML =
                            '<div class="cr-admin-cats-empty">' +
                            '<span class="cr-admin-cats-empty-icon" data-cr-icon="squares-2x2" aria-hidden="true"></span>' +
                            '<p class="cr-admin-cats-empty-title">Sin categorías</p>' +
                            '<p class="cr-admin-cats-empty-desc">Usa el formulario de arriba para crear la primera.</p></div>';
                        decorateIcons(listHost);
                        return;
                    }
                    listHost.innerHTML = cats.map(renderCard).join('');
                    decorateIcons(listHost);
                })
                .catch(function (err) {
                    if (countEl) {
                        countEl.textContent = '—';
                    }
                    listHost.innerHTML =
                        '<div class="cr-admin-cats-empty cr-admin-cats-empty--error">' +
                        '<p class="cr-admin-cats-empty-title">No se pudo cargar</p>' +
                        '<p class="cr-admin-cats-empty-desc">' +
                        esc((err && err.message) || 'Error al cargar') +
                        '</p></div>';
                })
                .finally(function () {
                    listHost.setAttribute('aria-busy', 'false');
                });
        }

        function onListClick(e) {
            var saveCat = e.target.closest('.cr-admin-btn-save-cat');
            var delCat = e.target.closest('.cr-admin-btn-del-cat');
            var saveRegla = e.target.closest('.cr-admin-btn-save-regla');
            var delRegla = e.target.closest('.cr-admin-btn-del-regla');
            var card = e.target.closest('.cr-admin-cat-card');

            if (saveCat && card) {
                var nameIn = card.querySelector('.cr-admin-cat-name');
                Almacen.updateCategoria(card.getAttribute('data-cat-id'), nameIn.value)
                    .then(function () {
                        showMsg('Categoría actualizada.');
                        render();
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    });
                return;
            }
            if (delCat && card) {
                if (!w.confirm('¿Eliminar esta categoría y sus reglas? Los equipos quedarán sin esa categoría.')) {
                    return;
                }
                Almacen.deleteCategoria(card.getAttribute('data-cat-id'))
                    .then(function () {
                        showMsg('Categoría eliminada.');
                        render();
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    });
                return;
            }
            if (saveRegla) {
                var li = saveRegla.closest('.cr-admin-regla-item');
                if (!li) {
                    return;
                }
                var txt = li.querySelector('.cr-admin-regla-text');
                Almacen.updateRegla(li.getAttribute('data-cat-id'), li.getAttribute('data-regla-id'), txt.value)
                    .then(function () {
                        showMsg('Regla guardada.');
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    });
                return;
            }
            if (delRegla) {
                var liDel = delRegla.closest('.cr-admin-regla-item');
                if (!liDel || !w.confirm('¿Eliminar esta regla?')) {
                    return;
                }
                Almacen.deleteRegla(liDel.getAttribute('data-cat-id'), liDel.getAttribute('data-regla-id'))
                    .then(function () {
                        showMsg('Regla eliminada.');
                        render();
                    })
                    .catch(function (err) {
                        showMsg(err.message, true);
                    });
            }
        }

        function onListSubmit(e) {
            var reglaForm = e.target.closest('.cr-admin-add-regla');
            if (!reglaForm) {
                return;
            }
            e.preventDefault();
            var input = reglaForm.querySelector('input[type="text"]');
            Almacen.addRegla(reglaForm.getAttribute('data-cat-id'), input.value)
                .then(function () {
                    showMsg('Regla agregada.');
                    render();
                })
                .catch(function (err) {
                    showMsg(err.message, true);
                });
        }

        function onNuevaCat(e) {
            e.preventDefault();
            Almacen.addCategoria(inputNombre.value)
                .then(function () {
                    inputNombre.value = '';
                    showMsg('Categoría creada.');
                    render();
                })
                .catch(function (err) {
                    showMsg(err.message, true);
                });
        }

        listHost.addEventListener('click', onListClick, false);
        listHost.addEventListener('submit', onListSubmit, false);
        if (form) {
            form.addEventListener('submit', onNuevaCat, false);
        }

        Almacen.ensureSeeded().then(render);

        return function cleanup() {
            listHost.removeEventListener('click', onListClick, false);
            listHost.removeEventListener('submit', onListSubmit, false);
            if (form) {
                form.removeEventListener('submit', onNuevaCat, false);
            }
        };
    }

    w.CRAdminVistaCategorias = { init: initAdminCategorias };
})(window);
