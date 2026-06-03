'use strict';

/** Rutas del backend (sin /api). En localhost el dev-server las reenvía al API remoto. */
var API_ROUTE_PREFIXES = [
    '/categorias',
    '/equipos',
    '/reglas',
    '/miembros',
    '/robots',
    '/registro',
    '/validaciones',
    '/partidas',
    '/resultados',
    '/brackets',
    '/login',
    '/cr-internal'
];

function isApiRoute(url) {
    var p = String(url || '/').split('?')[0];
    if (!p || p === '/') {
        return false;
    }
    return API_ROUTE_PREFIXES.some(function (prefix) {
        return p === prefix || p.indexOf(prefix + '/') === 0;
    });
}

module.exports = {
    API_ROUTE_PREFIXES: API_ROUTE_PREFIXES,
    isApiRoute: isApiRoute
};
