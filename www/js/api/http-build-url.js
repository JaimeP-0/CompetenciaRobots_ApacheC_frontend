/**
 * URLs de la API (base + query).
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    if (!app) {
        throw new Error("CR_CONFIG no definido (config.js)");
    }

    function cacheTieneCategorias() {
        var Cat = w.CRApiCategorias;
        return Cat && typeof Cat.listaNombres === "function" && (Cat.listaNombres() || []).length > 0;
    }

    function isCategoria(c) {
        if (c == null || String(c).trim() === "") {
            return false;
        }
        if (cacheTieneCategorias()) {
            return w.CRApiCategorias.isKnown(c);
        }
        return true;
    }

    function assertCategoria(c) {
        if (!isCategoria(c)) {
            throw new Error("Categoría no válida: " + c);
        }
    }

    function buildUrl(path, query) {
        var base = (app.apiBase || '').replace(/\/$/, '');
        if (!base && w.location && w.location.origin) {
            base = String(w.location.origin).replace(/\/$/, '');
        }
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
