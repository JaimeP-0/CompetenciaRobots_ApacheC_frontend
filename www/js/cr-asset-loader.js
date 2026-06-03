/**
 * Añade ?v= a los <script src="js/..."> siguientes (antes de que el navegador los cargue).
 */
(function (w, d) {
    'use strict';
    var ov = w.CR_API_OVERRIDES || {};
    var bust = ov.viewCacheBust || ov.assetCacheBust || '';
    w.CR_ASSET_V = bust ? String(bust) : String(Date.now());

    var nodes = d.querySelectorAll('script[src^="js/"]');
    var i;
    for (i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var src = el.getAttribute('src') || '';
        if (!src || src.indexOf('config.local.js') !== -1 || src.indexOf('cr-asset-loader.js') !== -1) {
            continue;
        }
        if (src.indexOf('?') === -1) {
            el.setAttribute('src', src + '?v=' + encodeURIComponent(w.CR_ASSET_V));
        }
    }
})(window, document);
