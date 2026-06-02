/**
 * Rutas hash para colas interno / externo (partidas, mesa de árbitro).
 */
(function (w) {
    'use strict';

    var Origin = w.CRTeamOrigin;

    function normalizeScope(scope) {
        return Origin && typeof Origin.normalizeQueueScope === 'function'
            ? Origin.normalizeQueueScope(scope)
            : '';
    }

    function matchHashForScope(scope) {
        var s = normalizeScope(scope);
        if (s === 'external') {
            return '#/match/externos';
        }
        if (s === 'internal') {
            return '#/match/internos';
        }
        return '#/match/internos';
    }

    function scopeFromRouteSegment(segment) {
        var s = String(segment || '').toLowerCase();
        if (s === 'externos' || s === 'externo' || s === 'external') {
            return 'external';
        }
        if (s === 'internos' || s === 'interno' || s === 'internal') {
            return 'internal';
        }
        return '';
    }

    function staffWorkspaceHash(session) {
        if (!session) {
            return '#/visitante';
        }
        var role = String(session.role || '').toLowerCase();
        if (role === 'juez' || role === 'registro') {
            return '#/registro';
        }
        if (role === 'admin') {
            return '#/admin';
        }
        return matchHashForScope(session.scope);
    }

    w.CRQueueRoutes = {
        matchHashForScope: matchHashForScope,
        scopeFromRouteSegment: scopeFromRouteSegment,
        staffWorkspaceHash: staffWorkspaceHash
    };
})(window);
