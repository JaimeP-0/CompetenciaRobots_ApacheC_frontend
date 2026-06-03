/**
 * Barra / pie de sesión staff (árbitro / consulta juez) con cerrar sesión.
 */
(function (w) {
    'use strict';

    function roleLabel(role) {
        var r = String(role || '').toLowerCase();
        if (r === 'juez') {
            return 'Consulta (juez)';
        }
        if (r === 'registro') {
            return 'Registro';
        }
        if (r === 'arbitro') {
            return 'Árbitro';
        }
        if (r === 'admin') {
            return 'Admin';
        }
        if (r === 'dev') {
            return 'Desarrollo';
        }
        return r || 'Personal';
    }

    function sessionSummary(ses) {
        if (!ses || !ses.username) {
            return '';
        }
        var parts = [ses.display_name || ses.username, roleLabel(ses.role)];
        if (w.CRStaffSesion && typeof w.CRStaffSesion.assignmentSummary === 'function') {
            var assign = w.CRStaffSesion.assignmentSummary(ses);
            if (assign) {
                parts.push(assign);
            }
        }
        return parts.join(' · ');
    }

    function wireLogout(btn) {
        if (!btn || btn.getAttribute('data-cr-staff-logout-bound') === '1') {
            return;
        }
        btn.setAttribute('data-cr-staff-logout-bound', '1');
        btn.addEventListener('click', function () {
            if (w.CRStaffAuth && typeof w.CRStaffAuth.logoutAndLogin === 'function') {
                w.CRStaffAuth.logoutAndLogin();
            } else if (w.CRStaffAuth && typeof w.CRStaffAuth.logout === 'function') {
                w.CRStaffAuth.logout();
                w.location.hash = '#/login';
            }
        });
    }

    function bindStaffFoot(root) {
        var foot = root.querySelector('#cr-inicio-staff-foot');
        var labelEl = root.querySelector('#cr-inicio-staff-label');
        var btnLogout = root.querySelector('#cr-inicio-staff-logout');
        if (!foot || !btnLogout) {
            return;
        }

        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        var logged = !!(ses && ses.username);

        foot.classList.toggle('cr-inicio-staff-foot--empty', !logged);
        if (labelEl) {
            labelEl.textContent = logged ? sessionSummary(ses) : '';
        }
        btnLogout.classList.toggle('hidden', !logged);
        wireLogout(btnLogout);
    }

    function bindStaffBar(root) {
        root = root || w.document.getElementById('cr-outlet');
        if (!root) {
            return;
        }

        if (root.querySelector('#cr-inicio-staff-foot')) {
            bindStaffFoot(root);
            return;
        }

        var bar = root.querySelector('#cr-staff-bar');
        var labelEl = root.querySelector('#cr-staff-bar-label');
        var btnLogout = root.querySelector('#cr-staff-bar-logout');
        if (!bar || !btnLogout) {
            return;
        }

        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        var logged = !!(ses && ses.username);

        bar.classList.toggle('hidden', !logged);
        if (labelEl) {
            labelEl.textContent = logged ? sessionSummary(ses) : '';
        }
        wireLogout(btnLogout);

        if (logged && w.CRApi && typeof w.CRApi.fetchCategorias === 'function') {
            w.CRApi.fetchCategorias()
                .then(function () {
                    if (w.CRStaffSesion && typeof w.CRStaffSesion.refreshCategoryFromApi === 'function') {
                        w.CRStaffSesion.refreshCategoryFromApi();
                    }
                    var sesFresh = w.CRStaffSesion && w.CRStaffSesion.read();
                    if (labelEl && sesFresh) {
                        labelEl.textContent = sessionSummary(sesFresh);
                    }
                })
                .catch(function () {});
        }
    }

    w.CRStaffShell = {
        bind: bindStaffBar,
        roleLabel: roleLabel,
        sessionSummary: sessionSummary
    };
})(window);
