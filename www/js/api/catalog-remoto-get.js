/**
 * Catálogo en modo remoto (mapea /cr-catalog/* al listado de equipos).
 */
(function (w) {
    'use strict';

    var Cats = w.CRApiCategorias;
    var Equipos = w.CRApiEquiposRegistro;
    if (!Cats || !Equipos) throw new Error("Carga api/categorias y equipos-registro antes");
    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error("Carga api/http-build-url.js y config.js antes");
    }
    var buildUrl = Http.buildUrl;

    /** GET /registro y rutas /cr-catalog/* sobre el listado remoto. */
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
            var cid = Number(mCat[1], 10);
            return Cats.fetch().then(function (list) {
                var cat = list.find(function (c) {
                    return Number(c.id, 10) === cid;
                });
                if (!cat) {
                    return { category: null, rules: [] };
                }
                return {
                    category: { id: cat.id, name: cat.name },
                    rules: cat.rules || []
                };
            });
        }
        if (path === '/cr-catalog/teams') {
            var filterCat =
                query && query.categoryId != null && query.categoryId !== ''
                    ? Number(query.categoryId, 10)
                    : null;
            return Equipos.fetchTeams().then(function (teams) {
                var items = teams.filter(function (t) {
                    if (filterCat == null || isNaN(filterCat)) {
                        return true;
                    }
                    return Number(t.category_id, 10) === filterCat;
                });
                return {
                    items: items,
                    categoryName:
                        filterCat != null && !isNaN(filterCat) ? Cats.labelById(filterCat) : ''
                };
            });
        }
        var mTeam = path.match(/^\/cr-catalog\/teams\/(\d+)$/);
        if (mTeam) {
            var tid = Number(mTeam[1], 10);
            return Equipos.fetchTeams().then(function (teams) {
                var team = teams.find(function (x) {
                    return Number(x.id, 10) === tid;
                });
                if (!team) {
                    return { team: null, members: [] };
                }
                return { team: team, members: team.members || [] };
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
