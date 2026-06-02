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
        return w.CRApi.postLogin({ username: u, password: p }).then(function (res) {
            var body = res && res.body ? res.body : res;
            if (!body || (body.id == null && !body.username)) {
                throw new Error('Respuesta de login inválida.');
            }
            var uname = String((body.username || body.usuario || u)).trim();
            var role = body.role ? String(body.role).toLowerCase() : uname.toLowerCase();
            var session = {
                username: uname,
                display_name: String(body.name || body.display_name || body.nombre || uname).trim(),
                role: role,
                scope: body.scope ? String(body.scope) : '',
                category: body.category ? String(body.category) : '',
                token: body.token
                    ? String(body.token)
                    : 'sess:' + String(body.id != null ? body.id : uname)
            };
            if (Sesion) {
                Sesion.save(session);
            }
            if (session.scope && w.CRTeamOrigin) {
                w.CRTeamOrigin.storeQueueScope(session.scope);
            }
            return { ok: true, session: session };
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
            w.location.hash = '#/visitante';
            return;
        }
        if (QueueRoutes && typeof QueueRoutes.staffWorkspaceHash === 'function') {
            w.location.hash = QueueRoutes.staffWorkspaceHash(s);
            return;
        }
        var role = String(s.role || '').toLowerCase();
        if (role === 'juez' || role === 'registro') {
            w.location.hash = '#/registro';
            return;
        }
        if (role === 'admin') {
            w.location.hash = '#/admin';
            return;
        }
        w.location.hash = '#/match/internos';
    }

    w.CRStaffAuth = {
        login: login,
        logout: logout,
        redirectAfterLogin: redirectAfterLogin
    };
})(window);
