/**
 * Matchmaking: minisumo 1v1 por ronda, fútbol 2v2 (validación 2 robots), sin brackets.
 */
(function (w) {
    'use strict';

    var Partidas = w.CRApiPartidas;
    var Equipos = w.CRApiEquiposRegistro;
    var Cats = w.CRCategoriasCompetencia;
    var Origin = w.CRTeamOrigin;
    if (!Partidas || !Cats) {
        throw new Error('Carga categorias-competencia.js y partidas.js antes de matchmaking.js');
    }

    function shuffleArray(arr) {
        var a = (arr || []).slice();
        var i;
        for (i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    function robotCountsByTeam(robots, categoryId) {
        var counts = {};
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
            var key = String(r.team_id);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }

    function filterIdsByRobotCount(teamIds, categoryId, categoryName, robots) {
        var required = Cats.robotsRequiredPerTeam(categoryName);
        if (required <= 1) {
            return teamIds;
        }
        var counts = robotCountsByTeam(robots, categoryId);
        return (teamIds || []).filter(function (tid) {
            return (counts[String(tid)] || 0) >= required;
        });
    }

    function fetchEligibleTeamIds(categoryId, opts) {
        opts = opts || {};
        var categoryName = opts.categoryName || '';
        return Partidas.fetchValidatedTeamIdsForCategory(categoryId, opts).then(function (ids) {
            if (Cats.robotsRequiredPerTeam(categoryName) <= 1 || !Equipos) {
                return ids;
            }
            return Equipos.fetchRobots()
                .then(function (robots) {
                    return filterIdsByRobotCount(ids, categoryId, categoryName, robots);
                })
                .catch(function () {
                    return ids;
                });
        });
    }

    function winnerIdFromPartida(partida) {
        if (!partida || !partida.result) {
            return null;
        }
        return Partidas.winnerIdFromResultado(partida.result);
    }

    function isPartidaPending(partida) {
        if (!partida) {
            return false;
        }
        if (partida.result && winnerIdFromPartida(partida) != null) {
            return false;
        }
        var s = String(partida.status || '').toLowerCase();
        if (s === 'completed' || s === 'done') {
            return false;
        }
        return true;
    }

    function filterScopedPartidas(partidas, categoryId, opts) {
        var list = (partidas || []).filter(function (p) {
            return p && String(p.category_id) === String(categoryId);
        });
        var scope = Partidas.queueScopeFromOpts(opts);
        if (!scope || !Origin) {
            return Promise.resolve(list);
        }
        if (!Equipos || typeof Equipos.fetchTeamsByCategoryEnriched !== 'function') {
            return Promise.resolve(Origin.filterPartidasByQueueScope(list, scope, {}));
        }
        return Equipos.fetchTeamsByCategoryEnriched(categoryId)
            .then(function (teams) {
                var byId = {};
                (teams || []).forEach(function (t) {
                    if (t && t.id != null) {
                        byId[String(t.id)] = t;
                    }
                });
                return Origin.filterPartidasByQueueScope(list, scope, byId);
            })
            .catch(function () {
                return Origin.filterPartidasByQueueScope(list, scope, {});
            });
    }

    function teamsInPendingPartidas(partidas) {
        var pending = {};
        (partidas || []).forEach(function (p) {
            if (!isPartidaPending(p)) {
                return;
            }
            var ids = [];
            if (p.team_a_id != null) {
                ids.push(Number(p.team_a_id, 10));
            }
            if (p.team_b_id != null) {
                ids.push(Number(p.team_b_id, 10));
            }
            (p.queue || []).forEach(function (tid) {
                ids.push(Number(tid, 10));
            });
            ids.forEach(function (tid) {
                if (!isNaN(tid)) {
                    pending[String(tid)] = true;
                }
            });
        });
        return pending;
    }

    function collectRoundWinners(completedPartidas) {
        var wins = {};
        (completedPartidas || []).forEach(function (p) {
            var wId = winnerIdFromPartida(p);
            if (wId != null) {
                wins[String(wId)] = Number(wId, 10);
            }
        });
        return Object.keys(wins).map(function (k) {
            return wins[k];
        });
    }

    function pickTeamsForPairing(categoryId, opts, forNextRound) {
        opts = opts || {};
        return Promise.all([
            fetchEligibleTeamIds(categoryId, opts),
            Partidas.fetchByCategory(categoryId)
        ]).then(function (arr) {
            var eligible = arr[0];
            return filterScopedPartidas(arr[1], categoryId, opts).then(function (scoped) {
                var pendingSet = teamsInPendingPartidas(scoped);
                var pool = eligible.filter(function (tid) {
                    return !pendingSet[String(tid)];
                });

                if (forNextRound && Cats.isMinisumoCategoryName(opts.categoryName)) {
                    var completed = scoped.filter(function (p) {
                        return !isPartidaPending(p) && winnerIdFromPartida(p) != null;
                    });
                    var winners = collectRoundWinners(completed).filter(function (tid) {
                        return pendingSet[String(tid)] !== true;
                    });
                    if (winners.length >= 2) {
                        pool = winners;
                    }
                }

                return { teamIds: pool, pendingCount: Object.keys(pendingSet).length };
            });
        });
    }

    function iniciarCola(categoryId, opts) {
        opts = opts || {};
        var mode =
            opts.mode ||
            (opts.categoryName
                ? Cats.inferMatchModeFromCategoryName(opts.categoryName)
                : Partidas.inferMatchModeFromCategoryName(opts.categoryName));

        if (mode === 'solo') {
            return Partidas.postIniciar(categoryId, opts);
        }

        return pickTeamsForPairing(categoryId, opts, false).then(function (picked) {
            if (picked.teamIds.length < 2) {
                return Partidas.postIniciar(categoryId, Object.assign({}, opts, { team_ids: picked.teamIds }));
            }
            var ordered = shuffleArray(picked.teamIds);
            return Partidas.postIniciar(
                categoryId,
                Object.assign({}, opts, { mode: 'pairwise', team_ids: ordered })
            );
        });
    }

    function generarMasPartidas(categoryId, opts) {
        opts = opts || {};
        if (!Cats.isMinisumoCategoryName(opts.categoryName) && !Cats.isFutbolCategoryName(opts.categoryName)) {
            return Promise.reject(new Error('Solo minisumo y fútbol usan emparejamiento por ronda.'));
        }
        var MAX_BATCHES = 48;
        var createdAll = [];

        function runBatch(batchNo) {
            if (batchNo >= MAX_BATCHES) {
                return createdAll;
            }
            return pickTeamsForPairing(categoryId, opts, false).then(function (picked) {
                if (picked.teamIds.length < 2) {
                    return createdAll;
                }
                var ordered = shuffleArray(picked.teamIds);
                return Partidas.postIniciar(
                    categoryId,
                    Object.assign({}, opts, { mode: 'pairwise', team_ids: ordered })
                ).then(function (created) {
                    var list = created || [];
                    if (!list.length) {
                        return createdAll;
                    }
                    createdAll = createdAll.concat(list);
                    return runBatch(batchNo + 1);
                });
            });
        }

        return runBatch(0).then(function (allCreated) {
            if (!allCreated.length) {
                return Promise.reject(
                    new Error('No hay suficientes equipos para crear nuevas partidas en esta cola.')
                );
            }
            return allCreated;
        });
    }

    function countPendingInScope(categoryId, opts) {
        return Partidas.fetchByCategory(categoryId).then(function (list) {
            return filterScopedPartidas(list, categoryId, opts).then(function (scoped) {
                var n = 0;
                scoped.forEach(function (p) {
                    if (isPartidaPending(p)) {
                        n++;
                    }
                });
                return n;
            });
        });
    }

    w.CRApiMatchmaking = {
        fetchEligibleTeamIds: fetchEligibleTeamIds,
        iniciarCola: iniciarCola,
        generarMasPartidas: generarMasPartidas,
        countPendingInScope: countPendingInScope,
        filterIdsByRobotCount: filterIdsByRobotCount
    };
})(window);
