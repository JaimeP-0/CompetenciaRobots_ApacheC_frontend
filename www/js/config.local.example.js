/**
 * Plantilla de referencia. Los valores activos están en config.local.js.
 *
 * apiLocalLan: IP de tu PC en Wi‑Fi para el APK en celular físico.
 *   Ejemplo: 'http://192.168.1.42:8080'
 */
(function (w) {
    'use strict';
    w.CR_API_OVERRIDES = {
        apiProfile: 'local',
        /** null = emulador usa 10.0.2.2; en celular real pon tu IP LAN */
        apiLocalLan: null
    };
})(window);
