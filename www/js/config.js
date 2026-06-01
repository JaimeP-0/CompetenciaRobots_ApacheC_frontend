(function (w) {
    'use strict';

    var cfg = {
        basePath: '',
        rutaRegistroJueces: '/jueces/registro',
        categorias: Object.freeze(['minisumo', 'seguidor']),
        categoriasDinamicas: [],
        reglasRango: Object.freeze([1, 2, 3]),
        /** Base del API en celular/APK. Debe ser alcanzable vía Tailscale/LAN. */
        apiRemoteBase: 'http://100.119.194.73:8080',
        registroEnvioHabilitado: true,
        categoryNamesById: {},
        registroMinLoadingMs: 0,
        debugApi: true,
        adminLoginMock: true,
        adminMockUsuario: 'admin',
        adminMockPassword: 'admin',
        adminDatosLocales: false,
        adminEquiposPorPagina: 15,
        adminEquiposPaginacion: 'cliente',
        /** #/categorias — id a mover. catalogCatPosicion = celular; catalogCatPosicionSm = PC (≥640px) */
        catalogCatPosicionId: null,
        catalogCatPosicion: null,
        catalogCatPosicionSm: null,
        /** #/equipos — id a mover. Posición 1 = primero, 4 = cuarto */
        catalogEquipoPosicionId: 2,
        catalogEquipoPosicion: 1,
        catalogEquipoPosicionSm: 4
    };

    cfg.moverUnoEnLista = function (items, moverId, posicion) {
        if (!items || !items.length || moverId == null || posicion == null) {
            return items;
        }
        var from = -1;
        var i;
        for (i = 0; i < items.length; i++) {
            if (String(items[i].id) === String(moverId)) {
                from = i;
                break;
            }
        }
        if (from < 0) {
            return items;
        }
        var to = Number(posicion, 10) - 1;
        if (isNaN(to) || to < 0) {
            to = 0;
        }
        if (to >= items.length) {
            to = items.length - 1;
        }
        if (from === to) {
            return items;
        }
        var out = items.slice();
        var el = out.splice(from, 1)[0];
        out.splice(to, 0, el);
        return out;
    };

    cfg.aplicarOrdenUnoEnLista = function (items, moverId, posMovil, posSm) {
        if (!items || moverId == null) {
            return items;
        }
        var pos = posMovil;
        if (w.matchMedia('(min-width: 640px)').matches) {
            pos = posSm != null ? posSm : null;
        }
        if (pos == null) {
            return items;
        }
        return cfg.moverUnoEnLista(items, moverId, pos);
    };

    cfg.listaCategorias = function () {
        return [].concat(Array.prototype.slice.call(cfg.categorias), cfg.categoriasDinamicas || []);
    };

    cfg.listaEquipos = function () {
        return [].concat(Array.prototype.slice.call(cfg.equipos), cfg.equiposDinamicos || []);
    };

    var loc = w.location || {};
    var port = String(loc.port || '');
    var platformId = w.cordova && w.cordova.platformId;
    var devPort = String(w.CR_DEV_SERVER_PORT || '8000');
    /**
     * Solo el dev-server del navegador (:8000 o platform browser) usa apiBase vacío (proxy).
     * Android/iOS cargan desde https://localhost sin puerto 8000 → apiRemoteBase directo.
     * (Antes localhost rompía el celular: fetch a https://localhost/categorias)
     */
    var isDevBrowserProxy =
        platformId === 'browser' ||
        (loc.protocol === 'http:' &&
            platformId !== 'android' &&
            platformId !== 'ios' &&
            port === devPort);

    cfg.apiBase = isDevBrowserProxy ? '' : cfg.apiRemoteBase;
    cfg.categoriasPath = '/categorias';
    cfg.equiposPath = '/equipos';
    cfg.reglasPath = '/reglas';
    cfg.miembrosPath = '/miembros';
    cfg.robotsPath = '/robots';
    cfg.registroPath = '/registro';
    cfg.validacionesPath = '/validaciones';
    cfg.partidasPath = '/partidas';
    cfg.partidasResultadosPath = '/resultados';
        cfg.bracketsPath = '/brackets';

        w.CR_CONFIG = cfg;
    w.CR_APP = cfg;
})(window);
