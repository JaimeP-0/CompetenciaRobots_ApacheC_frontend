/**
 * Arranque de la app: outlet, navegación hash, montaje de vistas.
 * Rutas → routes.js | Config → config.js | Registrar bajo demanda → registro/cargar.js | API → api/
 */
(function (w, d) {
    'use strict';

    var loaded = false;
    var outlet;
    var Router = w.CRRouter;
    var Views = w.CRViews;
    var RegistroLoader = w.CRRegistroLoader;
    var Admin = w.CRAdmin;

    if (!Router || !Views) {
        throw new Error('Faltan módulos core (router, views) o routes.js');
    }

    function guardAdminRoute(viewName) {
        if (!Admin) {
            return null;
        }
        if (Admin.isAdminView(viewName) && !Admin.isLoggedIn()) {
            return '#/admin/login';
        }
        if (Admin.isAdminLoginView(viewName) && Admin.isLoggedIn()) {
            return '#/admin';
        }
        return null;
    }

    function renderView(name, routeParams) {
        if (!outlet) {
            return Promise.reject(new Error('No existe #cr-outlet.'));
        }
        if (typeof w._crEquipoAcCleanup === 'function') {
            w._crEquipoAcCleanup();
            w._crEquipoAcCleanup = null;
        }
        if (Admin && typeof Admin.teardown === 'function') {
            Admin.teardown();
        }
        return Views.load(name).then(function (html) {
            outlet.innerHTML = html;
            if (w.CRIcons && typeof w.CRIcons.decorate === 'function') {
                w.CRIcons.decorate(outlet);
            }
            d.documentElement.classList.toggle('cr-registro-fit', name === 'registro/registrar');
            var isAdminView =
                (Admin && Admin.isAdminLoginView(name)) || (Admin && Admin.isAdminView(name));
            d.documentElement.classList.toggle('cr-admin-active', isAdminView);
            outlet.removeAttribute('data-cr-outlet-mode');
            d.documentElement.classList.remove('cr-tablero-ultra-only');

            if (name === 'registro/registrar') {
                if (!RegistroLoader) {
                    Views.showError(outlet, new Error('Falta js/registro/cargar.js'));
                    return;
                }
                return RegistroLoader.ensureLoaded().then(function (Reg) {
                    var section = outlet.querySelector('#registrar-root') || outlet;
                    var boot = section.querySelector('#reg-loading-boot');
                    var form = section.querySelector('#f-registro-equipo');
                    var warmup =
                        w.CRApi && typeof w.CRApi.fetchRegistroTeamsPendientes === 'function'
                            ? w.CRApi.fetchRegistroTeamsPendientes().catch(function () {
                                  return [];
                              })
                            : Promise.resolve();
                    return w.CRUtil.withRegistroMinLoading(warmup).then(function () {
                        if (boot) {
                            boot.classList.add('hidden');
                            boot.setAttribute('aria-hidden', 'true');
                            boot.setAttribute('aria-busy', 'false');
                        }
                        if (form) {
                            form.setAttribute('aria-busy', 'false');
                        }
                        var detalleHook = { fn: null };
                        var regPack = Reg.initFlow(outlet);
                        var ac = Reg.initEquipoAutocomplete(outlet, {
                            onDetalleChange: function (det) {
                                if (typeof detalleHook.fn === 'function') {
                                    detalleHook.fn(det);
                                }
                            },
                            cancelPendingDetalle: regPack.cancelPendingDetalle
                        });
                        detalleHook.fn = regPack.onDetalleChange;
                        w._crEquipoAcCleanup = function () {
                            ac();
                            regPack.cleanup();
                            detalleHook.fn = null;
                        };
                    });
                });
            }

            if (Admin && Admin.isAdminLoginView(name)) {
                Admin.initLogin(outlet);
                return;
            }
            if (name === 'admin/panel' && Admin) {
                Admin.initPanel(outlet);
                return;
            }
            if (name === 'admin/categorias' && Admin) {
                Admin.initCategorias(outlet);
                return;
            }
            if (name === 'admin/equipos' && Admin) {
                Admin.initEquipos(outlet);
                return;
            }

            Router.bootstrapCatalog(name, routeParams, outlet);
        });
    }

    function renderCurrentRoute() {
        var route = Router.normalize(w.location.hash);
        var redirect = Router.getRedirect(route);
        if (redirect) {
            if (redirect.indexOf('#') === 0) {
                w.location.hash = redirect;
            } else {
                w.location.hash = '#' + redirect;
            }
            return;
        }
        var resolved = Router.resolve(route);
        if (!resolved) {
            Views.showError(outlet, new Error('Ruta no encontrada: ' + route));
            return;
        }
        var adminRedirect = guardAdminRoute(resolved.view);
        if (adminRedirect) {
            w.location.hash = adminRedirect;
            return;
        }
        renderView(resolved.view, resolved.params).catch(function (err) {
            Views.showError(outlet, err);
        });
    }

    function onOutletClick(e) {
        var btn = e.target.closest('[data-route]');
        if (!btn || !outlet || !outlet.contains(btn)) {
            return;
        }
        var targetRoute = btn.getAttribute('data-route');
        if (!targetRoute) {
            return;
        }
        var normalized = Router.normalize(targetRoute);
        if (Router.normalize(w.location.hash) === normalized) {
            renderCurrentRoute();
            return;
        }
        w.location.hash = normalized;
    }

    function applyStatusBarLayout() {
        if (typeof w.StatusBar === 'undefined' || !w.StatusBar) {
            return;
        }
        try {
            w.StatusBar.overlaysWebView(false);
            w.StatusBar.backgroundColorByHexString('#f5f7fb');
            if (typeof w.StatusBar.styleDefault === 'function') {
                w.StatusBar.styleDefault();
            }
        } catch (ignore) {}
    }

    function boot() {
        if (loaded) {
            return;
        }
        outlet = d.getElementById('cr-outlet');
        if (!outlet) {
            return;
        }
        loaded = true;
        outlet.addEventListener('click', onOutletClick, false);
        if (!w.location.hash) {
            w.location.hash = '/';
        }
        renderCurrentRoute();
    }

    d.addEventListener('DOMContentLoaded', boot, false);
    d.addEventListener('deviceready', applyStatusBarLayout, false);
    d.addEventListener('deviceready', boot, false);
    w.addEventListener('hashchange', renderCurrentRoute, false);

    w.CRApp = {
        boot: boot,
        renderView: renderView,
        renderCurrentRoute: renderCurrentRoute
    };
})(window, document);
