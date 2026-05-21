/**
 * Login de admin temporal: solo validación local (sin POST /login).
 */
(function (w) {
    'use strict';

    function cfg() {
        return w.CR_CONFIG || w.CR_APP || {};
    }

    function login(usuario, password) {
        var app = cfg();
        if (!app.adminLoginMock) {
            return Promise.reject(new Error('El login mock de admin está desactivado.'));
        }
        var esperadoUser = String(app.adminMockUsuario || 'admin').trim();
        var esperadoPass = String(app.adminMockPassword || 'admin');
        var u = String(usuario || '').trim();
        var p = String(password || '');
        return new Promise(function (resolve, reject) {
            w.setTimeout(function () {
                if (u === esperadoUser && p === esperadoPass) {
                    resolve({
                        ok: true,
                        token: 'mock-admin-local',
                        usuario: u,
                        rol: 'admin'
                    });
                } else {
                    reject(new Error('Usuario o contraseña incorrectos.'));
                }
            }, 180);
        });
    }

    w.CRAdminLoginMock = { login: login };
})(window);
