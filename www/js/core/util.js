/**
 * Utilidades compartidas (timing, loading registro).
 */
(function (w) {
    'use strict';

    var crDetalleFetchGen = 0;

    function registroMinMs() {
        var n = Number((w.CR_CONFIG || w.CR_APP || {}).registroMinLoadingMs);
        if (isNaN(n) || n < 0) {
            return 0;
        }
        return n;
    }

    function minDelayMs(ms) {
        return new Promise(function (resolve) {
            w.setTimeout(resolve, ms);
        });
    }

    function withRegistroMinLoading(promise) {
        var ms = registroMinMs();
        var p = Promise.resolve(promise);
        if (!ms) {
            return p;
        }
        return Promise.all([p, minDelayMs(ms)]).then(function (arr) {
            return arr[0];
        });
    }

    function setRegDetalleLoading(root, visible) {
        var el = root && root.querySelector ? root.querySelector('#reg-detalle-loading') : null;
        if (!el) {
            return;
        }
        el.classList.toggle('hidden', !visible);
        el.setAttribute('aria-busy', visible ? 'true' : 'false');
    }

    function bumpDetalleFetchGen() {
        crDetalleFetchGen += 1;
        return crDetalleFetchGen;
    }

    function getDetalleFetchGen() {
        return crDetalleFetchGen;
    }

    w.CRUtil = {
        withRegistroMinLoading: withRegistroMinLoading,
        setRegDetalleLoading: setRegDetalleLoading,
        bumpDetalleFetchGen: bumpDetalleFetchGen,
        getDetalleFetchGen: getDetalleFetchGen
    };
})(window);
