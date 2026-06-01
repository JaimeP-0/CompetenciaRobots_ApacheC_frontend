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
            '/': 'public/inicio',
            '/inicio': 'public/inicio',
            '/registro': 'registro/registrar',
            '/categorias': 'public/categorias',
            '/equipos': 'public/equipos',
            '/validados': 'public/validados',
            '/match': 'public/match',
            '/ranking': 'public/ranking',
            '/brackets': 'public/brackets',
            '/admin': 'admin/panel',
            '/admin/login': 'admin/login',
            '/admin/categorias': 'admin/categorias',
            '/admin/equipos': 'admin/equipos'
        },

        redirects: {
            '/tablero': '/',
            '/tablero-normal': '/',
            '/tablero-ultra': '/',
            '/competencias': '/categorias',
            '/buscar': '/equipos',
            '/registro/completado': '/'
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
            }
        ],

        catalogInit: {
            'public/inicio': 'initInicio',
            'public/categorias': 'initCategorias',
            'public/categoria-detalle': 'initCategoriaDetalle',
            'public/equipos': 'initEquipos',
            'public/equipo-detalle': 'initEquipoDetalle',
            'public/validados': 'initValidados',
            'public/match': 'initMatch',
            'public/ranking': 'initRanking',
            'public/brackets': 'initBrackets'
        }
    };
})(window);
