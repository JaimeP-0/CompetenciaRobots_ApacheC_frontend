/**
 * GET /categorias: caché y normalización.
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error("Carga api/http-build-url.js y config.js antes");
    }
    var buildUrl = Http.buildUrl;

    var categoriasCache = null;
    var categoriasById = {};
    var categoriasInflight = null;

    function parseCategoriasPayload(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        if (data && Array.isArray(data.value)) {
            return data.value;
        }
        return [];
    }

    function categoryLabelById(catId) {
        var id = Number(catId, 10);
        if (isNaN(id)) {
            return '';
        }
        var fromApi = categoriasById[id];
        if (fromApi && fromApi.name) {
            return String(fromApi.name);
        }
        var map = app.categoryNamesById || {};
        if (map[id] != null) {
            return String(map[id]);
        }
        if (map[String(id)] != null) {
            return String(map[String(id)]);
        }
        return 'Categoría ' + id;
    }

    function normalizeCatalogRules(rules) {
        if (!Array.isArray(rules)) {
            return [];
        }
        var out = [];
        rules.forEach(function (r) {
            if (r == null) {
                return;
            }
            if (typeof r === 'string') {
                var s = r.trim();
                if (s) {
                    out.push({ description: s });
                }
                return;
            }
            var desc = r.description != null ? r.description : r.text != null ? r.text : r.name;
            if (desc != null && String(desc).trim()) {
                var item = { description: String(desc).trim() };
                var rid = Number(r.id, 10);
                if (!isNaN(rid)) {
                    item.id = rid;
                }
                out.push(item);
            }
        });
        return out;
    }

    function normalizeCategory(raw) {
        var id = Number(raw.id, 10);
        return {
            id: isNaN(id) ? raw.id : id,
            name: raw.name != null ? String(raw.name).trim() : '',
            rules: normalizeCatalogRules(raw.rules)
        };
    }

    function indexCategorias(list) {
        categoriasById = {};
        (list || []).forEach(function (c) {
            var id = Number(c.id, 10);
            if (!isNaN(id)) {
                categoriasById[id] = c;
            }
        });
    }

    function fetchCategorias(force) {
        if (!force && categoriasCache) {
            return Promise.resolve(categoriasCache);
        }
        if (!force && categoriasInflight) {
            return categoriasInflight;
        }
        var url = buildUrl(app.categoriasPath || '/categorias', {});
        if (app.debugApi) {
            console.log('[CR] fetch', url);
        }
        categoriasInflight = fetch(url, { headers: { Accept: 'application/json' } })
            .then(function (res) {
                if (!res.ok) {
                    return res.text().then(function (t) {
                        throw new Error(res.status + ' ' + t);
                    });
                }
                return res.json();
            })
            .then(function (data) {
                var raw = parseCategoriasPayload(data);
                categoriasCache = raw
                    .map(normalizeCategory)
                    .filter(function (c) {
                        return c.name;
                    });
                if (w.CRAdminAlmacen && w.CRAdminAlmacen.isEnabled()) {
                    categoriasCache = w.CRAdminAlmacen.getCategoriasParaApp(categoriasCache);
                }
                indexCategorias(categoriasCache);
                return categoriasCache;
            })
            .catch(function (err) {
                if (app.debugApi) {
                    console.warn('[CR] fetchCategorias:', err);
                }
                categoriasCache = categoriasCache || [];
                return categoriasCache;
            })
            .finally(function () {
                categoriasInflight = null;
            });
        return categoriasInflight;
    }

    w.CRApiCategorias = {
        labelById: categoryLabelById,
        fetch: fetchCategorias,
        clearCache: function () {
            categoriasCache = null;
            categoriasById = {};
        }
    };
})(window);
