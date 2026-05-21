/**
 * Sesión de administrador (sessionStorage).
 */
(function (w) {
    'use strict';

    var STORAGE_KEY = 'cr_admin_sesion';

    function read() {
        try {
            var raw = w.sessionStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            var data = JSON.parse(raw);
            if (!data || !data.token) {
                return null;
            }
            return data;
        } catch (ignore) {
            return null;
        }
    }

    function save(data) {
        w.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function clear() {
        w.sessionStorage.removeItem(STORAGE_KEY);
    }

    function isLoggedIn() {
        return !!read();
    }

    function getUsuario() {
        var s = read();
        return s && s.usuario ? String(s.usuario) : '';
    }

    function getToken() {
        var s = read();
        return s && s.token ? String(s.token) : '';
    }

    w.CRAdminSesion = {
        read: read,
        save: save,
        clear: clear,
        isLoggedIn: isLoggedIn,
        getUsuario: getUsuario,
        getToken: getToken
    };
})(window);
