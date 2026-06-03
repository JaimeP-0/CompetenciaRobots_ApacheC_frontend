/**
 * Admin: categorías y reglas (#/admin/categorias) — crear y consultar; sin editar ni eliminar.
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

        function renderReglaTypeSelect(value, className, idAttr) {
            var current = String(value || 'restriction').toLowerCase();
            if (current !== 'characteristic') {
                current = 'restriction';
            }
            return (
                '<select class="cr-admin-select cr-admin-regla-type ' +
                esc(className || '') +
                '"' +
                (idAttr ? ' id="' + esc(idAttr) + '"' : '') +
                ' aria-label="Tipo de regla">' +
                '<option value="characteristic"' +
                (current === 'characteristic' ? ' selected' : '') +
                '>Característica</option>' +
                '<option value="restriction"' +
                (current === 'restriction' ? ' selected' : '') +
                '>Restricción</option>' +
                '</select>'
            );
        }

        function renderRules(cat) {
            var rules = cat.rules || [];
            if (!rules.length) {
                return (
                    '<p class="cr-admin-cats-empty-rules">Aún no hay reglas. Agrega la primera abajo.</p>'
                );
            }
            function reglaTypeLabel(type) {
                return String(type || '').toLowerCase() === 'characteristic'
                    ? 'Característica'
                    : 'Restricción';
            }
            return (
                '<ol class="cr-admin-rule-list">' +
                rules
                    .map(function (r, idx) {
                        return (
                            '<li class="cr-admin-rule-row cr-admin-regla-item cr-admin-regla-item--readonly">' +
                            '<span class="cr-admin-rule-num" aria-hidden="true">' +
                            (idx + 1) +
                            '</span>' +
                            '<span class="cr-admin-regla-type-badge">' +
                            esc(reglaTypeLabel(r.type)) +
                            '</span>' +
                            '<span class="cr-admin-regla-text-readonly">' +
                            esc(r.description) +
                            '</span></li>'
                        );
                    })
                    .join('') +
                '</ol>'
            );
        }

        function renderCard(cat) {
            var ruleCount = (cat.rules || []).length;
            var ruleLabel = ruleCount + ' ' + (ruleCount === 1 ? 'regla' : 'reglas');
            return (
                '<article class="cr-admin-cat-card" data-cat-id="' +
                esc(cat.id) +
                '">' +
                '<details class="cr-admin-cat-details">' +
                '<summary class="cr-admin-cat-summary">' +
                '<span class="cr-admin-cat-summary-id" aria-label="Identificador">#' +
                esc(cat.id) +
                '</span>' +
                '<span class="cr-admin-cat-summary-name">' +
                esc(cat.name) +
                '</span>' +
                '<span class="cr-admin-cat-summary-badge">' +
                ruleLabel +
                '</span>' +
                '<span class="cr-admin-cat-summary-chevron" aria-hidden="true">▼</span>' +
                '</summary>' +
                '<div class="cr-admin-cat-card-inner">' +
                '<section class="cr-admin-cat-rules-panel" aria-labelledby="cat-rules-title-' +
                esc(cat.id) +
                '">' +
                '<h3 id="cat-rules-title-' +
                esc(cat.id) +
                '" class="cr-admin-cat-rules-title">' +
                '<span class="cr-admin-cat-rules-title-icon" data-cr-icon="document-text" aria-hidden="true"></span>' +
                'Reglamento' +
                '<span class="cr-admin-cat-rules-badge">' +
                ruleLabel +
                '</span></h3>' +
                renderRules(cat) +
                '<form class="cr-admin-rule-add cr-admin-add-regla" data-cat-id="' +
                esc(cat.id) +
                '" action="#">' +
                renderReglaTypeSelect('restriction', 'cr-admin-regla-type-new') +
                '<input type="text" class="cr-admin-input cr-admin-regla-text" placeholder="Nueva regla del reglamento…" required aria-label="Texto de nueva regla" />' +
                '<button type="submit" class="cr-admin-btn cr-admin-btn--primary cr-admin-rule-add-btn">' +
                '<span data-cr-icon="plus" data-cr-icon-class="cr-icon--btn"></span>' +
                '<span>Regla</span></button></form></section></div></details></article>'
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
                            '<p class="cr-admin-cats-empty-desc">Abre «Agregar categoría» para crear la primera.</p></div>';
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

        function onListSubmit(e) {
            var reglaForm = e.target.closest('.cr-admin-add-regla');
            if (!reglaForm) {
                return;
            }
            e.preventDefault();
            var input = reglaForm.querySelector('input[type="text"]');
            var typeSel = reglaForm.querySelector('.cr-admin-regla-type-new');
            Almacen.addRegla(
                reglaForm.getAttribute('data-cat-id'),
                input.value,
                typeSel ? typeSel.value : 'restriction'
            )
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

        listHost.addEventListener('submit', onListSubmit, false);
        if (form) {
            form.addEventListener('submit', onNuevaCat, false);
        }

        Almacen.ensureSeeded().then(render);

        return function cleanup() {
            listHost.removeEventListener('submit', onListSubmit, false);
            if (form) {
                form.removeEventListener('submit', onNuevaCat, false);
            }
        };
    }

    w.CRAdminVistaCategorias = { init: initAdminCategorias };
})(window);
