(function (w) {
    'use strict';

    var API_PROFILES = {
        /** Navegador en el VPS: mismo host (nginx). APK: publicUrl. */
        vps: {
            publicUrl: 'https://utarena.online'
        },
        local: {
            desktop: 'http://127.0.0.1:8080',
            androidEmulator: 'http://10.0.2.2:8080'
        },
        remote: {
            desktop: 'http://100.119.194.73:8080',
            androidEmulator: 'http://100.119.194.73:8080'
        }
    };

    var overrides = w.CR_API_OVERRIDES || {};
    var profileName = overrides.apiProfile || 'vps';
    if (profileName !== 'vps' && profileName !== 'local' && profileName !== 'remote') {
        profileName = 'vps';
    }
    var profile = API_PROFILES[profileName] || API_PROFILES.vps;

    var cfg = {
        basePath: '',
        rutaRegistroJueces: '/jueces/registro',
        reglasRango: Object.freeze([1, 2, 3]),
        apiProfile: profileName,
        apiLocalBase: 'http://127.0.0.1:8080',
        apiRemoteBase: '',
        registroEnvioHabilitado: true,
        categoryNamesById: {},
        registroMinLoadingMs: 0,
        debugApi: true,
        adminLoginMock:
            overrides.adminLoginMock !== undefined
                ? !!overrides.adminLoginMock
                : profileName !== 'vps',
        adminMockUsuario: 'admin',
        adminMockPassword: 'admin',
        adminDatosLocales: false,
        adminEquiposPorPagina: 15,
        adminEquiposPaginacion: 'cliente',
        catalogCatPosicionId: null,
        catalogCatPosicion: null,
        catalogCatPosicionSm: null,
        catalogEquipoPosicionId: 2,
        catalogEquipoPosicion: 1,
        catalogEquipoPosicionSm: 4
    };

    function publicUrl() {
        return String(overrides.publicUrl || profile.publicUrl || API_PROFILES.vps.publicUrl).replace(
            /\/$/,
            ''
        );
    }

    function isProductionHost() {
        var loc = w.location || {};
        var host = loc.hostname || '';
        if (!host || host === 'localhost' || host === '127.0.0.1') {
            return false;
        }
        return loc.protocol === 'http:' || loc.protocol === 'https:';
    }

    function resolveApiRemoteBase() {
        if (overrides.apiRemoteBase != null && overrides.apiRemoteBase !== '') {
            return String(overrides.apiRemoteBase).replace(/\/$/, '');
        }

        var platformId = w.cordova && w.cordova.platformId;

        if (profileName === 'vps') {
            if (platformId === 'android' || platformId === 'ios') {
                return publicUrl();
            }
            if (isProductionHost()) {
                var loc = w.location || {};
                if (loc.protocol && loc.host) {
                    return String(loc.protocol) + '//' + String(loc.host);
                }
                return publicUrl();
            }
            return publicUrl();
        }

        if (profileName === 'local') {
            if (platformId === 'android') {
                if (overrides.apiLocalLan) {
                    return String(overrides.apiLocalLan).replace(/\/$/, '');
                }
                return profile.androidEmulator;
            }
            return profile.desktop;
        }

        if (platformId === 'android' || platformId === 'ios') {
            return profile.androidEmulator || profile.desktop;
        }
        return profile.desktop;
    }

    cfg.apiRemoteBase = resolveApiRemoteBase();

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

    cfg.listaEquipos = function () {
        return [].concat(Array.prototype.slice.call(cfg.equipos), cfg.equiposDinamicos || []);
    };

    var loc = w.location || {};
    var port = String(loc.port || '');
    var platformId = w.cordova && w.cordova.platformId;
    var devPort = String(w.CR_DEV_SERVER_PORT || '8000');
    var isDevBrowserProxy =
        platformId === 'browser' ||
        (loc.protocol === 'http:' &&
            platformId !== 'android' &&
            platformId !== 'ios' &&
            port === devPort);

    cfg.apiBase =
        isDevBrowserProxy || cfg.apiRemoteBase === '' ? '' : cfg.apiRemoteBase;
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
    cfg.diagFeedPath = '/cr-internal/telemetry/v1/feed';
    cfg.diagFeedKey =
        overrides.diagFeedKey != null && overrides.diagFeedKey !== ''
            ? String(overrides.diagFeedKey)
            : '';

    w.CR_CONFIG = cfg;
    w.CR_APP = cfg;
})(window);
