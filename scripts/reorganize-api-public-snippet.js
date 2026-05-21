    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    var Req = w.CRApiRequest;
    var Equipos = w.CRApiEquiposRegistro;
    var Cats = w.CRApiCategorias;
    if (!app || !Http || !Req || !Equipos || !Cats) {
        throw new Error('Carga todos los scripts en api/ antes de public.js');
    }
    var request = Req.request;
    var buildUrl = Http.buildUrl;

    w.CRApi = {
        buildUrl: buildUrl,

        postLogin: function (body) {
            return request('POST', '/login', { body: body });
        },
        postRegistro: function (body) {
            if (!app.registroEnvioHabilitado) {
                if (app.debugApi) {
                    console.log('[CR] verificación (solo local, sin POST):', body);
                }
                return Promise.resolve({ ok: true, local: true });
            }
            return request('POST', app.registroEnvioPath || '/registro/validar', { body: body });
        },
        getPerfil: function (id) {
            return request('GET', '/perfil', { query: { id: id } });
        },

        getRegistros: function (categoria) {
            return request('GET', '/registros/' + encodeURIComponent(categoria), {});
        },
        postRegistros: function (categoria, body) {
            return request('POST', '/registros/' + encodeURIComponent(categoria), { body: body });
        },
        putRegistros: function (categoria, id, body) {
            return request('PUT', '/registros/' + encodeURIComponent(categoria), { query: { id: id }, body: body });
        },
        getRegistrosExportar: function (categoria) {
            return request('GET', '/registros/' + encodeURIComponent(categoria) + '/exportar', {});
        },

        getCompetencias: function (categoria) {
            return request('GET', '/competencias/' + encodeURIComponent(categoria), {});
        },
        postCompetencias: function (categoria, body) {
            return request('POST', '/competencias/' + encodeURIComponent(categoria), { body: body });
        },
        putCompetencias: function (categoria, id, body) {
            return request('PUT', '/competencias/' + encodeURIComponent(categoria), { query: { id: id }, body: body });
        },

        getEmparejamientos: function (categoria) {
            return request('GET', '/emparejamientos/' + encodeURIComponent(categoria), {});
        },
        postEmparejamientos: function (categoria, body) {
            return request('POST', '/emparejamientos/' + encodeURIComponent(categoria), { body: body });
        },
        putEmparejamientos: function (categoria, id, body) {
            return request('PUT', '/emparejamientos/' + encodeURIComponent(categoria), { query: { id: id }, body: body });
        },

        getEncuentros: function (query) {
            return request('GET', '/encuentros', { query: query || {} });
        },
        postEncuentros: function (body) {
            return request('POST', '/encuentros', { body: body });
        },
        putEncuentros: function (id, body) {
            return request('PUT', '/encuentros', { query: { id: id }, body: body });
        },
        getEncuentrosReglas: function (id, rango) {
            return request('GET', '/encuentros/reglas', { query: { id: id, rango: rango } });
        },

        getEncuentrosObservaciones: function (id) {
            return request('GET', '/encuentros/observaciones', { query: { id: id } });
        },
        postEncuentrosObservaciones: function (id, body) {
            return request('POST', '/encuentros/observaciones', { query: { id: id }, body: body });
        },
        putEncuentrosObservaciones: function (id, body) {
            return request('PUT', '/encuentros/observaciones', { query: { id: id }, body: body });
        },

        getResultados: function (query) {
            return request('GET', '/resultados', { query: query || {} });
        },
        postResultados: function (body) {
            return request('POST', '/resultados', { body: body });
        },
        putResultados: function (id, body) {
            return request('PUT', '/resultados', { query: { id: id }, body: body });
        },

        getCatalogCategories: function () {
            return request('GET', '/cr-catalog/categories', {});
        },
        getCatalogCategory: function (id) {
            return request('GET', '/cr-catalog/categories/' + encodeURIComponent(id), {});
        },
        getCatalogTeams: function (query) {
            return request('GET', '/cr-catalog/teams', { query: query || {} });
        },
        getCatalogTeam: function (id) {
            return request('GET', '/cr-catalog/teams/' + encodeURIComponent(id), {});
        },
        getCatalogSearchTeams: function (q) {
            return request('GET', '/cr-catalog/teams/search', { query: { q: q } });
        },

        fetchRegistroTeams: function (force) {
            return Equipos.fetchTeams(!!force);
        },
        clearRegistroCache: function () {
            Equipos.clearCache();
        },
        fetchCategorias: function (force) {
            return Cats.fetch(!!force);
        },
        clearCategoriasCache: function () {
            Cats.clearCache();
        },
        getRegistroSugerencias: function (q) {
            return Equipos.sugerencias(q);
        },
        getRegistroDetallePorNombre: function (nombre) {
            return Equipos.findByName(nombre).then(Equipos.toDetallePanel);
        }
    };
