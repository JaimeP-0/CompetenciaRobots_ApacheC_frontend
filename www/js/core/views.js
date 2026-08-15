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

    function viewCacheBust() {
        var cfg = w.CR_CONFIG || w.CR_APP || {};
        var ov = w.CR_API_OVERRIDES || {};
        var token = ov.viewCacheBust || cfg.viewCacheBust || '';
        return token ? String(token) : '';
    }

    function fetchView(name) {
        var path = String(name || '').replace(/^\//, '').replace(/\\/g, '/');
        var url = viewsBase() + path + '.html';
        var bust = viewCacheBust();
        if (bust) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(bust);
        }
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) {
                throw new Error('No se pudo cargar la vista: ' + path);
            }
            return res.text();
        });
    }

    function showError(outlet, err) {
        if (!outlet) {
            return;
        }
        document.documentElement.classList.remove('cr-registro-fit', 'cr-registro-checking', 'cr-tablero-ultra-only', 'cr-view-dashboard', 'cr-view-diag');
        document.body.classList.remove('cr-view-dashboard', 'cr-view-diag');
        outlet.removeAttribute('data-cr-outlet-mode');
        outlet.innerHTML =
            '<p class="p-4 text-center text-red-700">' + (err.message || String(err)) + '</p>';
    }

    w.CRViews = {
        viewsBase: viewsBase,
        load: fetchView,
        showError: showError
    };
})(window);
