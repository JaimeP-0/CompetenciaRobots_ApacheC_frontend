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
        fallback = normalize(fallback || '/inicio');
        if (fallback === '/') {
            return staffLoggedIn() ? '/inicio' : '/login';
        }
        if (staffLoggedIn() && fallback === '/login') {
            return '/inicio';
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

    function back(fallback) {
        fallback = resolveFallback(fallback);
        var target = stack.length ? stack.pop() : fallback;
        var guard = 0;
        while (isBlockedBackTarget(target) && guard < MAX) {
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
