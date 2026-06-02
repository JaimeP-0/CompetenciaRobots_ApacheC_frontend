/**
 * Login staff — delega en POST /login (Go). Sin validación local ni usuarios en el front.
 */
(function (w) {
    'use strict';

    var Sesion = w.CRStaffSesion;
    var QueueRoutes = w.CRQueueRoutes;

    function login(username, password) {
        var u = String(username || '').trim();
        var p = String(password || '');
        if (!u || !p) {
            return Promise.reject(new Error('Usuario y contraseña son obligatorios.'));
        }
        if (!w.CRApi || typeof w.CRApi.postLogin !== 'function') {
            return Promise.reject(
                new Error('El login aún no está conectado. El backend debe exponer POST /login.')
            );
        }
        if (!Sesion || typeof Sesion.parseFromLogin !== 'function') {
            return Promise.reject(new Error('Falta staff-sesion.js'));
        }
        return w.CRApi.postLogin({ username: u, password: p }).then(function (res) {
            var body = res && res.body ? res.body : res;
            var session;
            try {
                session = Sesion.parseFromLogin(body, u);
            } catch (parseErr) {
                return Promise.reject(
                    parseErr || new Error('Respuesta de login inválida del servidor.')
                );
            }
            Sesion.save(session);
            syncAdminSession(session);
            var scope = Sesion.queueScope(session);
            if (scope && w.CRTeamOrigin) {
                w.CRTeamOrigin.storeQueueScope(scope);
            }
            return { ok: true, session: session };
        });
    }

    function syncAdminSession(session) {
        if (!session || !w.CRAdminSesion || typeof w.CRAdminSesion.save !== 'function') {
            return;
        }
        var role = String(session.role || '').toLowerCase();
        if (role !== 'admin' && role !== 'dev') {
            return;
        }
        w.CRAdminSesion.save({
            token: session.token || 'staff:' + session.username,
            usuario: session.username,
            rol: role
        });
    }

    function logout() {
        if (Sesion) {
            Sesion.clear();
        }
    }

    function redirectAfterLogin(session) {
        var s = session || (Sesion && Sesion.read());
        if (!s) {
            w.location.hash = '#/dashboard';
            return;
        }
        if (QueueRoutes && typeof QueueRoutes.staffWorkspaceHash === 'function') {
            w.location.hash = QueueRoutes.staffWorkspaceHash(s);
            return;
        }
        w.location.hash = '#/dashboard';
    }

    w.CRStaffAuth = {
        login: login,
        logout: logout,
        redirectAfterLogin: redirectAfterLogin
    };
})(window);
