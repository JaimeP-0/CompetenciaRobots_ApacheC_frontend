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

    function normalizeCatalogRules(rules, fallbackCategoryId) {
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
                    var strItem = { description: s };
                    var fb = Number(fallbackCategoryId, 10);
                    if (!isNaN(fb)) {
                        strItem.category_id = fb;
                    }
                    out.push(strItem);
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
                var ruleType = String(r.type != null ? r.type : '')
                    .trim()
                    .toLowerCase();
                if (ruleType === 'characteristic' || ruleType === 'restriction') {
                    item.type = ruleType;
                }
                var cid = Number(r.category_id, 10);
                if (isNaN(cid) && fallbackCategoryId != null) {
                    cid = Number(fallbackCategoryId, 10);
                }
                if (!isNaN(cid)) {
                    item.category_id = cid;
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

    function fetchReglasForCategory(catId) {
        var path = (app.categoriasPath || '/categorias') + '/' + encodeURIComponent(String(catId)) + '/reglas';
        var url = buildUrl(path, {});
        return fetch(url, { headers: { Accept: 'application/json' } })
            .then(function (res) {
                if (!res.ok) {
                    return [];
                }
                return res.json();
            })
            .then(function (data) {
                return normalizeCatalogRules(parseCategoriasPayload(data), catId);
            })
            .catch(function () {
                return [];
            });
    }

    function attachRulesToCategories(list) {
        if (!list.length) {
            return Promise.resolve(list);
        }
        return Promise.all(
            list.map(function (c) {
                if (c.rules && c.rules.length) {
                    return c;
                }
                return fetchReglasForCategory(c.id).then(function (rules) {
                    return Object.assign({}, c, { rules: rules });
                });
            })
        );
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
                var base = raw
                    .map(normalizeCategory)
                    .filter(function (c) {
                        return c.name;
                    });
                return attachRulesToCategories(base);
            })
            .then(function (categoriasCacheResult) {
                categoriasCache = categoriasCacheResult;
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
        fetchRulesForCategory: fetchReglasForCategory,
        normalizeRules: normalizeCatalogRules,
        clearCache: function () {
            categoriasCache = null;
            categoriasById = {};
        }
    };
})(window);
