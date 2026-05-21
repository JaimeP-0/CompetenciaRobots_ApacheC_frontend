/**
 * URLs de la API (base + query).
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    if (!app || typeof app.listaCategorias !== "function") {
        throw new Error("CR_CONFIG no definido (config.js)");
    }

    function isCategoria(c) {
        return app.listaCategorias().indexOf(c) !== -1;
    }

    function assertCategoria(c) {
        if (!isCategoria(c)) {
            throw new Error('Categoría no válida: ' + c);
        }
    }

    function buildUrl(path, query) {
        var base = (app.apiBase || '').replace(/\/$/, '');
        var qs = '';
        if (query && Object.keys(query).length) {
            var p = new URLSearchParams();
            Object.keys(query).forEach(function (k) {
                var v = query[k];
                if (v !== undefined && v !== null && v !== '') {
                    p.set(k, String(v));
                }
            });
            qs = p.toString();
        }
        return base + path + (qs ? '?' + qs : '');
    }

    w.CRApiHttp = { buildUrl: buildUrl, isCategoria: isCategoria, assertCategoria: assertCategoria };
})(window);
