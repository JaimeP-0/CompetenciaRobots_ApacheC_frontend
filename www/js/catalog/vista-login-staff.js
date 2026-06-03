/**
 * Login staff #/login
 */
(function (w) {
    'use strict';

    var Auth = w.CRStaffAuth;
    var Sesion = w.CRStaffSesion;

    function showLoginError(errEl, msg) {
        var text = msg || 'No se pudo iniciar sesión.';
        if (!errEl) {
            if (w.console && typeof w.console.warn === 'function') {
                w.console.warn('[CR login]', text);
            }
            return;
        }
        errEl.textContent = text;
        errEl.classList.remove('hidden');
        errEl.classList.add('is-visible');
        errEl.hidden = false;
        errEl.removeAttribute('hidden');
        errEl.style.display = 'block';
        errEl.setAttribute('aria-hidden', 'false');
    }

    function hideLoginError(errEl) {
        if (!errEl) {
            return;
        }
        errEl.textContent = '';
        errEl.classList.add('hidden');
        errEl.classList.remove('is-visible');
        errEl.hidden = true;
        errEl.style.display = 'none';
        errEl.setAttribute('aria-hidden', 'true');
    }

    function handleStaffLoginSubmit(form, outlet) {
        outlet = outlet || (form && form.closest('#cr-outlet')) || w.document.getElementById('cr-outlet');
        if (!outlet || !form) {
            return;
        }

        var errEl = outlet.querySelector('#staff-login-error');
        var btn = outlet.querySelector('#btn-staff-login');
        var inputUser = outlet.querySelector('#staff-usuario');
        var inputPass = outlet.querySelector('#staff-password');

        if (!inputUser || !inputPass) {
            showLoginError(errEl, 'No se cargó el formulario de acceso.');
            return;
        }
        if (!Auth || typeof Auth.login !== 'function') {
            showLoginError(errEl, 'Falta el módulo de autenticación. Recarga la página (Ctrl+F5).');
            return;
        }

        var usuario = String(inputUser.value || '').trim();
        var password = String(inputPass.value || '');
        hideLoginError(errEl);

        if (Auth && typeof Auth.logout === 'function') {
            Auth.logout();
        }
        if (w.CRNavHistory && typeof w.CRNavHistory.reset === 'function') {
            w.CRNavHistory.reset();
        }

        if (btn) {
            btn.disabled = true;
        }

        Auth.login(usuario, password)
            .then(function (res) {
                try {
                    Auth.redirectAfterLogin(res && res.session);
                } catch (redirectErr) {
                    showLoginError(errEl, (redirectErr && redirectErr.message) || 'No se pudo continuar tras el acceso.');
                }
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

    function bindActiveSessionUi(outlet) {
        if (!outlet || !Sesion || !Sesion.isLoggedIn()) {
            return;
        }
        var ses = Sesion.read();
        if (!ses) {
            return;
        }
        var lead = outlet.querySelector('.cr-page-lead');
        var role = String(ses.role || '').trim();
        var who = String(ses.display_name || ses.username || '').trim();
        if (lead) {
            lead.textContent =
                'Sesión activa: ' +
                who +
                (role ? ' (' + role + ')' : '') +
                '. Para cambiar de usuario, pulsa Cerrar sesión y vuelve a entrar.';
        }
        var skipBtn = outlet.querySelector('#btn-staff-skip-login');
        if (skipBtn) {
            skipBtn.textContent = 'Continuar con esta sesión';
            skipBtn.onclick = function (e) {
                e.preventDefault();
                if (Auth && typeof Auth.redirectAfterLogin === 'function') {
                    Auth.redirectAfterLogin();
                }
            };
        }
        var logoutBtn = outlet.querySelector('#btn-staff-logout-active');
        if (!logoutBtn && skipBtn && skipBtn.parentNode) {
            logoutBtn = w.document.createElement('button');
            logoutBtn.type = 'button';
            logoutBtn.id = 'btn-staff-logout-active';
            logoutBtn.className = 'cr-staff-login-skip cr-staff-login-skip--logout';
            logoutBtn.textContent = 'Cerrar sesión';
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (Auth && typeof Auth.logout === 'function') {
                    Auth.logout();
                }
                if (w.CRNavHistory && typeof w.CRNavHistory.reset === 'function') {
                    w.CRNavHistory.reset();
                }
                var oldLogout = outlet.querySelector('#btn-staff-logout-active');
                if (oldLogout) {
                    oldLogout.remove();
                }
                if (lead) {
                    lead.textContent = 'Personal del evento: usa el usuario que te asignaron.';
                }
                if (skipBtn) {
                    skipBtn.textContent = 'Continuar sin iniciar sesión — ver dashboard público';
                    skipBtn.onclick = null;
                }
                hideLoginError(outlet.querySelector('#staff-login-error'));
            }, false);
            skipBtn.parentNode.insertBefore(logoutBtn, skipBtn);
        }
    }

    function initStaffLogin(outlet) {
        if (!outlet) {
            return;
        }

        var form = outlet.querySelector('#f-staff-login');
        var errEl = outlet.querySelector('#staff-login-error');
        if (!form) {
            showLoginError(errEl, 'No se cargó el formulario de acceso.');
            return;
        }
        if (!Auth || typeof Auth.login !== 'function') {
            showLoginError(errEl, 'Falta el módulo de autenticación. Recarga la página (Ctrl+F5).');
        }
        hideLoginError(errEl);
        form.setAttribute('action', '');
        bindActiveSessionUi(outlet);
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.loginStaff = initStaffLogin;
    w.CRCatalogViews.handleStaffLoginSubmit = handleStaffLoginSubmit;
})(window);
