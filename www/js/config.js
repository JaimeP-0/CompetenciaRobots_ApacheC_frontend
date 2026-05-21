/**
 * Configuración de la app (API, flags, rutas de backend).
 * Alias legacy: window.CR_APP (api.js y módulos viejos).
 */
(function (w) {
    'use strict';

    var cfg = {
        basePath: '',
        rutaRegistroJueces: '/jueces/registro',
        categorias: Object.freeze(['minisumo', 'seguidor']),
        categoriasDinamicas: [],
        reglasRango: Object.freeze([1, 2, 3]),
        /**
         * URL del API PHP en el host (carpeta backend/php). Sin barra final.
         * Ejemplo: 'https://tudominio.com/api'
         * En PC con PHP local: 'http://127.0.0.1:8080' + npm run browser (proxy /api)
         */
        apiRemoteBase: 'https://dimgrey-ibex-191607.hostingersite.com/api',
        /**
         * En localhost: true = llama directo a Hostinger (sin proxy /api).
         * Evita 502 si CR_API_TARGET o cordova proxy apuntan al servidor viejo.
         */
        apiDirectEnLocalhost: true,
        forceDirectApi: false,
        useMockApi: false,
        registroEnvioHabilitado: true,
        categoryNamesById: {},
        registroMinLoadingMs: 0,
        debugApi: true,
        /** true = solo el login admin es local (admin/admin); el CRUD sigue en MySQL. */
        adminLoginMock: true,
        adminMockUsuario: 'admin',
        adminMockPassword: 'admin',
        /** false = todo admin y catálogo leen/escriben en la base de datos. */
        adminDatosLocales: false,
        adminEquiposPorPagina: 15,
        /** 'servidor' = paginación desde MySQL (recomendado para el video). */
        adminEquiposPaginacion: 'servidor'
    };

    cfg.listaCategorias = function () {
        return [].concat(Array.prototype.slice.call(cfg.categorias), cfg.categoriasDinamicas || []);
    };

    var loc = w.location || {};
    var host = String(loc.hostname || '').toLowerCase();
    var isLocalWeb =
        loc.protocol &&
        loc.protocol.indexOf('http') === 0 &&
        (host === 'localhost' || host === '127.0.0.1');

    if (isLocalWeb && !cfg.forceDirectApi && cfg.apiDirectEnLocalhost !== true) {
        cfg.apiBase = '';
        cfg.registroEquiposPath = '/api/registro';
        cfg.categoriasPath = '/api/categorias';
        cfg.registroEnvioPath = '/api/registro/validar';
        cfg.validacionesPath = '/api/validaciones';
    } else {
        cfg.apiBase = cfg.apiRemoteBase;
        cfg.registroEquiposPath = '/registro';
        cfg.categoriasPath = '/categorias';
        cfg.registroEnvioPath = '/registro/validar';
        cfg.validacionesPath = '/validaciones';
    }

    w.CR_CONFIG = cfg;
    w.CR_APP = cfg;
})(window);
