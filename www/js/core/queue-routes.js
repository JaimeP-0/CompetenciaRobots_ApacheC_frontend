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

    function staffRole(session) {
        if (!session) {
            return '';
        }
        return String(session.role || '').toLowerCase();
    }

    function staffWorkspaceHash(session) {
        if (!session) {
            return '#/login';
        }
        var role = staffRole(session);
        if (role === 'admin' || role === 'dev') {
            return '#/admin';
        }
        if (role === 'visitante') {
            return '#/dashboard';
        }
        if (role === 'registro') {
            return '#/registro';
        }
        if (role === 'juez' || role === 'arbitro') {
            return matchHashForScope(staffScope(session));
        }
        return '#/login';
    }

    function staffMayUseRegistro(session) {
        return staffRole(session) === 'registro';
    }

    function staffIsMatchSpectator(session) {
        return staffRole(session) === 'juez';
    }

    function isPublicCatalogRoute(route) {
        var r = String(route || '').split('?')[0];
        return (
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
        var role = staffRole(session);

        if (role === 'admin' || role === 'dev') {
            return true;
        }

        if (r.indexOf('/admin') === 0) {
            return false;
        }

        if (role === 'visitante') {
            return isPublicCatalogRoute(r) && r !== '/registro' && r.indexOf('/registro') !== 0;
        }

        if (role === 'juez') {
            return r === '/match' || r.indexOf('/match/') === 0;
        }

        if (role === 'registro') {
            return r === '/registro' || r.indexOf('/registro') === 0;
        }

        if (role === 'arbitro') {
            return r === '/match' || r.indexOf('/match/') === 0;
        }

        return isPublicCatalogRoute(r);
    }

    /** A dónde mandar si la ruta no está permitida para el rol. */
    function staffForbiddenRedirect(session) {
        if (!session) {
            return '#/login';
        }
        var role = staffRole(session);
        if (role === 'admin' || role === 'dev') {
            return '#/admin';
        }
        if (role === 'visitante') {
            return '#/dashboard';
        }
        if (role === 'registro') {
            return '#/registro';
        }
        if (role === 'juez' || role === 'arbitro') {
            return matchHashForScope(staffScope(session));
        }
        return '#/login';
    }

    w.CRQueueRoutes = {
        matchHashForScope: matchHashForScope,
        scopeFromRouteSegment: scopeFromRouteSegment,
        staffRole: staffRole,
        staffWorkspaceHash: staffWorkspaceHash,
        staffMayUseRegistro: staffMayUseRegistro,
        staffIsMatchSpectator: staffIsMatchSpectator,
        staffMayAccessRoute: staffMayAccessRoute,
        staffForbiddenRedirect: staffForbiddenRedirect
    };
})(window);
