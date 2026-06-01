/**
 * Panel #/admin (solo con sesión activa).
 */
(function (w) {
    'use strict';

    var Sesion = w.CRAdminSesion;

    function initAdminPanel(outlet) {
        if (w.CRAdminNav) {
            w.CRAdminNav.mount(outlet, 'panel');
        }
        var saludo = outlet.querySelector('#admin-saludo');
        var statEquipos = outlet.querySelector('#admin-stat-equipos');
        var statCategorias = outlet.querySelector('#admin-stat-categorias');
        if (!Sesion) {
            return function () {};
        }

        if (saludo) {
            var u = Sesion.getUsuario();
            if (u) {
                saludo.textContent = 'Hola, ' + u;
                saludo.classList.remove('hidden');
            } else {
                saludo.textContent = '';
                saludo.classList.add('hidden');
            }
        }

        function setStat(el, value, loading) {
            if (!el) {
                return;
            }
            if (loading) {
                el.textContent = '…';
                return;
            }
            el.textContent = value != null ? String(value) : '—';
        }

        setStat(statEquipos, null, true);
        setStat(statCategorias, null, true);

        var seedP =
            w.CRAdminAlmacen && typeof w.CRAdminAlmacen.ensureSeeded === 'function'
                ? w.CRAdminAlmacen.ensureSeeded()
                : Promise.resolve();
        seedP
            .then(function () {
                if (!w.CRApi) {
                    return null;
                }
                var teamsP =
                    typeof w.CRApi.fetchRegistroTeams === 'function'
                        ? w.CRApi.fetchRegistroTeams()
                        : Promise.resolve([]);
                var catsP =
                    typeof w.CRApi.fetchCategorias === 'function'
                        ? w.CRApi.fetchCategorias()
                        : Promise.resolve([]);
                return Promise.all([teamsP, catsP]);
            })
            .then(function (arr) {
                if (!arr) {
                    setStat(statEquipos, '—', false);
                    setStat(statCategorias, '—', false);
                    return;
                }
                setStat(statEquipos, (arr[0] || []).length, false);
                setStat(statCategorias, (arr[1] || []).length, false);
            })
            .catch(function () {
                setStat(statEquipos, '—', false);
                setStat(statCategorias, '—', false);
            });

        return function cleanup() {};
    }

    w.CRAdminVistaPanel = { init: initAdminPanel };
})(window);
