/**
 * Iconos Heroicons (www/vendor/heroicons/24/outline).
 * Uso: <span data-cr-icon="users" class="cr-icon"></span>
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
