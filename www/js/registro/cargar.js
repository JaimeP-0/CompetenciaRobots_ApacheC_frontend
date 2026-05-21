/**
 * Carga bajo demanda los módulos de registro (no van en index.html).
 */
(function (w, d) {
    'use strict';

    var SCRIPTS = [
        'js/registro/equipo-datos.js',
        'js/registro/autocomplete-equipo.js',
        'js/registro/checklists-config.js',
        'js/registro/pantalla-registrar.js',
        'js/registro/registro.js'
    ];

    var inflight = null;

    function scriptUrl(path) {
        var cfg = w.CR_CONFIG || w.CR_APP || {};
        var bp = cfg.basePath ? String(cfg.basePath).replace(/\/$/, '') + '/' : '';
        return bp + path;
    }

    function loadOne(path) {
        return new Promise(function (resolve, reject) {
            var src = scriptUrl(path);
            var existing = d.querySelector('script[data-cr-registro-src="' + src + '"]');
            if (existing) {
                resolve();
                return;
            }
            var el = d.createElement('script');
            el.src = src;
            el.async = false;
            el.setAttribute('data-cr-registro-src', src);
            el.onload = function () {
                resolve();
            };
            el.onerror = function () {
                reject(new Error('No se pudo cargar ' + path));
            };
            d.body.appendChild(el);
        });
    }

    function loadAll() {
        var chain = Promise.resolve();
        SCRIPTS.forEach(function (path) {
            chain = chain.then(function () {
                return loadOne(path);
            });
        });
        return chain.then(function () {
            if (!w.CRRegistro) {
                throw new Error('CRRegistro no disponible tras cargar registro/');
            }
            return w.CRRegistro;
        });
    }

    function ensureLoaded() {
        if (w.CRRegistro) {
            return Promise.resolve(w.CRRegistro);
        }
        if (!inflight) {
            inflight = loadAll().finally(function () {
                inflight = null;
            });
        }
        return inflight;
    }

    w.CRRegistroLoader = {
        ensureLoaded: ensureLoaded
    };
})(window, document);
