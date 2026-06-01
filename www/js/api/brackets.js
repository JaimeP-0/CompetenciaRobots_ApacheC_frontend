/**
 * Brackets sumo — cuadro principal desde partidas winner; lista de eliminados aparte.
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Req = w.CRApiRequest;
    var Engine = w.CRBracketEngine;
    var Partidas = w.CRApiPartidas;
    if (!app || !Req || !Engine || !Partidas) {
        throw new Error('Carga bracket-engine.js, partidas.js y api/request.js antes de brackets.js');
    }
    var request = Req.request;

    function isNotFoundError(err) {
        var msg = err && err.message ? String(err.message) : '';
        return msg.indexOf('404') === 0 || msg.indexOf(' 404 ') !== -1;
    }

    function bracketPath(categoryId) {
        return (
            (app.categoriasPath || '/categorias') +
            '/' +
            encodeURIComponent(String(categoryId)) +
            '/bracket'
        );
    }

    function isPartidaCompleted(partida) {
        if (!partida) {
            return false;
        }
        if (partida.result && Partidas.winnerIdFromResultado(partida.result) != null) {
            return true;
        }
        var s = String(partida.status || '').toLowerCase();
        return s === 'completed' || s === 'done' || s === 'bye';
    }

    function isWinnerPartida(partida) {
        return partida && String(partida.bracket_id || '').toLowerCase() === 'winner';
    }

    function filterCategoryPartidas(partidas, categoryId) {
        return (partidas || []).filter(function (p) {
            return p && String(p.category_id) === String(categoryId);
        });
    }

    function partidaToMatch(partida) {
        var round = partida.bracket_round;
        var slot = partida.bracket_slot;
        if (round == null || slot == null) {
            var parsed = Partidas.parseBracketKey(partida.bracket_key);
            if (round == null && parsed.round != null) {
                round = parsed.round;
            }
            if (slot == null && parsed.slot != null) {
                slot = parsed.slot;
            }
        }
        if (round == null) {
            round = 0;
        }
        if (slot == null) {
            slot = 0;
        }
        var key = partida.bracket_key || Engine.matchKey(round, slot);
        var winner = Partidas.winnerIdFromResultado(partida.result);
        var status = String(partida.status || 'pending').toLowerCase();
        if (winner != null && status !== 'bye') {
            status = 'completed';
        }
        if (status === 'done') {
            status = 'completed';
        }
        return {
            key: key,
            round: round,
            slot: slot,
            teamA: partida.team_a_id,
            teamB: partida.team_b_id,
            winner: winner != null ? Number(winner, 10) : null,
            matchId: partida.id,
            status: status
        };
    }

    /** Equipos que ya perdieron en el cuadro principal — no vuelven a pelear. */
    function computeEliminatedFromWinner(catPartidas) {
        var out = {};
        catPartidas.forEach(function (p) {
            if (!isWinnerPartida(p) || !isPartidaCompleted(p) || !p.result) {
                return;
            }
            var eliminated = Number(p.result.eliminated_team_id, 10);
            if (!isNaN(eliminated)) {
                out[String(eliminated)] = eliminated;
            }
        });
        return out;
    }

    /** Equipos fuera del torneo (2+ derrotas en cualquier partida). */
    function computeFullyOut(catPartidas) {
        var losses = {};
        catPartidas.forEach(function (p) {
            if (!isPartidaCompleted(p) || !p.result) {
                return;
            }
            var eliminated = Number(p.result.eliminated_team_id, 10);
            if (isNaN(eliminated)) {
                return;
            }
            var key = String(eliminated);
            losses[key] = (losses[key] || 0) + 1;
        });
        var out = {};
        Object.keys(losses).forEach(function (key) {
            if (losses[key] >= 2) {
                out[key] = Number(key, 10);
            }
        });
        return out;
    }

    function buildEliminatedList(categoryId, partidas) {
        var catPartidas = filterCategoryPartidas(partidas, categoryId);
        var seen = {};
        var items = [];
        catPartidas.forEach(function (p) {
            if (!isPartidaCompleted(p) || !p.result) {
                return;
            }
            var eliminated = Number(p.result.eliminated_team_id, 10);
            if (isNaN(eliminated) || seen[String(eliminated)]) {
                return;
            }
            seen[String(eliminated)] = true;
            items.push({
                teamId: eliminated,
                bracketId: p.bracket_id || 'winner',
                matchId: p.id,
                roundLabel: p.bracket_key || ''
            });
        });
        items.sort(function (a, b) {
            return a.teamId - b.teamId;
        });
        return {
            categoryId: Number(categoryId, 10),
            bracketType: 'loser',
            isList: true,
            eliminatedList: items,
            count: items.length
        };
    }

    function teamsInReadyMatches(matches) {
        var set = {};
        (matches || []).forEach(function (m) {
            if (m.teamA != null) {
                set[String(m.teamA)] = true;
            }
            if (m.teamB != null) {
                set[String(m.teamB)] = true;
            }
        });
        return set;
    }

    function collectUnpairedWinners(winnerPartidas, eliminatedMap, inReadySet) {
        var winners = [];
        var seen = {};
        winnerPartidas.forEach(function (p) {
            if (!isPartidaCompleted(p) || !p.result) {
                return;
            }
            var winner = Number(Partidas.winnerIdFromResultado(p.result), 10);
            if (isNaN(winner) || eliminatedMap[String(winner)] || inReadySet[String(winner)]) {
                return;
            }
            if (!seen[String(winner)]) {
                seen[String(winner)] = true;
                winners.push(winner);
            }
        });
        return winners;
    }

    function pairTeamsForPreview(teamIds) {
        var matches = [];
        var i;
        for (i = 0; i < teamIds.length; i += 2) {
            var a = teamIds[i];
            var b = teamIds[i + 1] != null ? teamIds[i + 1] : null;
            matches.push({
                key: 'preview-m' + Math.floor(i / 2),
                round: -1,
                slot: Math.floor(i / 2),
                teamA: a,
                teamB: b,
                winner: null,
                matchId: null,
                status: b == null ? 'bye' : 'pending',
                isPreview: true
            });
        }
        return matches;
    }

    function buildWinnerView(categoryId, partidas) {
        var catPartidas = filterCategoryPartidas(partidas, categoryId);
        var eliminatedMap = computeEliminatedFromWinner(catPartidas);
        var fullyOutMap = computeFullyOut(catPartidas);

        var winnerPartidas = catPartidas.filter(function (p) {
            return (
                isWinnerPartida(p) &&
                p.team_a_id != null &&
                p.team_b_id != null &&
                !eliminatedMap[String(p.team_a_id)] &&
                !eliminatedMap[String(p.team_b_id)]
            );
        });

        var currentMatches = winnerPartidas
            .filter(function (p) {
                return String(p.status || '').toLowerCase() === 'ready' && !isPartidaCompleted(p);
            })
            .map(partidaToMatch)
            .sort(function (a, b) {
                return a.slot - b.slot;
            });

        var inReadySet = teamsInReadyMatches(currentMatches);
        var unpairedWinners = collectUnpairedWinners(winnerPartidas, eliminatedMap, inReadySet);
        var nextPreview = [];
        if (currentMatches.length === 0 && unpairedWinners.length >= 2) {
            nextPreview = pairTeamsForPreview(unpairedWinners);
        }

        var aliveSet = {};
        winnerPartidas.forEach(function (p) {
            [p.team_a_id, p.team_b_id].forEach(function (tid) {
                if (tid != null && !eliminatedMap[String(tid)] && !fullyOutMap[String(tid)]) {
                    aliveSet[String(tid)] = Number(tid, 10);
                }
            });
        });
        unpairedWinners.forEach(function (tid) {
            if (!eliminatedMap[String(tid)] && !fullyOutMap[String(tid)]) {
                aliveSet[String(tid)] = tid;
            }
        });

        var aliveTeamIds = Object.keys(aliveSet)
            .map(function (k) {
                return aliveSet[k];
            })
            .sort(function (a, b) {
                return a - b;
            });

        var currentComplete =
            currentMatches.length === 0 ||
            currentMatches.every(function (m) {
                return Engine.isMatchCompleted(m);
            });

        var canStartNextRound =
            currentComplete && unpairedWinners.length >= 2 && currentMatches.length === 0;

        var champion = null;
        if (currentMatches.length === 0 && unpairedWinners.length === 1) {
            champion = unpairedWinners[0];
        }

        return {
            id: 'partidas-' + categoryId + '-winner',
            categoryId: Number(categoryId, 10),
            bracketType: 'winner',
            fromPartidas: true,
            aliveTeamIds: aliveTeamIds,
            eliminatedCount: Object.keys(eliminatedMap).length,
            currentMatches: currentMatches,
            nextPreview: nextPreview,
            unpairedWinners: unpairedWinners,
            canStartNextRound: canStartNextRound,
            champion: champion,
            hasActiveCombats: currentMatches.length > 0
        };
    }

    function loadPartidasForCategory(categoryId) {
        return Partidas.fetchByCategory(categoryId);
    }

    function fetchBracket(categoryId, opts) {
        opts = opts || {};
        var bracketType = opts.bracketType || opts.type || 'winner';
        return loadPartidasForCategory(categoryId).then(function (list) {
            if (bracketType === 'loser') {
                return buildEliminatedList(categoryId, list);
            }
            var view = buildWinnerView(categoryId, list);
            if (view.hasActiveCombats || view.canStartNextRound || view.champion || view.eliminatedCount > 0) {
                return view;
            }
            if (view.aliveTeamIds.length) {
                return view;
            }
            return null;
        });
    }

    function fetchBracketPair(categoryId) {
        return loadPartidasForCategory(categoryId).then(function (list) {
            return {
                categoryId: Number(categoryId, 10),
                winner: buildWinnerView(categoryId, list),
                loser: buildEliminatedList(categoryId, list)
            };
        });
    }

    function postPartidaResultado(match, winner) {
        if (!match || match.matchId == null) {
            return Promise.reject(new Error('Esta partida no tiene id en el servidor.'));
        }
        var eliminated =
            match.teamA === winner ? match.teamB : match.teamB === winner ? match.teamA : null;
        var body = { team_id: winner };
        if (eliminated != null) {
            body.eliminated_team_id = eliminated;
        }
        return Partidas.createResultado(match.matchId, body);
    }

    function reloadWinnerView(categoryId) {
        return loadPartidasForCategory(categoryId).then(function (list) {
            return buildWinnerView(categoryId, list);
        });
    }

    function iniciarBracket(categoryId, opts) {
        opts = opts || {};
        return loadPartidasForCategory(categoryId)
            .then(function (list) {
                var view = buildWinnerView(categoryId, list);
                var payload = { mode: 'pairwise' };
                var teamIds = opts.team_ids || opts.teamIds;
                if (Array.isArray(teamIds) && teamIds.length) {
                    payload.team_ids = teamIds;
                } else if (view.unpairedWinners && view.unpairedWinners.length >= 2) {
                    payload.team_ids = view.unpairedWinners.slice();
                }
                return Partidas.postIniciar(categoryId, payload);
            })
            .then(function () {
                return reloadWinnerView(categoryId);
            });
    }

    function recordWinner(categoryId, bracket, matchKey, winnerTeamId) {
        if (!bracket || bracket.isList) {
            return Promise.reject(new Error('No hay cuadro activo.'));
        }
        var match = null;
        (bracket.currentMatches || []).some(function (m) {
            if (m.key === matchKey) {
                match = m;
                return true;
            }
            return false;
        });
        var winner = Number(winnerTeamId, 10);
        if (isNaN(winner)) {
            return Promise.reject(new Error('Ganador inválido.'));
        }
        if (!match) {
            return Promise.reject(new Error('Combate no encontrado.'));
        }
        if (!match.matchId) {
            return Promise.reject(new Error('Esta partida no tiene id en el servidor.'));
        }
        if (match.teamA !== winner && match.teamB !== winner) {
            return Promise.reject(new Error('El ganador debe ser uno de los equipos del combate.'));
        }
        return postPartidaResultado(match, winner).then(function () {
            return reloadWinnerView(categoryId);
        });
    }

    function resetBracket(categoryId) {
        return request('DELETE', bracketPath(categoryId), {})
            .then(function () {
                return { ok: true };
            })
            .catch(function (err) {
                if (isNotFoundError(err)) {
                    return { ok: true };
                }
                throw err;
            });
    }

    function getBracketChampion(bracket) {
        if (!bracket || bracket.isList) {
            return null;
        }
        return bracket.champion != null ? bracket.champion : null;
    }

    function canAdvanceBracket(bracket) {
        if (!bracket || bracket.isList) {
            return false;
        }
        return !!bracket.canStartNextRound;
    }

    function advanceBracketRound(categoryId) {
        return iniciarBracket(categoryId, {});
    }

    w.CRApiBrackets = {
        buildWinnerView: buildWinnerView,
        buildEliminatedList: buildEliminatedList,
        fetch: fetchBracket,
        fetchPair: fetchBracketPair,
        iniciar: iniciarBracket,
        recordWinner: recordWinner,
        reset: resetBracket,
        getBracketChampion: getBracketChampion,
        canAdvanceBracket: canAdvanceBracket,
        advanceBracketRound: advanceBracketRound
    };
})(window);
