/**
 * Interno vs externo según escuela del equipo.
 * Interno: nombre completo exacto (sin acentos) o campo de escuela exactamente UTNC o UT.
 */
(function (w) {
    'use strict';

    var FULL_NAMES_NORMALIZED = ['universidad tecnologica del norte de coahuila'];

    var STORAGE_KEY = 'cr-queue-scope';
    var GUEST_SCHOOL_KEY = 'cr-guest-school';

    function stripAccents(s) {
        return String(s || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function normalizeSchoolText(school) {
        return stripAccents(String(school || '').trim())
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function isInternalSchool(school) {
        var n = normalizeSchoolText(school);
        if (!n) {
            return false;
        }
        var i;
        for (i = 0; i < FULL_NAMES_NORMALIZED.length; i++) {
            if (n === FULL_NAMES_NORMALIZED[i]) {
                return true;
            }
        }
        return n === 'utnc' || n === 'ut';
    }

    function classifySchool(school) {
        return isInternalSchool(school) ? 'internal' : 'external';
    }

    function isTruthyBool(v) {
        if (v === true || v === 1) {
            return true;
        }
        if (v === false || v === 0) {
            return false;
        }
        if (typeof v === 'string') {
            var s = v.trim().toLowerCase();
            if (s === 'true' || s === '1') {
                return true;
            }
            if (s === 'false' || s === '0') {
                return false;
            }
        }
        return null;
    }

    function scopeFromIsInternal(isInternal) {
        var t = isTruthyBool(isInternal);
        if (t === null) {
            return '';
        }
        return t ? 'internal' : 'external';
    }

    /** Prioriza is_internal del API; si no viene, usa escuela. */
    function teamQueueScope(teamRef, teamId, teamsById, partida) {
        var team = teamRef;
        if (!team && teamId != null && teamsById) {
            team = teamsById[String(teamId)];
        }
        if (team && team.is_internal != null) {
            return scopeFromIsInternal(team.is_internal);
        }
        return classifySchool(schoolForTeamId(teamId, teamsById, partida));
    }

    function normalizeQueueScope(scope) {
        var s = scope != null ? String(scope).trim().toLowerCase() : '';
        if (s === 'internal' || s === 'interno' || s === 'int') {
            return 'internal';
        }
        if (s === 'external' || s === 'externo' || s === 'ext') {
            return 'external';
        }
        return '';
    }

    function queueScopeLabel(scope) {
        return normalizeQueueScope(scope) === 'internal' ? 'Internos (UTNC)' : 'Externos';
    }

    function readStoredQueueScope() {
        try {
            return normalizeQueueScope(w.sessionStorage.getItem(STORAGE_KEY));
        } catch (e) {
            return '';
        }
    }

    function storeQueueScope(scope) {
        var s = normalizeQueueScope(scope);
        if (!s) {
            return;
        }
        try {
            w.sessionStorage.setItem(STORAGE_KEY, s);
        } catch (e) {
            /* ignore */
        }
    }

    function readStoredGuestSchool() {
        try {
            return String(w.sessionStorage.getItem(GUEST_SCHOOL_KEY) || '').trim();
        } catch (e) {
            return '';
        }
    }

    function storeGuestSchool(school) {
        try {
            w.sessionStorage.setItem(GUEST_SCHOOL_KEY, String(school || '').trim());
        } catch (e) {
            /* ignore */
        }
    }

    /** Cola que corresponde a la escuela del visitante (UTNC → internos, otra → externos). */
    function guestQueueScopeFromSchool(school) {
        return classifySchool(school);
    }

    function schoolFromTeamRef(teamRef) {
        if (!teamRef) {
            return '';
        }
        return teamRef.school != null ? String(teamRef.school).trim() : '';
    }

    function schoolForTeamId(teamId, teamsById, partida) {
        if (teamId == null) {
            return '';
        }
        var key = String(teamId);
        if (teamsById && teamsById[key] && teamsById[key].school != null) {
            return String(teamsById[key].school).trim();
        }
        if (partida) {
            if (partida.team_a && String(partida.team_a.id) === key) {
                return schoolFromTeamRef(partida.team_a);
            }
            if (partida.team_b && String(partida.team_b.id) === key) {
                return schoolFromTeamRef(partida.team_b);
            }
        }
        return '';
    }

    function teamIdsInPartida(partida) {
        if (!partida) {
            return [];
        }
        var ids = [];
        var seen = {};
        function pushId(raw) {
            var n = Number(raw, 10);
            if (isNaN(n) || n <= 0 || seen[String(n)]) {
                return;
            }
            seen[String(n)] = true;
            ids.push(n);
        }
        (partida.queue || []).forEach(pushId);
        pushId(partida.team_a_id);
        pushId(partida.team_b_id);
        if (partida.team_a && partida.team_a.id != null) {
            pushId(partida.team_a.id);
        }
        if (partida.team_b && partida.team_b.id != null) {
            pushId(partida.team_b.id);
        }
        return ids;
    }

    /** Alcance de la partida; null si mezcla internos y externos o sin equipos. */
    function partidaQueueScope(partida, teamsById) {
        if (partida && partida.is_internal != null) {
            var fromMatch = scopeFromIsInternal(partida.is_internal);
            if (fromMatch) {
                return fromMatch;
            }
        }
        var ids = teamIdsInPartida(partida);
        if (!ids.length) {
            return null;
        }
        var scope = null;
        var i;
        for (i = 0; i < ids.length; i++) {
            var teamRef = null;
            if (partida) {
                if (partida.team_a && String(partida.team_a.id) === String(ids[i])) {
                    teamRef = partida.team_a;
                } else if (partida.team_b && String(partida.team_b.id) === String(ids[i])) {
                    teamRef = partida.team_b;
                }
            }
            var s = teamQueueScope(teamRef, ids[i], teamsById, partida);
            if (scope === null) {
                scope = s;
            } else if (scope !== s) {
                return null;
            }
        }
        return scope;
    }

    function partidaMatchesQueueScope(partida, scope, teamsById) {
        var wanted = normalizeQueueScope(scope);
        if (!wanted) {
            return true;
        }
        var ps = partidaQueueScope(partida, teamsById);
        return ps === wanted;
    }

    function filterPartidasByQueueScope(partidas, scope, teamsById) {
        var wanted = normalizeQueueScope(scope);
        if (!wanted) {
            return partidas || [];
        }
        return (partidas || []).filter(function (p) {
            return partidaMatchesQueueScope(p, wanted, teamsById);
        });
    }

    function filterTeamIdsByQueueScope(teamIds, scope, schoolByTeamId) {
        var wanted = normalizeQueueScope(scope);
        if (!wanted) {
            return teamIds || [];
        }
        schoolByTeamId = schoolByTeamId || {};
        return (teamIds || []).filter(function (tid) {
            var key = String(tid);
            var meta = schoolByTeamId[key];
            if (meta && typeof meta === 'object' && meta.is_internal != null) {
                return scopeFromIsInternal(meta.is_internal) === wanted;
            }
            var school = meta != null && typeof meta !== 'object' ? meta : '';
            return classifySchool(school) === wanted;
        });
    }

    w.CRTeamOrigin = {
        isInternalSchool: isInternalSchool,
        classifySchool: classifySchool,
        normalizeQueueScope: normalizeQueueScope,
        queueScopeLabel: queueScopeLabel,
        readStoredQueueScope: readStoredQueueScope,
        storeQueueScope: storeQueueScope,
        readStoredGuestSchool: readStoredGuestSchool,
        storeGuestSchool: storeGuestSchool,
        guestQueueScopeFromSchool: guestQueueScopeFromSchool,
        schoolForTeamId: schoolForTeamId,
        teamIdsInPartida: teamIdsInPartida,
        scopeFromIsInternal: scopeFromIsInternal,
        teamQueueScope: teamQueueScope,
        partidaQueueScope: partidaQueueScope,
        partidaMatchesQueueScope: partidaMatchesQueueScope,
        filterPartidasByQueueScope: filterPartidasByQueueScope,
        filterTeamIdsByQueueScope: filterTeamIdsByQueueScope
    };
})(window);
