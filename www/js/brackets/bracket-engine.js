/**
 * Motor de bracket eliminación simple (1 vs 1).
 * round 0 = primera ronda; el ganador avanza al slot floor(i/2) de la siguiente ronda.
 */
(function (w) {
    'use strict';

    function nextPowerOfTwo(n) {
        var p = 1;
        while (p < n) {
            p *= 2;
        }
        return p;
    }

    function roundLabels(matchCount) {
        if (matchCount <= 1) {
            return ['Final'];
        }
        if (matchCount === 2) {
            return ['Semifinal', 'Final'];
        }
        if (matchCount === 4) {
            return ['Cuartos', 'Semifinal', 'Final'];
        }
        if (matchCount === 8) {
            return ['Octavos', 'Cuartos', 'Semifinal', 'Final'];
        }
        var labels = [];
        var n = matchCount;
        while (n >= 1) {
            if (n === 1) {
                labels.unshift('Final');
            } else if (n === 2) {
                labels.unshift('Semifinal');
            } else if (n === 4) {
                labels.unshift('Cuartos');
            } else if (n === 8) {
                labels.unshift('Octavos');
            } else {
                labels.unshift('Ronda ' + (labels.length + 1));
            }
            n = Math.floor(n / 2);
        }
        return labels;
    }

    function matchKey(roundIndex, matchIndex) {
        return 'r' + roundIndex + '-m' + matchIndex;
    }

    function emptyMatch(roundIndex, matchIndex) {
        return {
            key: matchKey(roundIndex, matchIndex),
            round: roundIndex,
            slot: matchIndex,
            teamA: null,
            teamB: null,
            winner: null,
            matchId: null,
            status: 'pending'
        };
    }

    function resolveBye(match) {
        if (match.winner != null) {
            match.status = 'done';
            return match;
        }
        var a = match.teamA;
        var b = match.teamB;
        if (a != null && b == null) {
            match.winner = a;
            match.status = 'bye';
        } else if (b != null && a == null) {
            match.winner = b;
            match.status = 'bye';
        } else if (a != null && b != null) {
            match.status = 'ready';
        } else {
            match.status = 'pending';
        }
        return match;
    }

    function buildRounds(teamIds) {
        var ids = (teamIds || []).filter(function (id) {
            return id != null && id !== '';
        });
        var size = nextPowerOfTwo(Math.max(ids.length, 1));
        var roundCount = Math.log(size) / Math.log(2);
        var rounds = [];
        var r;
        for (r = 0; r < roundCount; r++) {
            var matchCount = size / Math.pow(2, r + 1);
            var matches = [];
            var m;
            for (m = 0; m < matchCount; m++) {
                matches.push(emptyMatch(r, m));
            }
            rounds.push(matches);
        }
        var first = rounds[0] || [];
        var i;
        for (i = 0; i < first.length; i++) {
            first[i].teamA = ids[i * 2] != null ? Number(ids[i * 2], 10) : null;
            first[i].teamB = ids[i * 2 + 1] != null ? Number(ids[i * 2 + 1], 10) : null;
            resolveBye(first[i]);
        }
        propagateWinners({ rounds: rounds, size: size, teamIds: ids.slice() });
        return rounds;
    }

    function propagateWinners(bracket) {
        var rounds = bracket.rounds;
        if (!rounds || !rounds.length) {
            return bracket;
        }
        var r;
        for (r = 0; r < rounds.length - 1; r++) {
            var current = rounds[r];
            var next = rounds[r + 1];
            var i;
            for (i = 0; i < current.length; i++) {
                var match = current[i];
                resolveBye(match);
                if (match.winner == null) {
                    continue;
                }
                var nextIdx = Math.floor(i / 2);
                var nextMatch = next[nextIdx];
                if (!nextMatch) {
                    continue;
                }
                if (i % 2 === 0) {
                    nextMatch.teamA = match.winner;
                } else {
                    nextMatch.teamB = match.winner;
                }
                resolveBye(nextMatch);
            }
        }
        return bracket;
    }

    function createBracket(categoryId, teamIds) {
        var ids = (teamIds || []).map(function (id) {
            return Number(id, 10);
        }).filter(function (n) {
            return !isNaN(n) && n > 0;
        });
        if (!ids.length) {
            throw new Error('Se necesitan equipos validados.');
        }
        if (ids.length === 1) {
            var solo = ids[0];
            return {
                id: 'local-' + categoryId + '-' + Date.now(),
                categoryId: Number(categoryId, 10),
                size: 1,
                teamIds: ids,
                rounds: [
                    [
                        {
                            key: 'r0-m0',
                            round: 0,
                            slot: 0,
                            teamA: solo,
                            teamB: null,
                            winner: solo,
                            matchId: null,
                            status: 'bye'
                        }
                    ]
                ],
                labels: ['Final'],
                updatedAt: new Date().toISOString()
            };
        }
        var size = nextPowerOfTwo(ids.length);
        var rounds = buildRounds(ids);
        return {
            id: 'local-' + categoryId + '-' + Date.now(),
            categoryId: Number(categoryId, 10),
            size: size,
            teamIds: ids,
            rounds: rounds,
            labels: roundLabels(rounds[0] ? rounds[0].length : 1),
            updatedAt: new Date().toISOString()
        };
    }

    function findMatch(bracket, matchKeyStr) {
        var rounds = bracket.rounds || [];
        var r;
        for (r = 0; r < rounds.length; r++) {
            var i;
            for (i = 0; i < rounds[r].length; i++) {
                if (rounds[r][i].key === matchKeyStr) {
                    return rounds[r][i];
                }
            }
        }
        return null;
    }

    function setWinner(bracket, matchKeyStr, winnerTeamId) {
        var winner = Number(winnerTeamId, 10);
        if (isNaN(winner)) {
            throw new Error('Ganador inválido.');
        }
        var match = findMatch(bracket, matchKeyStr);
        if (!match) {
            throw new Error('Partido no encontrado.');
        }
        if (match.winner != null) {
            throw new Error('Este combate ya tiene ganador.');
        }
        if (match.teamA !== winner && match.teamB !== winner) {
            throw new Error('El ganador debe ser uno de los equipos del combate.');
        }
        if (match.teamA == null || match.teamB == null) {
            throw new Error('El combate no está listo.');
        }
        match.winner = winner;
        match.status = 'done';
        bracket.updatedAt = new Date().toISOString();
        propagateWinners(bracket);
        return bracket;
    }

    function isMatchCompleted(match) {
        if (!match) {
            return false;
        }
        if (match.winner != null) {
            return true;
        }
        var s = String(match.status || '').toLowerCase();
        return s === 'completed' || s === 'done' || s === 'bye';
    }

    function isMatchReady(match) {
        if (!match || isMatchCompleted(match)) {
            return false;
        }
        var s = String(match.status || '').toLowerCase();
        if (s === 'ready') {
            return match.teamA != null && match.teamB != null;
        }
        return match.teamA != null && match.teamB != null && match.winner == null;
    }

    function getActiveMatches(bracket) {
        var out = [];
        (bracket.rounds || []).forEach(function (round) {
            (round || []).forEach(function (match) {
                if (isMatchReady(match)) {
                    out.push(match);
                }
            });
        });
        return out;
    }

    function getChampion(bracket) {
        var rounds = bracket.rounds || [];
        var i;
        for (i = rounds.length - 1; i >= 0; i--) {
            var round = rounds[i];
            if (!round || !round.length) {
                continue;
            }
            var m = round[0];
            if (m && m.winner != null) {
                return m.winner;
            }
        }
        return null;
    }

    function isRoundComplete(bracket, roundIndex) {
        var round = (bracket.rounds || [])[roundIndex];
        if (!round || !round.length) {
            return true;
        }
        var i;
        for (i = 0; i < round.length; i++) {
            if (!isMatchCompleted(round[i])) {
                return false;
            }
        }
        return true;
    }

    /** Primera ronda con combates sin cerrar (vista inicial). */
    function findActiveRoundIndex(bracket) {
        var rounds = bracket.rounds || [];
        var r;
        for (r = 0; r < rounds.length; r++) {
            if (!isRoundComplete(bracket, r)) {
                return r;
            }
        }
        return Math.max(0, rounds.length - 1);
    }

    function getRoundLabel(bracket, roundIndex) {
        var labels = bracket.labels || [];
        var round = (bracket.rounds || [])[roundIndex];
        if (labels[roundIndex]) {
            return labels[roundIndex];
        }
        if (round && round.length) {
            return roundLabels(round.length)[0] || 'Ronda ' + (roundIndex + 1);
        }
        return 'Ronda ' + (roundIndex + 1);
    }

    function getActiveMatchesInRound(bracket, roundIndex) {
        var round = (bracket.rounds || [])[roundIndex];
        if (!round) {
            return [];
        }
        return round.filter(function (match) {
            return isMatchReady(match);
        });
    }

    function canAdvanceToNextRound(bracket, visibleRoundIndex) {
        if (!bracket || !bracket.rounds || !bracket.rounds.length) {
            return false;
        }
        if (getChampion(bracket) != null) {
            return false;
        }
        if (!isRoundComplete(bracket, visibleRoundIndex)) {
            return false;
        }
        return visibleRoundIndex < bracket.rounds.length - 1;
    }

    function shouldShowMatchInRoundView(match) {
        if (!match) {
            return false;
        }
        if (isMatchCompleted(match) || isMatchReady(match)) {
            return true;
        }
        return match.teamA != null || match.teamB != null;
    }

    w.CRBracketEngine = {
        nextPowerOfTwo: nextPowerOfTwo,
        roundLabels: roundLabels,
        matchKey: matchKey,
        emptyMatch: emptyMatch,
        createBracket: createBracket,
        findMatch: findMatch,
        setWinner: setWinner,
        isMatchReady: isMatchReady,
        isMatchCompleted: isMatchCompleted,
        isRoundComplete: isRoundComplete,
        findActiveRoundIndex: findActiveRoundIndex,
        getRoundLabel: getRoundLabel,
        getActiveMatchesInRound: getActiveMatchesInRound,
        canAdvanceToNextRound: canAdvanceToNextRound,
        shouldShowMatchInRoundView: shouldShowMatchInRoundView,
        getActiveMatches: getActiveMatches,
        getChampion: getChampion,
        propagateWinners: propagateWinners,
        resolveBye: resolveBye
    };
})(window);
