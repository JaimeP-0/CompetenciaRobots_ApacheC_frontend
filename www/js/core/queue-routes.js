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

    function staffScope(session) {
        if (!session) {
            return '';
        }
        if (session.scope) {
            return normalizeScope(session.scope);
        }
        if (w.CRStaffSesion && typeof w.CRStaffSesion.queueScope === 'function') {
            return normalizeScope(w.CRStaffSesion.queueScope(session));
        }
        return '';
    }

    function staffWorkspaceHash(session) {
        if (!session) {
            return '#/dashboard';
        }
        var role = String(session.role || '').toLowerCase();
        if (role === 'admin' || role === 'dev') {
            return '#/admin';
        }
        if (role === 'visitante') {
            return '#/dashboard';
        }
        if (role === 'juez' || role === 'registro') {
            return '#/registro';
        }
        if (role === 'arbitro') {
            return matchHashForScope(staffScope(session));
        }
        return matchHashForScope(staffScope(session));
    }

    function isPublicCatalogRoute(route) {
        var r = String(route || '').split('?')[0];
        return (
            r === '/inicio' ||
            r === '/login' ||
            r === '/dashboard' ||
            r === '/visitante' ||
            r === '/ranking' ||
            r === '/categorias' ||
            r === '/equipos' ||
            r === '/validados' ||
            r.indexOf('/categoria/') === 0 ||
            r.indexOf('/equipo/') === 0 ||
            r.indexOf('/match') === 0
        );
    }

    /** Rutas staff permitidas según rol (prefijo de hash sin #). */
    function staffMayAccessRoute(route, session) {
        if (!session || !session.username) {
            return true;
        }
        var r = String(route || '').split('?')[0];
        var role = String(session.role || '').toLowerCase();

        if (role === 'admin' || role === 'dev') {
            return true;
        }

        if (r.indexOf('/admin') === 0) {
            return false;
        }

        if (role === 'visitante') {
            return isPublicCatalogRoute(r) && r !== '/registro' && r.indexOf('/registro') !== 0;
        }

        if (role === 'juez' || role === 'registro') {
            if (r.indexOf('/registro') === 0 || r === '/registro') {
                return true;
            }
            return isPublicCatalogRoute(r);
        }

        if (role === 'arbitro') {
            if (r.indexOf('/registro') === 0 || r === '/registro') {
                return false;
            }
            return isPublicCatalogRoute(r);
        }

        return isPublicCatalogRoute(r) || r.indexOf('/registro') === 0;
    }

    /** A dónde mandar si la ruta no está permitida para el rol. */
    function staffForbiddenRedirect(session) {
        if (!session) {
            return '#/login';
        }
        var role = String(session.role || '').toLowerCase();
        if (role === 'admin' || role === 'dev') {
            return '#/admin';
        }
        if (role === 'visitante') {
            return '#/dashboard';
        }
        if (role === 'juez' || role === 'registro') {
            return '#/registro';
        }
        if (role === 'arbitro') {
            return matchHashForScope(staffScope(session));
        }
        return '#/inicio';
    }

    w.CRQueueRoutes = {
        matchHashForScope: matchHashForScope,
        scopeFromRouteSegment: scopeFromRouteSegment,
        staffWorkspaceHash: staffWorkspaceHash,
        staffMayAccessRoute: staffMayAccessRoute
    };
})(window);
