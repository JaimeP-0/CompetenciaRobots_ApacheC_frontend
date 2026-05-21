/**
 * Formulario de login #/admin/login (API PHP o mock si adminLoginMock).
 */
(function (w) {
    'use strict';

    var Sesion = w.CRAdminSesion;
    var LoginMock = w.CRAdminLoginMock;

    function cfg() {
        return w.CR_CONFIG || w.CR_APP || {};
    }

    function loginRequest(usuario, password) {
        if (cfg().adminLoginMock && LoginMock) {
            return LoginMock.login(usuario, password);
        }
        if (!w.CRApi || typeof w.CRApi.postLogin !== 'function') {
            return Promise.reject(new Error('No hay API de login configurada.'));
        }
        return w.CRApi.postLogin({ usuario: usuario, password: password });
    }

    function initAdminLogin(outlet) {
        var root = outlet.querySelector('#admin-login-root');
        var form = outlet.querySelector('#f-admin-login');
        var inputUser = outlet.querySelector('#admin-usuario');
        var inputPass = outlet.querySelector('#admin-password');
        var errEl = outlet.querySelector('#admin-login-error');
        var btn = outlet.querySelector('#btn-admin-login');
        if (!root || !form || !inputUser || !inputPass || !Sesion) {
            return function () {};
        }

        function setError(msg) {
            if (!errEl) {
                return;
            }
            if (msg) {
                errEl.textContent = msg;
                errEl.classList.remove('hidden');
            } else {
                errEl.textContent = '';
                errEl.classList.add('hidden');
            }
        }

        function setLoading(on) {
            if (btn) {
                btn.disabled = !!on;
                btn.setAttribute('aria-busy', on ? 'true' : 'false');
            }
            inputUser.disabled = !!on;
            inputPass.disabled = !!on;
        }

        function onSubmit(e) {
            e.preventDefault();
            setError('');
            var usuario = String(inputUser.value || '').trim();
            var password = String(inputPass.value || '');
            if (!usuario || !password) {
                setError('Escribe usuario y contraseña.');
                return;
            }
            setLoading(true);
            loginRequest(usuario, password)
                .then(function (res) {
                    Sesion.save({
                        token: res.token || 'mock-admin-local',
                        usuario: res.usuario || usuario,
                        rol: 'admin'
                    });
                    w.location.hash = '#/admin';
                })
                .catch(function (err) {
                    setError((err && err.message) || 'Usuario o contraseña incorrectos.');
                })
                .finally(function () {
                    setLoading(false);
                });
        }

        form.addEventListener('submit', onSubmit, false);
        return function cleanup() {
            form.removeEventListener('submit', onSubmit, false);
        };
    }

    w.CRAdminVistaLogin = { init: initAdminLogin };
})(window);
