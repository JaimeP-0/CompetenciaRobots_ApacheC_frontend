/**
 * Sesión staff (jueces / árbitros) en sessionStorage.
 */
(function (w) {
    'use strict';

    var STORAGE_KEY = 'cr_staff_sesion';

    function read() {
        try {
            var raw = w.sessionStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            var data = JSON.parse(raw);
            if (!data || !data.username) {
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

    w.CRStaffSesion = {
        read: read,
        save: save,
        clear: clear,
        isLoggedIn: isLoggedIn
    };
})(window);
