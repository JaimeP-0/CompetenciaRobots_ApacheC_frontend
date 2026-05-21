/**
 * Barra de navegación compartida entre vistas admin (excepto login).
 */
(function (w) {
    'use strict';

    var LINKS = [
        { id: 'panel', route: '/admin', label: 'Panel' },
        { id: 'categorias', route: '/admin/categorias', label: 'Categorías' },
        { id: 'equipos', route: '/admin/equipos', label: 'Equipos' }
    ];

    function htmlSubnav(activeId) {
        var items = LINKS.map(function (link) {
            var isActive = link.id === activeId;
            return (
                '<a href="#' +
                link.route +
                '" class="cr-admin-subnav-link' +
                (isActive ? ' cr-admin-subnav-link--active' : '') +
                '" data-route="' +
                link.route +
                '"' +
                (isActive ? ' aria-current="page"' : '') +
                '>' +
                link.label +
                '</a>'
            );
        }).join('');
        return (
            '<nav class="cr-admin-subnav" aria-label="Secciones de administración">' + items + '</nav>'
        );
    }

    function mount(outlet, activeId) {
        var host = outlet.querySelector('[data-admin-subnav]');
        if (!host) {
            return;
        }
        host.innerHTML = htmlSubnav(activeId);
    }

    w.CRAdminNav = {
        mount: mount,
        html: htmlSubnav
    };
})(window);
