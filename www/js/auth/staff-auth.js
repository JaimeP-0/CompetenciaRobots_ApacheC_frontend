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
            syncAdminSession(session);
            var loginRole = String(session.role || '').toLowerCase();
            var enrich =
                session.category_ids &&
                session.category_ids.length &&
                w.CRApi &&
                typeof w.CRApi.fetchCategorias === 'function'
                    ? w.CRApi.fetchCategorias().then(function () {
                          if (w.CRApiCategorias && typeof w.CRApiCategorias.labelById === 'function') {
                              var nm = w.CRApiCategorias.labelById(session.category_ids[0]);
                              if (
                                  nm &&
                                  w.CRStaffSesion &&
                                  typeof w.CRStaffSesion.isPlaceholderCategoryLabel === 'function' &&
                                  !w.CRStaffSesion.isPlaceholderCategoryLabel(nm)
                              ) {
                                  session.category = nm;
                              }
                          }
                          Sesion.save(session);
                      })
                    : Promise.resolve();
            return enrich.then(function () {
                if (!session.category_ids || !session.category_ids.length) {
                    Sesion.save(session);
                }
                if (loginRole === 'registro') {
                    try {
                        w.sessionStorage.removeItem('cr-queue-scope');
                    } catch (ignore) {}
                } else {
                    var scope = Sesion.queueScope(session);
                    if (scope && w.CRTeamOrigin) {
                        w.CRTeamOrigin.storeQueueScope(scope);
                    }
                }
                return { ok: true, session: session };
            });
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
        if (w.CRAdminSesion && typeof w.CRAdminSesion.clear === 'function') {
            w.CRAdminSesion.clear();
        }
        try {
            w.sessionStorage.removeItem('cr-queue-scope');
        } catch (ignore) {}
    }

    function logoutAndLogin() {
        logout();
        if (w.CRNavHistory && typeof w.CRNavHistory.reset === 'function') {
            w.CRNavHistory.reset();
        }
        w.location.hash = '#/login';
    }

    function redirectAfterLogin(session) {
        var s = session || (Sesion && Sesion.read());
        if (!s) {
            w.location.hash = '#/login';
            return;
        }
        var role = String(s.role || '').toLowerCase();
        function go(hash) {
            var h = hash.indexOf('#') === 0 ? hash : '#' + hash;
            try {
                w.location.replace(h);
            } catch (ignore) {
                w.location.hash = h;
            }
        }
        if (role === 'visitante') {
            go('#/visitante');
            return;
        }
        if (role === 'registro') {
            try {
                w.sessionStorage.removeItem('cr-queue-scope');
            } catch (ignore) {}
            go('#/registro');
            return;
        }
        if (role === 'admin' || role === 'dev') {
            go('#/admin');
            return;
        }
        if (QueueRoutes && typeof QueueRoutes.staffWorkspaceHash === 'function') {
            go(QueueRoutes.staffWorkspaceHash(s));
            return;
        }
        go('#/login');
    }

    w.CRStaffAuth = {
        login: login,
        logout: logout,
        logoutAndLogin: logoutAndLogin,
        redirectAfterLogin: redirectAfterLogin
    };
})(window);
