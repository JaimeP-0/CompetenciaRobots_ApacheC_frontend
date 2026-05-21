/**
 * Placeholders de carga (skeleton) del catálogo.
 */
(function (w) {
    'use strict';

    function skeletonCards(n) {
        var i;
        var out = '';
        for (i = 0; i < n; i++) {
            out += '<div class="cr-catalog-skel h-[4.5rem] w-full rounded-2xl"></div>';
        }
        return out;
    }

    w.CRDom = w.CRDom || {};
    w.CRDom.skeletonCards = skeletonCards;
})(window);
