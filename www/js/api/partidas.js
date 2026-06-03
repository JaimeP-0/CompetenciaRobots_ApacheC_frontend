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

    function parseBracketKey(key) {
        var m = String(key || '').match(/^r(\d+)-m(\d+)$/i);
        if (!m) {
            return { round: null, slot: null };
        }
        return { round: Number(m[1], 10), slot: Number(m[2], 10) };
    }

    function normalizePartidaStatus(raw, hasResult) {
        var s = raw != null ? String(raw).toLowerCase() : '';
        if (s === 'done') {
            s = 'completed';
        }
        if (hasResult && (!s || s === 'ready' || s === 'pending')) {
            return 'completed';
        }
        if (!s) {
            return hasResult ? 'completed' : 'ready';
        }
        return s;
    }

    function filterPartidasByCategory(list, categoryId) {
        if (categoryId == null || categoryId === '') {
            return list || [];
        }
        return (list || []).filter(function (p) {
            return p && String(p.category_id) === String(categoryId);
        });
    }

    function filterPartidasByBracketId(list, bracketId) {
        if (!bracketId) {
            return list || [];
        }
        return (list || []).filter(function (p) {
            return p && String(p.bracket_id) === String(bracketId);
        });
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
        if (raw.is_internal != null && raw.is_internal !== '') {
            var internalRaw = String(raw.is_internal).trim().toLowerCase();
            item.is_internal = internalRaw === 'true' || internalRaw === '1';
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
        if (raw.result && typeof raw.result === 'object') {
            var resRaw = raw.result;
            if (resRaw.match_id == null) {
                resRaw = Object.assign({ match_id: id }, resRaw);
            }
            item.result = normalizeResultado(resRaw);
        }
        var bracketRaw =
            raw.bracket_id != null
                ? raw.bracket_id
                : raw.bracket_type != null
                  ? raw.bracket_type
                  : null;
        if (bracketRaw != null && bracketRaw !== '') {
            item.bracket_id = String(bracketRaw).toLowerCase();
        }
        if (raw.bracket_key != null && raw.bracket_key !== '') {
            item.bracket_key = String(raw.bracket_key);
        } else if (raw.bracket_match_key != null && raw.bracket_match_key !== '') {
            item.bracket_key = String(raw.bracket_match_key);
        }
        var br = Number(raw.bracket_round, 10);
        if (!isNaN(br)) {
            item.bracket_round = br;
        }
        var bs = Number(raw.bracket_slot, 10);
        if (!isNaN(bs)) {
            item.bracket_slot = bs;
        }
        if (item.bracket_key && (item.bracket_round == null || item.bracket_slot == null)) {
            var parsedKey = parseBracketKey(item.bracket_key);
            if (item.bracket_round == null && parsedKey.round != null) {
                item.bracket_round = parsedKey.round;
            }
            if (item.bracket_slot == null && parsedKey.slot != null) {
                item.bracket_slot = parsedKey.slot;
            }
        }
        item.status = normalizePartidaStatus(raw.status, !!item.result);
        return item;
    }

    function normalizeResultadoFromPartidasList(partidas) {
        var map = {};
        (partidas || []).forEach(function (p) {
            if (p && p.result && p.id != null) {
                map[String(p.id)] = p.result;
            }
        });
        return map;
    }

    function normalizePartidasList(data) {
        return parseListPayload(data)
            .map(normalizePartida)
            .filter(Boolean);
    }

    function normalizeResultTime(raw) {
        if (raw == null) {
            return null;
        }
        if (typeof raw === 'object') {
            if (raw.minutes != null && raw.seconds != null) {
                var mins = Number(raw.minutes, 10);
                var secs = Number(raw.seconds, 10);
                if (!isNaN(mins) && !isNaN(secs)) {
                    return { minutes: mins, seconds: secs };
                }
            }
            if (raw.result_time_seconds != null) {
                var totalObj = Number(raw.result_time_seconds, 10);
                if (!isNaN(totalObj) && totalObj >= 0) {
                    return { minutes: Math.floor(totalObj / 60), seconds: totalObj % 60 };
                }
            }
            return null;
        }
        var total = Number(raw, 10);
        if (isNaN(total) || total < 0) {
            return null;
        }
        return { minutes: Math.floor(total / 60), seconds: total % 60 };
    }

    function readResultTimeRaw(raw) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        if (raw.time != null) {
            return raw.time;
        }
        if (raw.result_time != null) {
            return raw.result_time;
        }
        if (raw.result_time_seconds != null) {
            return raw.result_time_seconds;
        }
        return null;
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
        var teamId = Number(
            raw.team_id != null
                ? raw.team_id
                : raw.winner != null
                  ? raw.winner
                  : raw.winner_team_id != null
                    ? raw.winner_team_id
                    : raw.winner_id != null
                      ? raw.winner_id
                      : NaN,
            10
        );
        if (!isNaN(teamId)) {
            item.team_id = teamId;
            item.winner = teamId;
            item.winner_team_id = teamId;
        }
        var eliminated = Number(raw.eliminated_team_id, 10);
        if (!isNaN(eliminated)) {
            item.eliminated_team_id = eliminated;
        }
        var time = normalizeResultTime(readResultTimeRaw(raw));
        if (time) {
            item.time = time;
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

    function buildResultadoPayload(body) {
        body = body || {};
        var teamRaw =
            body.team_id != null ? body.team_id : body.winner != null ? body.winner : body.winner_team_id;
        var teamId = Number(teamRaw, 10);
        if (isNaN(teamId)) {
            throw new Error('team_id requerido.');
        }
        var payload = { team_id: teamId };
        if (body.eliminated_team_id != null && body.eliminated_team_id !== '') {
            var eliminated = Number(body.eliminated_team_id, 10);
            if (!isNaN(eliminated)) {
                payload.eliminated_team_id = eliminated;
            }
        }
        if (body.requireTime) {
            var requiredTime = parseResultTimeFields(body.time);
            if (!requiredTime) {
                throw new Error('Indica minutos y segundos.');
            }
            payload.time = requiredTime;
            return payload;
        }
        var optionalTime = parseResultTimeFields(body.time);
        if (optionalTime) {
            payload.time = optionalTime;
        }
        return payload;
    }

    function normalizeResultadosList(data) {
        return parseListPayload(data)
            .map(normalizeResultado)
            .filter(Boolean);
    }

    function isSoloRaceCategoryName(categoryName) {
        return isLineFollowerCategoryName(categoryName) || isVelocistaCategoryName(categoryName);
    }

    function inferMatchModeFromCategoryName(categoryName) {
        if (w.CRCategoriasCompetencia) {
            return w.CRCategoriasCompetencia.inferMatchModeFromCategoryName(categoryName);
        }
        if (isVelocistaCategoryName(categoryName)) {
            return 'solo';
        }
        return 'shared';
    }

    function isVelocistaCategoryName(categoryName) {
        var n = String(categoryName || '')
            .trim()
            .toLowerCase();
        return n.indexOf('velocista') !== -1 || n.indexOf('velocisra') !== -1 || n.indexOf('speedster') !== -1;
    }

    function isMinisumoCategoryName(categoryName) {
        if (w.CRCategoriasCompetencia) {
            return w.CRCategoriasCompetencia.isMinisumoCategoryName(categoryName);
        }
        var n = String(categoryName || '')
            .trim()
            .toLowerCase();
        return n.indexOf('minisumo') !== -1 || n.indexOf('mini sumo') !== -1;
    }

    function isFutbolCategoryName(categoryName) {
        if (w.CRCategoriasCompetencia) {
            return w.CRCategoriasCompetencia.isFutbolCategoryName(categoryName);
        }
        var n = String(categoryName || '')
            .trim()
            .toLowerCase();
        return n.indexOf('futbol') !== -1 || n.indexOf('football') !== -1;
    }

    /** @deprecated Usar isMinisumoCategoryName; no hay brackets. */
    function isSumoCategoryName(categoryName) {
        return isMinisumoCategoryName(categoryName);
    }

    function isLineFollowerCategoryName(categoryName) {
        if (isVelocistaCategoryName(categoryName)) {
            return true;
        }
        var n = String(categoryName || '')
            .trim()
            .toLowerCase();
        if (!n || n.indexOf('sumo') !== -1) {
            return false;
        }
        var keys = ['classic', 'seguidor', 'line follower', 'line-follower', 'linefollower'];
        var i;
        for (i = 0; i < keys.length; i++) {
            if (n.indexOf(keys[i]) !== -1) {
                return true;
            }
        }
        if (n === 'more' || /\bmore\b/.test(n)) {
            return true;
        }
        return false;
    }

    function parseResultTimeFields(timeBody) {
        timeBody = timeBody || {};
        var minRaw = timeBody.minutes;
        var secRaw = timeBody.seconds;
        var hasMin = minRaw !== '' && minRaw != null;
        var hasSec = secRaw !== '' && secRaw != null;
        if (!hasMin && !hasSec) {
            return null;
        }
        var mins = hasMin ? Math.max(0, Math.floor(Number(minRaw, 10))) : 0;
        var secs = hasSec ? Math.floor(Number(secRaw, 10)) : 0;
        if (isNaN(mins)) {
            mins = 0;
        }
        if (isNaN(secs)) {
            secs = 0;
        }
        if (secs < 0 || secs > 59) {
            throw new Error('Los segundos deben estar entre 0 y 59.');
        }
        return { minutes: mins, seconds: secs };
    }

    function partidasIniciarPath(categoryId) {
        return (
            (app.categoriasPath || '/categorias') +
            '/' +
            encodeURIComponent(String(categoryId)) +
            '/partidas/iniciar'
        );
    }

    function fetchPartidas(query) {
        query = query || {};
        if ((w.CR_APP || w.CR_CONFIG) && (w.CR_APP || w.CR_CONFIG).debugApi) {
            var base = (w.CRApi && typeof w.CRApi.buildUrl === 'function')
                ? w.CRApi.buildUrl(partidasPath(), query)
                : partidasPath();
            try {
                console.info('[CR] fetch', base);
            } catch (ignore) {}
        }
        return request('GET', partidasPath(), { query: query }).then(function (data) {
            var list = normalizePartidasList(data);
            if (query.category_id != null && query.category_id !== '') {
                list = filterPartidasByCategory(list, query.category_id);
            }
            if (query.bracket_id != null && query.bracket_id !== '') {
                list = filterPartidasByBracketId(list, query.bracket_id);
            }
            return list;
        });
    }

    function fetchPartidasByCategory(categoryId, opts) {
        opts = opts || {};
        var query = { category_id: categoryId };
        if (opts.bracket_id != null) {
            query.bracket_id = opts.bracket_id;
        }
        return fetchPartidas(query);
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

    function queueScopeFromOpts(opts) {
        var Origin = w.CRTeamOrigin;
        if (!Origin || !opts) {
            return '';
        }
        return Origin.normalizeQueueScope(opts.queueScope != null ? opts.queueScope : opts.queue_scope);
    }

    function teamMetaMapFromTeams(teams) {
        var map = {};
        (teams || []).forEach(function (t) {
            if (t && t.id != null) {
                map[String(t.id)] = {
                    school: t.school != null ? String(t.school).trim() : '',
                    is_internal: t.is_internal
                };
            }
        });
        return map;
    }

    function fetchValidatedTeamIdsForCategory(categoryId, opts) {
        opts = opts || {};
        var scope = queueScopeFromOpts(opts);
        var Equipos = w.CRApiEquiposRegistro;
        var Origin = w.CRTeamOrigin;
        if (!Equipos || typeof Equipos.fetchRobots !== 'function') {
            return Promise.resolve([]);
        }
        var teamsPromise =
            scope && typeof Equipos.fetchTeamsByCategoryEnriched === 'function'
                ? Equipos.fetchTeamsByCategoryEnriched(categoryId).catch(function () {
                      return [];
                  })
                : Promise.resolve([]);
        return Promise.all([Equipos.fetchRobots(), teamsPromise])
            .then(function (arr) {
                var robots = arr[0];
                var metaByTeam = teamMetaMapFromTeams(arr[1]);
                var ids = [];
                var seen = {};
                (robots || []).forEach(function (r) {
                    if (!r || !(r.is_valid === true || r.is_valid === 1) || r.team_id == null) {
                        return;
                    }
                    var catOk = false;
                    if (r.category_id != null && String(r.category_id) === String(categoryId)) {
                        catOk = true;
                    }
                    if (!catOk && Array.isArray(r.rules)) {
                        r.rules.forEach(function (rule) {
                            if (rule && String(rule.category_id) === String(categoryId)) {
                                catOk = true;
                            }
                        });
                    }
                    if (!catOk) {
                        return;
                    }
                    var tid = Number(r.team_id, 10);
                    if (isNaN(tid) || seen[String(tid)]) {
                        return;
                    }
                    if (scope && Origin) {
                        var scoped = Origin.filterTeamIdsByQueueScope([tid], scope, metaByTeam);
                        if (!scoped.length) {
                            return;
                        }
                    }
                    seen[String(tid)] = true;
                    ids.push(tid);
                });
                ids.sort(function (a, b) {
                    return a - b;
                });
                return ids;
            })
            .catch(function () {
                return [];
            });
    }

    function teamIdsInPartida(partida) {
        if (!partida) {
            return [];
        }
        if (partida.queue && partida.queue.length) {
            return partida.queue.slice();
        }
        var ids = [];
        if (partida.team_a_id != null) {
            ids.push(Number(partida.team_a_id, 10));
        }
        if (partida.team_b_id != null) {
            ids.push(Number(partida.team_b_id, 10));
        }
        return ids;
    }

    function teamInPartidaList(teamId, partidas) {
        var tid = Number(teamId, 10);
        if (isNaN(tid)) {
            return false;
        }
        var i;
        for (i = 0; i < (partidas || []).length; i++) {
            var ids = teamIdsInPartida(partidas[i]);
            var j;
            for (j = 0; j < ids.length; j++) {
                if (ids[j] === tid) {
                    return true;
                }
            }
        }
        return false;
    }

    /** Una partida por equipo (carrera individual con tiempo). */
    function postPartidasIniciarSolo(categoryId, opts) {
        opts = opts || {};
        return fetchValidatedTeamIdsForCategory(categoryId, opts)
            .then(function (validatedIds) {
                return fetchPartidasByCategory(categoryId).then(function (existing) {
                    var toCreate = validatedIds.filter(function (tid) {
                        return !teamInPartidaList(tid, existing);
                    });
                    if (!toCreate.length) {
                        return [];
                    }
                    var created = [];
                    var chain = Promise.resolve();
                    toCreate.forEach(function (tid) {
                        chain = chain.then(function () {
                            return createPartida({
                                queue: [tid]
                            }).then(function (p) {
                                if (p) {
                                    created.push(p);
                                }
                            });
                        });
                    });
                    return chain.then(function () {
                        return created;
                    });
                });
            });
    }

    function normalizeTeamIdList(raw) {
        if (!Array.isArray(raw)) {
            return [];
        }
        return raw
            .map(function (id) {
                return Number(id, 10);
            })
            .filter(function (n) {
                return !isNaN(n) && n > 0;
            });
    }

    function buildIniciarPayload(opts, teamIds) {
        var payload = {};
        if (opts.mode === 'pairwise' || opts.mode === 'shared') {
            payload.mode = opts.mode;
        }
        var ids = normalizeTeamIdList(teamIds);
        if (ids.length) {
            payload.team_ids = ids;
        }
        return payload;
    }

    function filterTeamIdsForScope(categoryId, teamIds, scope) {
        var Origin = w.CRTeamOrigin;
        var Equipos = w.CRApiEquiposRegistro;
        if (!scope || !Origin || !Equipos || typeof Equipos.fetchTeamsByCategoryEnriched !== 'function') {
            return Promise.resolve(normalizeTeamIdList(teamIds));
        }
        return Equipos.fetchTeamsByCategoryEnriched(categoryId)
            .then(function (teams) {
                return Origin.filterTeamIdsByQueueScope(
                    normalizeTeamIdList(teamIds),
                    scope,
                    teamMetaMapFromTeams(teams)
                );
            })
            .catch(function () {
                return normalizeTeamIdList(teamIds);
            });
    }

    function postPartidasIniciar(categoryId, opts) {
        opts = opts || {};
        var mode = opts.mode;
        if (!mode && opts.categoryName) {
            mode = inferMatchModeFromCategoryName(opts.categoryName);
        }
        if (mode === 'solo') {
            return postPartidasIniciarSolo(categoryId, opts);
        }
        var scope = queueScopeFromOpts(opts);
        var explicitIds = opts.team_ids || opts.teamIds;

        if (scope) {
            if (Array.isArray(explicitIds) && explicitIds.length) {
                return filterTeamIdsForScope(categoryId, explicitIds, scope).then(function (filtered) {
                    return request('POST', partidasIniciarPath(categoryId), {
                        body: buildIniciarPayload(opts, filtered)
                    }).then(normalizePartidasList);
                });
            }
            return fetchValidatedTeamIdsForCategory(categoryId, opts).then(function (validatedIds) {
                return fetchPartidasByCategory(categoryId).then(function (existing) {
                    var pending = validatedIds.filter(function (tid) {
                        return !teamInPartidaList(tid, existing);
                    });
                    return request('POST', partidasIniciarPath(categoryId), {
                        body: buildIniciarPayload(opts, pending)
                    }).then(normalizePartidasList);
                });
            });
        }

        var payload = buildIniciarPayload(opts, explicitIds);
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
        var payload = buildResultadoPayload(body);
        return request(
            'POST',
            partidasPath() + '/' + encodeURIComponent(String(matchId)) + '/resultado',
            { body: payload }
        ).then(function (data) {
            return normalizeResultado(data);
        });
    }

    function winnerIdFromResultado(resultado) {
        if (!resultado) {
            return null;
        }
        var id =
            resultado.team_id != null
                ? resultado.team_id
                : resultado.winner != null
                  ? resultado.winner
                  : resultado.winner_team_id;
        return id != null ? id : null;
    }

    function isResultComplete(resultado, categoryName) {
        if (!resultado) {
            return false;
        }
        if (isVelocistaCategoryName(categoryName) || isLineFollowerCategoryName(categoryName)) {
            return !!normalizeResultTime(readResultTimeRaw(resultado));
        }
        return winnerIdFromResultado(resultado) != null;
    }

    function resultTimeSeconds(resultado) {
        var time = normalizeResultTime(readResultTimeRaw(resultado));
        if (!time) {
            return null;
        }
        return time.minutes * 60 + time.seconds;
    }

    function formatResultTimeDisplay(time) {
        if (!time || time.minutes == null || time.seconds == null) {
            return '';
        }
        var mins = Number(time.minutes, 10);
        var secs = Number(time.seconds, 10);
        if (isNaN(mins) || isNaN(secs)) {
            return '';
        }
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    w.CRApiPartidas = {
        inferMatchModeFromCategoryName: inferMatchModeFromCategoryName,
        isSoloRaceCategoryName: isSoloRaceCategoryName,
        isLineFollowerCategoryName: isLineFollowerCategoryName,
        isVelocistaCategoryName: isVelocistaCategoryName,
        isMinisumoCategoryName: isMinisumoCategoryName,
        isFutbolCategoryName: isFutbolCategoryName,
        isSumoCategoryName: isSumoCategoryName,
        buildResultadoPayload: buildResultadoPayload,
        normalizeResultTime: normalizeResultTime,
        normalizePartida: normalizePartida,
        normalizePartidasList: normalizePartidasList,
        normalizeResultadoFromPartidasList: normalizeResultadoFromPartidasList,
        normalizeResultado: normalizeResultado,
        winnerIdFromResultado: winnerIdFromResultado,
        isResultComplete: isResultComplete,
        resultTimeSeconds: resultTimeSeconds,
        formatResultTimeDisplay: formatResultTimeDisplay,
        parseBracketKey: parseBracketKey,
        filterPartidasByCategory: filterPartidasByCategory,
        filterPartidasByBracketId: filterPartidasByBracketId,
        fetchAll: fetchPartidas,
        fetchByCategory: fetchPartidasByCategory,
        fetchById: fetchPartidaById,
        create: createPartida,
        queueScopeFromOpts: queueScopeFromOpts,
        fetchValidatedTeamIdsForCategory: fetchValidatedTeamIdsForCategory,
        teamInPartidaList: teamInPartidaList,
        postIniciar: postPartidasIniciar,
        fetchAllResultados: fetchAllResultados,
        fetchResultadoByMatchId: fetchResultadoByMatchId,
        createResultado: createResultado
    };
})(window);
