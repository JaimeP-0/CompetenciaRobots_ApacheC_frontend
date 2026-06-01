/**
 * Fachada pública: window.CRApi (login, registro, catálogo, encuentros).
 */
(function (w) {
    'use strict';

var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    var Req = w.CRApiRequest;
    var Equipos = w.CRApiEquiposRegistro;
    var Cats = w.CRApiCategorias;
    var Partidas = w.CRApiPartidas;
    if (!app || !Http || !Req || !Equipos || !Cats || !Partidas) {
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
                return Promise.reject(
                    new Error('El envío de verificación está deshabilitado en la configuración.')
                );
            }
            var teamId = body && (body.team_id != null ? body.team_id : body.teamId);
            if (teamId == null || teamId === '') {
                return Promise.reject(new Error('team_id requerido para verificar.'));
            }
            var validRules = body && body.valid_rules;
            if (!Array.isArray(validRules)) {
                return Promise.reject(new Error('valid_rules debe ser un arreglo de ids de regla.'));
            }
            var ruleIds = validRules
                .map(function (r) {
                    return Number(r, 10);
                })
                .filter(function (n) {
                    return !isNaN(n) && n > 0;
                });
            return request('POST', app.robotsPath || '/robots', {
                body: {
                    team_id: Number(teamId, 10),
                    valid_rules: ruleIds
                }
            });
        },
        postVerificarRobot: function (teamId, validRules) {
            return w.CRApi.postRegistro({
                team_id: teamId,
                valid_rules: validRules || []
            });
        },
        getReglasByCategory: function (categoryId) {
            return Equipos.fetchReglasByCategory(categoryId);
        },
        getRobotsByTeam: function (teamId) {
            return Equipos.fetchRobotsForTeam(teamId);
        },
        getRobots: function () {
            return Equipos.fetchRobots();
        },
        getRobot: function (robotId) {
            return Equipos.fetchRobotById(robotId);
        },
        /** Robots con is_valid (GET /robots). */
        getRobotsValidados: function () {
            return Equipos.fetchRobots().then(function (list) {
                return (list || []).filter(function (r) {
                    return r && (r.is_valid === true || r.is_valid === 1);
                });
            });
        },
        getEquiposByCategory: function (categoryId) {
            return Equipos.fetchTeamsByCategoryEnriched(categoryId);
        },
        inferMatchMode: function (categoryName) {
            return Partidas.inferMatchModeFromCategoryName(categoryName);
        },
        isLineFollowerCategory: function (categoryName) {
            return Partidas.isLineFollowerCategoryName(categoryName);
        },
        isVelocistaCategory: function (categoryName) {
            return Partidas.isVelocistaCategoryName(categoryName);
        },
        isSumoCategory: function (categoryName) {
            return Partidas.isSumoCategoryName(categoryName);
        },
        isSoloRaceCategory: function (categoryName) {
            return Partidas.isSoloRaceCategoryName(categoryName);
        },
        isPartidaResultComplete: function (resultado, categoryName) {
            return Partidas.isResultComplete(resultado, categoryName);
        },
        resultTimeSeconds: function (resultado) {
            return Partidas.resultTimeSeconds(resultado);
        },
        formatResultTime: function (time) {
            return Partidas.formatResultTimeDisplay(time);
        },
        getPartidas: function () {
            return Partidas.fetchAll();
        },
        getPartida: function (matchId) {
            return Partidas.fetchById(matchId);
        },
        postPartida: function (body) {
            return Partidas.create(body);
        },
        postPartidasIniciar: function (categoryId, opts) {
            opts = opts || {};
            if (!opts.categoryName && opts.catName) {
                opts.categoryName = opts.catName;
            }
            return Partidas.postIniciar(categoryId, opts);
        },
        getPartidaResultados: function () {
            return Partidas.fetchAllResultados();
        },
        getPartidaResultado: function (matchId) {
            return Partidas.fetchResultadoByMatchId(matchId);
        },
        postPartidaResultado: function (matchId, body) {
            return Partidas.createResultado(matchId, body || {});
        },
        getBracket: function (categoryId, opts) {
            if (!w.CRApiBrackets) {
                return Promise.reject(new Error('Brackets no cargado.'));
            }
            return w.CRApiBrackets.fetch(categoryId, opts || {});
        },
        getBracketPair: function (categoryId) {
            if (!w.CRApiBrackets) {
                return Promise.reject(new Error('Brackets no cargado.'));
            }
            return w.CRApiBrackets.fetchPair(categoryId);
        },
        postBracketIniciar: function (categoryId, opts) {
            if (!w.CRApiBrackets) {
                return Promise.reject(new Error('Brackets no cargado.'));
            }
            return w.CRApiBrackets.iniciar(categoryId, opts || {});
        },
        postBracketWinner: function (categoryId, bracket, matchKey, winnerTeamId) {
            if (!w.CRApiBrackets) {
                return Promise.reject(new Error('Brackets no cargado.'));
            }
            return w.CRApiBrackets.recordWinner(categoryId, bracket, matchKey, winnerTeamId);
        },
        resetBracket: function (categoryId) {
            if (!w.CRApiBrackets) {
                return Promise.reject(new Error('Brackets no cargado.'));
            }
            return w.CRApiBrackets.reset(categoryId);
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

        /** Equipos con última verificación aprobada (GET /validaciones?pass=1). */
        getValidaciones: function (query) {
            var path = app.validacionesPath || '/validaciones';
            return request('GET', path, { query: query || { pass: 1 } });
        },

        fetchRegistroTeams: function (force) {
            return Equipos.fetchTeams(!!force, {});
        },
        /** Equipos pendientes en #/registro (sin robot_valid). */
        fetchRegistroTeamsPendientes: function (force, categoryId) {
            return Equipos.fetchTeams(!!force, {
                categoryId: categoryId,
                requireCategory: true,
                excludeRobotValid: true
            });
        },
        fetchRegistroTeamsPage: function (opts) {
            return Equipos.fetchTeamsPaged(opts || {});
        },
        adminEquiposPaginacionModo: function () {
            return Equipos.adminPaginacionModo();
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
        getRegistroSugerencias: function (q, categoryId) {
            return Equipos.sugerencias(q, categoryId);
        },
        getRegistroDetallePorNombre: function (nombre, categoryId) {
            return Equipos.findByName(nombre, categoryId).then(Equipos.toDetallePanel);
        }
    };

    /* w.CRApi definido arriba */
})(window);
