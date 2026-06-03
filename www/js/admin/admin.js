/**
 * Administración: sesión, login, panel y gestión.
 */
(function (w) {
    'use strict';

    var Sesion = w.CRAdminSesion;
    var Login = w.CRAdminVistaLogin;
    var Panel = w.CRAdminVistaPanel;
    var Cats = w.CRAdminVistaCategorias;
    var Equipos = w.CRAdminVistaEquipos;

    if (!Sesion || !Login || !Panel || !w.CRAdminLoginMock || !w.CRAdminAlmacen) {
        throw new Error('Carga admin/* (sesion, login-mock, almacen, vistas) antes de admin.js');
    }

    var loginCleanup = null;
    var panelCleanup = null;
    var catsCleanup = null;
    var equiposCleanup = null;

    var ADMIN_VIEWS = ['admin/panel', 'admin/categorias', 'admin/equipos'];
    var ADMIN_LOGIN_VIEW = 'admin/login';

    function clearLogin() {
        if (typeof loginCleanup === 'function') {
            loginCleanup();
            loginCleanup = null;
        }
    }

    function clearPanel() {
        if (typeof panelCleanup === 'function') {
            panelCleanup();
            panelCleanup = null;
        }
    }

    function clearCats() {
        if (typeof catsCleanup === 'function') {
            catsCleanup();
            catsCleanup = null;
        }
    }

    function clearEquipos() {
        if (typeof equiposCleanup === 'function') {
            equiposCleanup();
            equiposCleanup = null;
        }
    }

    w.CRAdmin = {
        isLoggedIn: Sesion.isLoggedIn,
        isAdminView: function (viewName) {
            return ADMIN_VIEWS.indexOf(viewName) !== -1;
        },
        isAdminLoginView: function (viewName) {
            return viewName === ADMIN_LOGIN_VIEW;
        },
        logout: function () {
            Sesion.clear();
        },
        logoutAndHome: function () {
            Sesion.clear();
            if (w.CRNavHistory && typeof w.CRNavHistory.reset === 'function') {
                w.CRNavHistory.reset();
            }
            w.location.hash = '#/login';
        },
        initLogin: function (outlet) {
            clearPanel();
            clearCats();
            clearEquipos();
            loginCleanup = Login.init(outlet);
        },
        initPanel: function (outlet) {
            clearLogin();
            clearCats();
            clearEquipos();
            panelCleanup = Panel.init(outlet);
        },
        initCategorias: function (outlet) {
            clearLogin();
            clearPanel();
            clearEquipos();
            if (Cats) {
                catsCleanup = Cats.init(outlet);
            }
        },
        initEquipos: function (outlet) {
            clearLogin();
            clearPanel();
            clearCats();
            if (Equipos) {
                equiposCleanup = Equipos.init(outlet);
            }
        },
        teardown: function () {
            clearLogin();
            clearPanel();
            clearCats();
            clearEquipos();
        }
    };
})(window);
