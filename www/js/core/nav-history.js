/**
 * Pila de navegación hash — el botón atrás vuelve a la pantalla anterior real.
 */
(function (w) {
    'use strict';

    var stack = [];
    var current = null;
    var suppressPush = false;
    var MAX = 48;

    function normalize(route) {
        if (w.CRRouter && typeof w.CRRouter.normalize === 'function') {
            return w.CRRouter.normalize(route);
        }
        var raw = String(route || '').replace(/^#/, '').trim();
        if (!raw) {
            return '/';
        }
        return raw.charAt(0) === '/' ? raw : '/' + raw;
    }

    function onNavigate(nextRoute) {
        nextRoute = normalize(nextRoute);
        if (suppressPush) {
            suppressPush = false;
            current = nextRoute;
            return;
        }
        if (current != null && current !== nextRoute) {
            stack.push(current);
            if (stack.length > MAX) {
                stack.shift();
            }
        }
        current = nextRoute;
    }

    function staffLoggedIn() {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        return !!(ses && ses.username);
    }

    function resolveFallback(fallback) {
        fallback = normalize(fallback || '/login');
        if (fallback === '/' || fallback === '/inicio') {
            return '/login';
        }
        if (staffLoggedIn() && fallback === '/login') {
            return '/login';
        }
        return fallback;
    }

    function isBlockedBackTarget(route) {
        route = normalize(route);
        if (staffLoggedIn() && (route === '/login' || route === '/')) {
            return true;
        }
        var Admin = w.CRAdmin;
        if (!Admin) {
            return false;
        }
        if (Admin.isLoggedIn && Admin.isLoggedIn()) {
            return route === '/admin/login';
        }
        return route === '/admin' || route === '/admin/categorias' || route === '/admin/equipos';
    }

    /** /match redirige al scope (ej. /match/externos); no debe ser destino del botón atrás. */
    function isMatchAliasBounce(route) {
        route = normalize(route);
        if (route !== '/match') {
            return false;
        }
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (!ses || !ses.scope || !w.CRQueueRoutes || typeof w.CRQueueRoutes.matchHashForScope !== 'function') {
            return false;
        }
        var scoped = normalize(w.CRQueueRoutes.matchHashForScope(ses.scope));
        return scoped === normalize(current);
    }

    function isStaffForbiddenBackTarget(route) {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (!ses || !ses.username || !w.CRQueueRoutes || typeof w.CRQueueRoutes.staffMayAccessRoute !== 'function') {
            return false;
        }
        return !w.CRQueueRoutes.staffMayAccessRoute(route, ses);
    }

    function isBadBackTarget(route) {
        return isBlockedBackTarget(route) || isMatchAliasBounce(route) || isStaffForbiddenBackTarget(route);
    }

    function back(fallback) {
        fallback = resolveFallback(fallback);
        var target = stack.length ? stack.pop() : fallback;
        var guard = 0;
        while (isBadBackTarget(target) && guard < MAX) {
            target = stack.length ? stack.pop() : fallback;
            guard += 1;
        }
        suppressPush = true;
        current = target;
        w.location.hash = target;
    }

    function reset() {
        stack = [];
        current = null;
        suppressPush = false;
    }

    w.CRNavHistory = {
        onNavigate: onNavigate,
        back: back,
        reset: reset,
        peek: function () {
            return stack.length ? stack[stack.length - 1] : null;
        }
    };
})(window);
