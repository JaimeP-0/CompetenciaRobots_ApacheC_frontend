(function (w) {
    'use strict';

    var cfg = {
        basePath: '',
        rutaRegistroJueces: '/jueces/registro',
        categorias: Object.freeze(['minisumo', 'seguidor']),
        categoriasDinamicas: [],
        reglasRango: Object.freeze([1, 2, 3]),
        /** Base directa: http://100.124.252.101:8080/categorias (sin /api) */
        apiRemoteBase: 'http://100.124.252.101:8080',
        useMockApi: false,
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
    var host = String(loc.hostname || '').toLowerCase();
    var isLocalWeb =
        loc.protocol &&
        loc.protocol.indexOf('http') === 0 &&
        (host === 'localhost' || host === '127.0.0.1');

    /**
     * localhost: apiBase vacío → /partidas pasa por el proxy de cordova run browser
     * y llega a apiRemoteBase (p. ej. http://100.124.252.101:8080/partidas).
     * En dispositivo: apiBase = apiRemoteBase (llamada directa, sin CORS del navegador).
     */
    cfg.apiBase = isLocalWeb ? '' : cfg.apiRemoteBase;
    cfg.categoriasPath = '/categorias';
    cfg.equiposPath = '/equipos';
    cfg.reglasPath = '/reglas';
    cfg.miembrosPath = '/miembros';
    cfg.robotsPath = '/robots';
    cfg.registroPath = '/registro';
    cfg.validacionesPath = '/validaciones';
    cfg.partidasPath = '/partidas';
    cfg.partidasResultadosPath = '/resultados';

    w.CR_CONFIG = cfg;
    w.CR_APP = cfg;
})(window);
