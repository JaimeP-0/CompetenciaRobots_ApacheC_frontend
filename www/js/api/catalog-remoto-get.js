/**
 * Catálogo en modo remoto (GET /categorias, /categorias/{id}/equipos|reglas, /equipos/{id}/miembros|robots).
 */
(function (w) {
    'use strict';

    var Cats = w.CRApiCategorias;
    var Equipos = w.CRApiEquiposRegistro;
    if (!Cats || !Equipos) throw new Error('Carga api/categorias y equipos-registro antes');
    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error('Carga api/http-build-url.js y config.js antes');
    }
    var buildUrl = Http.buildUrl;

    function apiGet(path, query) {
        var url = buildUrl(path, query || {});
        return fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }).then(function (res) {
            if (res.status === 304) {
                return res.text().then(function (t) {
                    var s = String(t || '').trim();
                    if (!s) {
                        return null;
                    }
                    try {
                        return JSON.parse(s);
                    } catch (parseErr304) {
                        return null;
                    }
                });
            }
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(res.status + ' ' + t);
                });
            }
            if (res.status === 204) {
                return null;
            }
            return res.text().then(function (t) {
                var s = String(t || '').trim();
                if (!s) {
                    return null;
                }
                return JSON.parse(s);
            });
        });
    }

    function parseList(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        return [];
    }

    function catsPath() {
        return app.categoriasPath || '/categorias';
    }

    function handleRegistroRemoteApi(method, path, query) {
        if (method !== 'GET') {
            return null;
        }
        if (path === '/cr-catalog/categories') {
            return Cats.fetch().then(function (list) {
                return {
                    items: list.map(function (c) {
                        return { id: c.id, name: c.name };
                    })
                };
            });
        }
        var mCat = path.match(/^\/cr-catalog\/categories\/(\d+)$/);
        if (mCat) {
            var cid = mCat[1];
            return apiGet(catsPath() + '/' + encodeURIComponent(cid) + '/reglas')
                .then(function (rulesData) {
                    return Cats.fetch().then(function (list) {
                        var cat = list.find(function (c) {
                            return String(c.id) === String(cid);
                        });
                        if (!cat) {
                            return { category: null, rules: [] };
                        }
                        var rules = parseList(rulesData);
                        if (!rules.length && cat.rules) {
                            rules = cat.rules;
                        }
                        if (Cats && typeof Cats.normalizeRules === 'function') {
                            rules = Cats.normalizeRules(rules, cid);
                        }
                        return {
                            category: { id: cat.id, name: cat.name },
                            rules: rules
                        };
                    });
                })
                .catch(function () {
                    return Cats.fetch().then(function (list) {
                        var cat = list.find(function (c) {
                            return String(c.id) === String(cid);
                        });
                        if (!cat) {
                            return { category: null, rules: [] };
                        }
                        return {
                            category: { id: cat.id, name: cat.name },
                            rules: cat.rules || []
                        };
                    });
                });
        }
        if (path === '/cr-catalog/teams') {
            var filterCat =
                query && query.categoryId != null && query.categoryId !== ''
                    ? String(query.categoryId)
                    : null;
            if (filterCat) {
                return Equipos.fetchTeamsByCategoryEnriched(filterCat).then(function (items) {
                    return {
                        items: items,
                        categoryName: Cats.labelById(filterCat)
                    };
                });
            }
            return Promise.resolve({ items: [], categoryName: '' });
        }
        var mTeam = path.match(/^\/cr-catalog\/teams\/(\d+)$/);
        if (mTeam) {
            var tid = mTeam[1];
            return Equipos.fetchTeams()
                .then(function (teams) {
                    var team = teams.find(function (x) {
                        return String(x.id) === String(tid);
                    });
                    if (!team) {
                        return { team: null, members: [] };
                    }
                    return Equipos.fetchMembersForTeam(tid).then(function (members) {
                        return { team: team, members: members.length ? members : team.members || [] };
                    });
                })
                .catch(function () {
                    return { team: null, members: [] };
                });
        }
        if (path === '/cr-catalog/teams/search') {
            return Equipos.fetchTeams().then(function (teams) {
                return { items: Equipos.filterByQuery(teams, query && query.q) };
            });
        }
        return null;
    }

    w.CRApiCatalogRemoto = { handleGet: handleRegistroRemoteApi };
})(window);
