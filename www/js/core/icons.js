/**
 * Iconos Heroicons v2 (outline 24px).
 *
 * Fuente npm: node_modules/heroicons/24/outline/
 * En la app Cordova se sirven copias en www/vendor/heroicons/24/outline/
 * (npm run icons:sync; también va en npm run prepare:all).
 *
 * Uso: <span data-cr-icon="user-group" class="cr-icon"></span>
 * Luego CRIcons.decorate(root) o decorar al cargar la vista.
 */
(function (w) {
    'use strict';

    var BASE = 'vendor/heroicons/24/outline/';

    function iconImg(name, extraClass) {
        var n = String(name || 'question-mark-circle').replace(/\.svg$/i, '');
        var cls = 'cr-icon' + (extraClass ? ' ' + extraClass : '');
        return (
            '<img src="' +
            BASE +
            n +
            '.svg" class="' +
            cls +
            '" alt="" width="24" height="24" decoding="async" aria-hidden="true" />'
        );
    }

    function decorate(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-cr-icon]') : [];
        nodes.forEach(function (el) {
            if (el.getAttribute('data-cr-icon-done') === '1') {
                return;
            }
            var name = el.getAttribute('data-cr-icon');
            var extra = el.getAttribute('data-cr-icon-class') || '';
            el.innerHTML = iconImg(name, extra);
            el.setAttribute('data-cr-icon-done', '1');
        });
    }

    w.CRIcons = {
        img: iconImg,
        decorate: decorate
    };
})(window);
