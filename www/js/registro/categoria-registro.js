/**
 * Selector de categoría en #/registro (obligatorio antes de buscar equipos).
 */
(function (w) {
    'use strict';

    var Equipos = w.CRRegistroEquipos;

    function sectionRoot(root) {
        return Equipos && Equipos.sectionRoot ? Equipos.sectionRoot(root) : root;
    }

    function setEquipoBlockEnabled(root, on) {
        var sec = sectionRoot(root);
        var block = sec.querySelector('#reg-equipo-block');
        var input = sec.querySelector('#nombre-equipo');
        if (block) {
            block.classList.toggle('reg-equipo-block--disabled', !on);
            block.setAttribute('aria-disabled', on ? 'false' : 'true');
        }
        if (input) {
            input.disabled = !on;
            input.setAttribute('aria-disabled', on ? 'false' : 'true');
            if (!on) {
                input.value = '';
            }
        }
    }

    function onCategoriaChange(root, hooks) {
        hooks = hooks || {};
        var sec = sectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (!sel) {
            return;
        }
        var catId = sel.value;
        if (!catId) {
            setEquipoBlockEnabled(root, false);
            if (Equipos && typeof Equipos.limpiarDetalle === 'function') {
                Equipos.limpiarDetalle(root);
            }
            if (w.CRApi && typeof w.CRApi.clearRegistroCache === 'function') {
                w.CRApi.clearRegistroCache();
            }
            if (typeof hooks.onCategoriaChange === 'function') {
                hooks.onCategoriaChange(null);
            }
            return;
        }
        setEquipoBlockEnabled(root, true);
        if (Equipos && typeof Equipos.limpiarDetalle === 'function') {
            Equipos.limpiarDetalle(root);
        }
        if (w.CRApi && typeof w.CRApi.clearRegistroCache === 'function') {
            w.CRApi.clearRegistroCache();
        }
        var prefetch =
            w.CRApi && typeof w.CRApi.fetchRegistroTeamsPendientes === 'function'
                ? w.CRApi.fetchRegistroTeamsPendientes(true, catId).catch(function () {
                      return [];
                  })
                : Promise.resolve([]);
        prefetch.then(function () {
            if (typeof hooks.onCategoriaChange === 'function') {
                hooks.onCategoriaChange(Number(catId, 10));
            }
        });
    }

    function staffRole(ses) {
        if (w.CRQueueRoutes && typeof w.CRQueueRoutes.staffRole === 'function') {
            return w.CRQueueRoutes.staffRole(ses);
        }
        return String((ses && ses.role) || '').toLowerCase();
    }

    function resolveStaffCategoryValue(ses, sel) {
        if (!ses || !sel) {
            return '';
        }
        var catId =
            w.CRStaffSesion && typeof w.CRStaffSesion.primaryCategoryId === 'function'
                ? w.CRStaffSesion.primaryCategoryId(ses)
                : '';
        if (catId && sel.querySelector('option[value="' + String(catId).replace(/"/g, '\\"') + '"]')) {
            return String(catId);
        }
        var catName = String(ses.category || '').trim();
        if (!catName) {
            return catId ? String(catId) : '';
        }
        var i;
        var norm = catName.toLowerCase();
        for (i = 0; i < sel.options.length; i++) {
            var opt = sel.options[i];
            if (opt.value && String(opt.textContent || '').trim().toLowerCase() === norm) {
                return opt.value;
            }
        }
        return catId ? String(catId) : '';
    }

    function syncEquipoBlockFromSelect(root, hooks) {
        var sec = sectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (sel && sel.value) {
            onCategoriaChange(root, hooks || {});
        } else {
            setEquipoBlockEnabled(root, false);
        }
    }

    function fillSelect(root, cats, hooks) {
        var sec = sectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (!sel) {
            return;
        }
        var prev = sel.value;
        var html = '<option value="">— Elige categoría —</option>';
        (cats || []).forEach(function (c) {
            if (c && c.id != null && c.name) {
                html +=
                    '<option value="' +
                    String(c.id).replace(/"/g, '&quot;') +
                    '">' +
                    String(c.name)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;') +
                    '</option>';
            }
        });
        sel.innerHTML = html;
        if (prev && sel.querySelector('option[value="' + prev.replace(/"/g, '\\"') + '"]')) {
            sel.value = prev;
        }
        applyStaffCategoryLock(root, hooks);
        syncEquipoBlockFromSelect(root, hooks);
    }

    function applyStaffCategoryLock(root, hooks) {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (!ses) {
            return;
        }
        if (staffRole(ses) !== 'arbitro') {
            return;
        }
        var sec = sectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (!sel) {
            return;
        }
        var catValue = resolveStaffCategoryValue(ses, sel);
        if (!catValue) {
            return;
        }
        sel.value = catValue;
        sel.disabled = true;
        onCategoriaChange(root, hooks || {});
    }

    function initCategoriaRegistro(root, opts) {
        opts = opts || {};
        var sec = sectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (!sel) {
            return function () {};
        }
        setEquipoBlockEnabled(root, false);

        function onChange() {
            onCategoriaChange(root, opts);
        }

        if (opts.categorias && opts.categorias.length) {
            fillSelect(root, opts.categorias, opts);
        } else if (w.CRApi && typeof w.CRApi.fetchCategorias === 'function') {
            w.CRApi.fetchCategorias()
                .then(function (cats) {
                    fillSelect(root, cats, opts);
                })
                .catch(function () {
                    fillSelect(root, [], opts);
                });
        }

        sel.addEventListener('change', onChange, false);

        return function cleanup() {
            sel.removeEventListener('change', onChange, false);
        };
    }

    w.CRRegistroCategoria = {
        init: initCategoriaRegistro,
        fillSelect: fillSelect,
        setEquipoBlockEnabled: setEquipoBlockEnabled
    };
})(window);
