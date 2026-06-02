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
            return '#/dashboard';
        }
        var role = String(session.role || '').toLowerCase();
        if (role === 'juez' || role === 'registro') {
            return '#/registro';
        }
        if (role === 'admin') {
            return '#/admin';
        }
        if (role === 'arbitro') {
            return matchHashForScope(session.scope);
        }
        return matchHashForScope(session.scope);
    }

    /** Rutas staff permitidas según rol (prefijo de hash sin #). */
    function staffMayAccessRoute(route, session) {
        if (!session || !session.username) {
            return true;
        }
        var r = String(route || '').split('?')[0];
        var role = String(session.role || '').toLowerCase();
        if (role === 'admin') {
            return true;
        }
        if (r.indexOf('/admin') === 0) {
            return false;
        }
        if (role === 'juez' || role === 'registro') {
            return (
                r === '/registro' ||
                r.indexOf('/registro') === 0 ||
                r === '/dashboard' ||
                r === '/visitante' ||
                r === '/validados' ||
                r.indexOf('/categoria/') === 0
            );
        }
        if (role === 'arbitro') {
            return (
                r.indexOf('/match') === 0 ||
                r === '/dashboard' ||
                r === '/visitante' ||
                r === '/ranking'
            );
        }
        return true;
    }

    w.CRQueueRoutes = {
        matchHashForScope: matchHashForScope,
        scopeFromRouteSegment: scopeFromRouteSegment,
        staffWorkspaceHash: staffWorkspaceHash,
        staffMayAccessRoute: staffMayAccessRoute
    };
})(window);
