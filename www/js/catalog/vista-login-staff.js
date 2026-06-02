/**
 * Login staff #/login
 */
(function (w) {
    'use strict';

    var Auth = w.CRStaffAuth;
    var Sesion = w.CRStaffSesion;

    function initStaffLogin(outlet) {
        var form = outlet.querySelector('#f-staff-login');
        if (!form || !Auth) {
            return;
        }

        if (Sesion && Sesion.isLoggedIn()) {
            Auth.redirectAfterLogin();
            return;
        }

        var errEl = outlet.querySelector('#staff-login-error');
        var btn = outlet.querySelector('#btn-staff-login');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var usuario =
                (outlet.querySelector('#staff-usuario') && outlet.querySelector('#staff-usuario').value) || '';
            var password =
                (outlet.querySelector('#staff-password') && outlet.querySelector('#staff-password').value) || '';
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
                    if (errEl) {
                        errEl.textContent = (err && err.message) || 'No se pudo iniciar sesión.';
                        errEl.classList.remove('hidden');
                    }
                })
                .finally(function () {
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.loginStaff = initStaffLogin;
})(window);
