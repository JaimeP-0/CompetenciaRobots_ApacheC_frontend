/**
 * Partidas y resultados: /partidas, /resultados, /categorias/{id}/partidas/iniciar.
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Req = w.CRApiRequest;
    if (!app || !Req) {
        throw new Error('Carga config.js y api/request.js antes de partidas.js');
    }
    var request = Req.request;

    function partidasPath() {
        return app.partidasPath || '/partidas';
    }

    function resultadosPath() {
        return app.partidasResultadosPath || '/resultados';
    }

    function parseListPayload(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        if (data && data.id != null) {
            return [data];
        }
        return [];
    }

    function normalizeQueue(raw) {
        if (!Array.isArray(raw)) {
            return [];
        }
        var out = [];
        raw.forEach(function (tid) {
            var n = Number(tid, 10);
            if (!isNaN(n) && n > 0 && out.indexOf(n) === -1) {
                out.push(n);
            }
        });
        return out;
    }

    function normalizeEmbeddedTeam(raw) {
        if (!raw || raw.id == null) {
            return null;
        }
        var id = Number(raw.id, 10);
        if (isNaN(id)) {
            return null;
        }
        var team = {
            id: id,
            name: raw.name != null ? String(raw.name).trim() : '',
            school: raw.school != null ? String(raw.school).trim() : '',
            grade: raw.grade != null ? String(raw.grade).trim() : '',
            teacher: raw.teacher != null ? String(raw.teacher).trim() : '',
            robot_valid: !!(raw.robot_valid === true || raw.robot_valid === 1)
        };
        var cid = Number(raw.category_id, 10);
        if (!isNaN(cid)) {
            team.category_id = cid;
        }
        return team;
    }

    function inferPartidaMode(item) {
        if (item.mode === 'pairwise' || item.mode === 'shared') {
            return item.mode;
        }
        if (item.team_a || item.team_b || (item.team_a_id != null && item.team_b_id != null)) {
            return 'pairwise';
        }
        if (item.queue && item.queue.length) {
            return 'shared';
        }
        return 'unknown';
    }

    function normalizePartida(raw) {
        if (!raw || raw.id == null) {
            return null;
        }
        var id = Number(raw.id, 10);
        if (isNaN(id)) {
            return null;
        }
        var item = {
            id: id,
            queue: normalizeQueue(raw.queue)
        };
        var cid = Number(raw.category_id, 10);
        if (!isNaN(cid)) {
            item.category_id = cid;
        }
        if (raw.team_a && typeof raw.team_a === 'object') {
            item.team_a = normalizeEmbeddedTeam(raw.team_a);
            if (item.team_a) {
                item.team_a_id = item.team_a.id;
            }
        }
        if (raw.team_b && typeof raw.team_b === 'object') {
            item.team_b = normalizeEmbeddedTeam(raw.team_b);
            if (item.team_b) {
                item.team_b_id = item.team_b.id;
            }
        }
        var ta = raw.team_a_id;
        var tb = raw.team_b_id;
        if (item.team_a_id == null && ta != null && ta !== '') {
            var na = Number(ta, 10);
            if (!isNaN(na)) {
                item.team_a_id = na;
            }
        }
        if (item.team_b_id == null && tb != null && tb !== '') {
            var nb = Number(tb, 10);
            if (!isNaN(nb)) {
                item.team_b_id = nb;
            }
        }
        item.mode = inferPartidaMode(item);
        return item;
    }

    function normalizePartidasList(data) {
        return parseListPayload(data)
            .map(normalizePartida)
            .filter(Boolean);
    }

    function normalizeResultado(raw) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        var matchId = Number(raw.match_id != null ? raw.match_id : raw.partida_id, 10);
        var id = Number(raw.id, 10);
        if (isNaN(matchId) && isNaN(id)) {
            return null;
        }
        var item = {};
        if (!isNaN(id)) {
            item.id = id;
        }
        if (!isNaN(matchId)) {
            item.match_id = matchId;
        }
        var winner = Number(
            raw.winner_team_id != null ? raw.winner_team_id : raw.winner_id != null ? raw.winner_id : raw.team_id,
            10
        );
        if (!isNaN(winner)) {
            item.winner_team_id = winner;
        }
        if (raw.notes != null) {
            item.notes = String(raw.notes);
        }
        if (raw.score != null) {
            item.score = raw.score;
        }
        if (Array.isArray(raw.placements)) {
            item.placements = raw.placements;
        }
        return item;
    }

    function normalizeResultadosList(data) {
        return parseListPayload(data)
            .map(normalizeResultado)
            .filter(Boolean);
    }

    function inferMatchModeFromCategoryName(categoryName) {
        var n = String(categoryName || '')
            .trim()
            .toLowerCase();
        if (n.indexOf('sumo') !== -1) {
            return 'pairwise';
        }
        return 'shared';
    }

    function partidasIniciarPath(categoryId) {
        return (
            (app.categoriasPath || '/categorias') +
            '/' +
            encodeURIComponent(String(categoryId)) +
            '/partidas/iniciar'
        );
    }

    function fetchPartidas() {
        return request('GET', partidasPath(), {}).then(normalizePartidasList);
    }

    function fetchPartidaById(matchId) {
        return request('GET', partidasPath() + '/' + encodeURIComponent(String(matchId)), {}).then(
            function (data) {
                return normalizePartida(data);
            }
        );
    }

    function createPartida(body) {
        return request('POST', partidasPath(), { body: body || {} }).then(function (data) {
            return normalizePartida(data) || normalizePartidasList(data)[0];
        });
    }

    function postPartidasIniciar(categoryId, opts) {
        opts = opts || {};
        var payload = {};
        if (opts.mode === 'pairwise' || opts.mode === 'shared') {
            payload.mode = opts.mode;
        }
        return request('POST', partidasIniciarPath(categoryId), { body: payload }).then(normalizePartidasList);
    }

    function fetchAllResultados() {
        return request('GET', resultadosPath(), {}).then(normalizeResultadosList);
    }

    function fetchResultadoByMatchId(matchId) {
        return request(
            'GET',
            partidasPath() + '/' + encodeURIComponent(String(matchId)) + '/resultado',
            {}
        )
            .then(function (data) {
                return normalizeResultado(data);
            })
            .catch(function () {
                return null;
            });
    }

    function createResultado(matchId, body) {
        return request(
            'POST',
            partidasPath() + '/' + encodeURIComponent(String(matchId)) + '/resultado',
            { body: body || {} }
        ).then(function (data) {
            return normalizeResultado(data);
        });
    }

    w.CRApiPartidas = {
        inferMatchModeFromCategoryName: inferMatchModeFromCategoryName,
        normalizePartida: normalizePartida,
        normalizePartidasList: normalizePartidasList,
        normalizeResultado: normalizeResultado,
        fetchAll: fetchPartidas,
        fetchById: fetchPartidaById,
        create: createPartida,
        postIniciar: postPartidasIniciar,
        fetchAllResultados: fetchAllResultados,
        fetchResultadoByMatchId: fetchResultadoByMatchId,
        createResultado: createResultado
    };
})(window);
