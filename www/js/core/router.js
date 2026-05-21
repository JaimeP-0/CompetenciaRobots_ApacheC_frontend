/**
 * Resolución de hash #/... usando definiciones en routes.js
 */
(function (w) {
    'use strict';

    var routes = w.CR_ROUTES;
    if (!routes) {
        throw new Error('Falta routes.js (window.CR_ROUTES).');
    }

    function normalizeHashRoute(hash) {
        var raw = String(hash || '').replace(/^#/, '').trim();
        if (!raw) {
            return '/';
        }
        if (raw.charAt(0) !== '/') {
            raw = '/' + raw;
        }
        return raw;
    }

    function getRedirect(route) {
        var map = routes.redirects || {};
        return map[route] != null ? map[route] : null;
    }

    function resolveRoute(route) {
        var path = normalizeHashRoute(route);
        var i;
        var patterns = routes.patterns || [];
        var m;

        for (i = 0; i < patterns.length; i++) {
            m = path.match(patterns[i].re);
            if (m) {
                return {
                    view: patterns[i].view,
                    params: typeof patterns[i].params === 'function' ? patterns[i].params(m) : {}
                };
            }
        }

        var staticMap = routes.static || {};
        if (staticMap[path]) {
            return { view: staticMap[path], params: {} };
        }

        return null;
    }

    function bootstrapCatalog(viewName, params, outlet) {
        if (!viewName || !w.CRCatalog || !outlet) {
            return;
        }
        if (viewName.indexOf('admin/') === 0 || viewName.indexOf('registro/') === 0) {
            return;
        }
        var initMap = routes.catalogInit || {};
        var method = initMap[viewName];
        if (method && typeof w.CRCatalog[method] === 'function') {
            w.CRCatalog[method](outlet, params || {});
        }
    }

    w.CRRouter = {
        normalize: normalizeHashRoute,
        getRedirect: getRedirect,
        resolve: resolveRoute,
        bootstrapCatalog: bootstrapCatalog
    };
})(window);
