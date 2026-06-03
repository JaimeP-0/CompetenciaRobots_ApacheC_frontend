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

    function guardMatchRoute(route) {
        if (route !== '/match') {
            return null;
        }
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (ses && ses.scope && w.CRQueueRoutes && typeof w.CRQueueRoutes.matchHashForScope === 'function') {
            return w.CRQueueRoutes.matchHashForScope(ses.scope);
        }
        return '#/match/internos';
    }

    function staffLoggedIn() {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        return !!(ses && ses.username);
    }

    function guardAuthEntry(route) {
        var r = String(route || '').split('?')[0];
        if (r === '/' || r === '/inicio') {
            return '#/login';
        }
        if (staffLoggedIn()) {
            var ses = w.CRStaffSesion && w.CRStaffSesion.read();
            var role = ses && ses.role ? String(ses.role).toLowerCase() : '';
            if (role === 'registro') {
                if (r === '/login') {
                    return '#/registro';
                }
                if (r === '/match' || r.indexOf('/match/') === 0) {
                    return '#/registro';
                }
            }
            return null;
        }
        if (r === '/registro' || r.indexOf('/registro/') === 0) {
            return '#/login';
        }
        return null;
    }

    function stripLegacyQueryParams() {
        if (!w.location.search) {
            return;
        }
        try {
            w.history.replaceState(null, '', w.location.pathname + (w.location.hash || ''));
        } catch (ignore) {}
    }

    function guardStaffRoute(route) {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (!ses || !w.CRQueueRoutes || typeof w.CRQueueRoutes.staffMayAccessRoute !== 'function') {
            return null;
        }
        var r = String(route || '').split('?')[0];
        var role = String(ses.role || '').toLowerCase();
        if (role === 'registro' && (r === '/match' || r.indexOf('/match/') === 0)) {
            return '#/registro';
        }
        if (w.CRQueueRoutes.staffMayAccessRoute(route, ses)) {
            return null;
        }
        if (typeof w.CRQueueRoutes.staffForbiddenRedirect === 'function') {
            return w.CRQueueRoutes.staffForbiddenRedirect(ses);
        }
        return '#/login';
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
            var isLogin = name === 'public/login';
            var isVisitante = name === 'public/visitante';
            var isDiag = name === 'public/diag-feed';
            d.body.classList.toggle('cr-view-inicio', isLogin);
            d.body.classList.toggle('cr-view-inner', !isVisitante && !isLogin && !isDiag);
            d.documentElement.classList.toggle('cr-view-dashboard', isVisitante);
            d.body.classList.toggle('cr-view-dashboard', isVisitante);
            d.documentElement.classList.toggle('cr-view-diag', isDiag);
            d.body.classList.toggle('cr-view-diag', isDiag);
            var isAdminView =
                (Admin && Admin.isAdminLoginView(name)) || (Admin && Admin.isAdminView(name));
            d.documentElement.classList.toggle('cr-admin-active', isAdminView);
            outlet.removeAttribute('data-cr-outlet-mode');
            d.documentElement.classList.remove('cr-tablero-ultra-only');

            if (name === 'registro/registrar') {
                var regSes = w.CRStaffSesion && w.CRStaffSesion.read();
                if (
                    regSes &&
                    w.CRQueueRoutes &&
                    typeof w.CRQueueRoutes.staffMayUseRegistro === 'function' &&
                    !w.CRQueueRoutes.staffMayUseRegistro(regSes) &&
                    typeof w.CRQueueRoutes.staffForbiddenRedirect === 'function'
                ) {
                    w.location.hash = w.CRQueueRoutes.staffForbiddenRedirect(regSes);
                    return;
                }
                if (!RegistroLoader) {
                    Views.showError(outlet, new Error('Falta js/registro/cargar.js'));
                    return;
                }
                return RegistroLoader.ensureLoaded().then(function (Reg) {
                    var section = outlet.querySelector('#registrar-root') || outlet;
                    var boot = section.querySelector('#reg-loading-boot');
                    var form = section.querySelector('#f-registro-equipo');
                    var warmup =
                        w.CRApi && typeof w.CRApi.fetchCategorias === 'function'
                            ? w.CRApi.fetchCategorias().catch(function () {
                                  return [];
                              })
                            : Promise.resolve([]);
                    return w.CRUtil.withRegistroMinLoading(warmup).then(function (cats) {
                        if (boot) {
                            boot.classList.add('hidden');
                            boot.setAttribute('aria-hidden', 'true');
                            boot.setAttribute('aria-busy', 'false');
                        }
                        if (form) {
                            form.setAttribute('aria-busy', 'false');
                        }
                        var detalleHook = { fn: null };
                        var catCleanup = null;
                        if (Reg.initCategoriaRegistro) {
                            catCleanup = Reg.initCategoriaRegistro(outlet, {
                                categorias: cats,
                                onCategoriaChange: function () {
                                    if (w.CRUtil && typeof w.CRUtil.bumpDetalleFetchGen === 'function') {
                                        w.CRUtil.bumpDetalleFetchGen();
                                    }
                                    if (typeof detalleHook.fn === 'function') {
                                        detalleHook.fn(null);
                                    }
                                }
                            });
                        }
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
                            if (typeof catCleanup === 'function') {
                                catCleanup();
                            }
                            detalleHook.fn = null;
                        };
                        if (w.CRStaffShell && typeof w.CRStaffShell.bind === 'function') {
                            w.CRStaffShell.bind(outlet);
                        }
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

    function enforceRegistroHome() {
        var ses = w.CRStaffSesion && w.CRStaffSesion.read();
        if (!ses || String(ses.role || '').toLowerCase() !== 'registro') {
            return null;
        }
        var r = Router.normalize(w.location.hash);
        if (r === '/registro' || r.indexOf('/registro/') === 0) {
            return null;
        }
        if (r === '/match' || r.indexOf('/match/') === 0 || r === '/login') {
            return '#/registro';
        }
        return null;
    }

    function renderCurrentRoute() {
        stripLegacyQueryParams();
        var registroRedirect = enforceRegistroHome();
        if (registroRedirect) {
            w.location.hash = registroRedirect;
            return;
        }
        var route = Router.normalize(w.location.hash);
        var authRedirect = guardAuthEntry(route);
        if (authRedirect) {
            w.location.hash = authRedirect;
            return;
        }
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
        var matchRedirect = guardMatchRoute(route);
        if (matchRedirect) {
            w.location.hash = matchRedirect;
            return;
        }
        var adminRedirect = guardAdminRoute(resolved.view);
        if (adminRedirect) {
            w.location.hash = adminRedirect;
            return;
        }
        var staffRedirect = guardStaffRoute(route);
        if (staffRedirect) {
            w.location.hash = staffRedirect;
            return;
        }
        if (w.CRNavHistory && typeof w.CRNavHistory.onNavigate === 'function') {
            w.CRNavHistory.onNavigate(route);
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
        var matchJump = guardMatchRoute(normalized);
        if (matchJump) {
            normalized = Router.normalize(matchJump);
        }
        if (Router.normalize(w.location.hash) === normalized) {
            renderCurrentRoute();
            return;
        }
        w.location.hash = normalized.charAt(0) === '#' ? normalized : '#' + normalized;
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

    function onOutletSubmit(e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM' || !outlet || !outlet.contains(form)) {
            return;
        }
        if (form.id === 'f-staff-login' || form.id === 'f-registro-equipo') {
            e.preventDefault();
        }
        if (form.id === 'f-staff-login') {
            var submitStaff =
                w.CRCatalogViews && typeof w.CRCatalogViews.handleStaffLoginSubmit === 'function';
            if (submitStaff) {
                w.CRCatalogViews.handleStaffLoginSubmit(form, outlet);
            }
        }
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
        outlet.addEventListener('submit', onOutletSubmit, false);
        outlet.addEventListener('click', onOutletClick, false);
        if (!w.location.hash || w.location.hash === '#/') {
            w.location.hash = '/login';
        }
        renderCurrentRoute();
    }

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', boot, false);
    } else {
        boot();
    }
    d.addEventListener('deviceready', applyStatusBarLayout, false);
    d.addEventListener('deviceready', boot, false);
    w.addEventListener('hashchange', renderCurrentRoute, false);

    w.CRApp = {
        boot: boot,
        renderView: renderView,
        renderCurrentRoute: renderCurrentRoute
    };
})(window, document);
