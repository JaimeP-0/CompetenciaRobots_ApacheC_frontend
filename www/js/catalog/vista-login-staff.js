/**
 * Login staff #/login
 */
(function (w) {
    'use strict';

    var Auth = w.CRStaffAuth;
    var Sesion = w.CRStaffSesion;

    function showLoginError(errEl, msg) {
        if (!errEl) {
            return;
        }
        errEl.textContent = msg || 'No se pudo iniciar sesión.';
        errEl.classList.remove('hidden');
    }

    function initStaffLogin(outlet) {
        var form = outlet.querySelector('#f-staff-login');
        var errEl = outlet.querySelector('#staff-login-error');
        var btn = outlet.querySelector('#btn-staff-login');
        var inputUser = outlet.querySelector('#staff-usuario');
        var inputPass = outlet.querySelector('#staff-password');

        if (!form || !inputUser || !inputPass) {
            showLoginError(errEl, 'No se cargó el formulario de acceso.');
            return;
        }
        if (!Auth || typeof Auth.login !== 'function') {
            showLoginError(errEl, 'Falta el módulo de autenticación. Recarga la página (Ctrl+F5).');
            return;
        }

        if (Sesion && Sesion.isLoggedIn()) {
            Auth.redirectAfterLogin();
            return;
        }

        function doLogin() {
            var usuario = String(inputUser.value || '').trim();
            var password = String(inputPass.value || '');
            if (errEl) {
                errEl.classList.add('hidden');
                errEl.textContent = '';
            }
            if (btn) {
                btn.disabled = true;
            }
            Auth.login(usuario, password)
                .then(function (res) {
                    Auth.redirectAfterLogin(res.session);
                })
                .catch(function (err) {
                    showLoginError(errEl, (err && err.message) || 'No se pudo iniciar sesión.');
                })
                .finally(function () {
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        }

        form.setAttribute('action', '');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            doLogin();
        });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.loginStaff = initStaffLogin;
})(window);
