/**
 * ═══════════════════════════════════════════════════════════════════
 *  RUTAS DE LA APP — edita este archivo para añadir pantallas
 * ═══════════════════════════════════════════════════════════════════
 *
 * Navegación: hash #/ruta
 *
 * static: valor = ruta del HTML en www/views/ (sin .html)
 *   Ej. '/admin/equipos' → views/admin/equipos.html
 *
 * catalogInit: clave = misma ruta de vista; valor = método en CRCatalog
 * registro/ y admin/ se montan en app.js (no catalogInit).
 */
(function (w) {
    'use strict';

    w.CR_ROUTES = {
        static: {
            '/login': 'public/login',
            '/registro': 'registro/registrar',
            '/categorias': 'public/categorias',
            '/equipos': 'public/equipos',
            '/validados': 'public/validados',
            '/match': 'public/match',
            '/match/internos': 'public/match',
            '/match/externos': 'public/match',
            '/visitante': 'public/visitante',
            '/dashboard': 'public/visitante',
            '/dashboard-oficial': 'public/visitante',
            '/pruebapdf': 'public/pruebapdf',
            '/cr-doc-credenciales-1xuso-9k2m': 'public/pruebapdf',
            '/ranking': 'public/ranking',
            '/admin': 'admin/panel',
            '/admin/login': 'admin/login',
            '/admin/categorias': 'admin/categorias',
            '/admin/equipos': 'admin/equipos',
            '/cr-pit-arena-x7k9m2': 'public/diag-feed'
        },

        redirects: {
            '/': '/login',
            '/inicio': '/login',
            '/tablero': '/dashboard',
            '/dashboard': '/visitante',
            '/tablero-normal': '/visitante',
            '/tablero-ultra': '/visitante',
            '/tablero-oficial': '/dashboard-oficial',
            '/competencias': '/categorias',
            '/buscar': '/equipos',
            '/registro/completado': '/visitante',
            '/brackets': '/match/internos',
            '/brackets/internos': '/match/internos',
            '/brackets/externos': '/match/externos',
            '/tablero-en-vivo': '/visitante'
        },

        patterns: [
            {
                re: /^\/categoria\/([^/]+)\/equipos\/?$/,
                view: 'public/equipos',
                params: function (m) {
                    return { categoryId: decodeURIComponent(m[1]) };
                }
            },
            {
                re: /^\/categoria\/([^/]+)\/?$/,
                view: 'public/categoria-detalle',
                params: function (m) {
                    return { categoryId: decodeURIComponent(m[1]) };
                }
            },
            {
                re: /^\/equipo\/([^/]+)\/?$/,
                view: 'public/equipo-detalle',
                params: function (m) {
                    return { teamId: decodeURIComponent(m[1]) };
                }
            },
            {
                re: /^\/match\/(internos|externos)\/?$/,
                view: 'public/match',
                params: function (m) {
                    var seg = String(m[1] || '').toLowerCase();
                    return {
                        queueScope: seg === 'externos' ? 'external' : 'internal',
                        lockedScope: true,
                        scopeLabel: seg === 'externos' ? 'Externos' : 'Internos (UTNC)'
                    };
                }
            },
            {
                re: /^\/dashboard-oficial\/?$/,
                view: 'public/visitante',
                params: function () {
                    return { officialMode: true };
                }
            }
        ],

        catalogInit: {
            'public/categorias': 'initCategorias',
            'public/categoria-detalle': 'initCategoriaDetalle',
            'public/equipos': 'initEquipos',
            'public/equipo-detalle': 'initEquipoDetalle',
            'public/validados': 'initValidados',
            'public/match': 'initMatch',
            'public/visitante': 'initVisitante',
            'public/pruebapdf': 'initPruebaPdf',
            'public/login': 'initLoginStaff',
            'public/ranking': 'initRanking',
            'public/diag-feed': 'initDiagFeed'
        }
    };
})(window);
