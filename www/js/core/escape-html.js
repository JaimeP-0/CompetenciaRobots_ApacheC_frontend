/**
 * Escapar texto para insertar en HTML.
 */
(function (w) {
    'use strict';

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    w.CRDom = { escapeHtml: escapeHtml };
})(window);
