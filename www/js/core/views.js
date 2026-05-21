/**
 * Carga de fragmentos HTML (www/views/).
 * name = ruta con carpetas, ej. "public/inicio", "admin/equipos" → views/admin/equipos.html
 */
(function (w) {
    'use strict';

    function viewsBase() {
        var cfg = w.CR_CONFIG || w.CR_APP || {};
        var bp = cfg.basePath ? String(cfg.basePath).replace(/\/$/, '') : '';
        return (bp ? bp + '/' : '') + 'views/';
    }

    function fetchView(name) {
        var path = String(name || '').replace(/^\//, '').replace(/\\/g, '/');
        return fetch(viewsBase() + path + '.html', { cache: 'no-cache' }).then(function (res) {
            if (!res.ok) {
                throw new Error('No se pudo cargar la vista: ' + path);
            }
            return res.text();
        });
    }

    function fetchChecklistFragment(slugCategoria, tablaNum) {
        var slug = String(slugCategoria || '').trim();
        var n = Number(tablaNum) || 1;
        return fetch(viewsBase() + 'checklists/' + slug + '-tabla-' + n + '.html', { cache: 'no-cache' }).then(
            function (res) {
                if (!res.ok) {
                    throw new Error('No se pudo cargar el checklist');
                }
                return res.text();
            }
        );
    }

    function showError(outlet, err) {
        if (!outlet) {
            return;
        }
        document.documentElement.classList.remove('cr-registro-fit', 'cr-tablero-ultra-only');
        outlet.removeAttribute('data-cr-outlet-mode');
        outlet.innerHTML =
            '<p class="p-4 text-center text-red-700">' + (err.message || String(err)) + '</p>';
    }

    w.CRViews = {
        viewsBase: viewsBase,
        load: fetchView,
        fetchChecklistFragment: fetchChecklistFragment,
        showError: showError
    };
})(window);
