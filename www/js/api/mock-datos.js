/**
 * Datos estáticos del mock (categorías, equipos de prueba).
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;

    function mockDelay(ms, value) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(value);
            }, ms || 120);
        });
    }

    var labels = {
        minisumo: 'Minisumo',
        seguidor: 'Seguidor de línea'
    };

    function labelCategoria(c) {
        return labels[c] || c;
    }

    /** Mock alineado al esquema category / rule / team / member (GET /cr-catalog/*). */
    var CATALOG_CATEGORIES = [
        { id: 1, name: 'Minisumo' },
        { id: 2, name: 'Seguidor de línea' },
        { id: 3, name: 'Sumobot' }
    ];
    var CATALOG_RULES = [
        { id: 1, description: 'Robots dentro del peso y volumen permitidos por reglamento.', category_id: 1 },
        { id: 2, description: 'Dohyo oficial; victoria por salida o inmovilización del rival.', category_id: 1 },
        { id: 3, description: 'Recorrido del circuito en el tiempo límite; sin atajos.', category_id: 2 },
        { id: 4, description: 'Sensores permitidos según convocatoria UTNC.', category_id: 2 },
        { id: 5, description: 'Empuje máximo regulado; prohibido dañar dohyo.', category_id: 3 }
    ];
    var CATALOG_TEAMS = [
        { id: 1, name: 'Mini Titan', school: 'UTNC', grade: '6°', teacher: 'Prof. Martínez', category_id: 1 },
        { id: 2, name: 'Chispa 500', school: 'CBTis 12', grade: '5°', teacher: 'Prof. Ruiz', category_id: 1 },
        { id: 3, name: 'Equipo UTNC', school: 'UTNC', grade: '4°', teacher: 'Prof. López', category_id: 2 },
        { id: 4, name: 'Rayo MK', school: 'Conalep Norte', grade: '6°', teacher: 'Prof. Hernández', category_id: 2 },
        { id: 5, name: 'Empuje Total', school: 'Escuela Sec. 8', grade: '3°', teacher: 'Prof. Vega', category_id: 3 }
    ];
    var CATALOG_MEMBERS = [
        { id: 1, name: 'Ana López', email: 'ana@utnc.edu.mx', is_leader: true, team_id: 1 },
        { id: 2, name: 'Luis Gómez', email: null, is_leader: false, team_id: 1 },
        { id: 3, name: 'María Sánchez', email: 'maria@school.mx', is_leader: true, team_id: 2 },
        { id: 4, name: 'Pedro Díaz', email: null, is_leader: true, team_id: 3 },
        { id: 5, name: 'Laura Ruiz', email: 'laura@conalep.mx', is_leader: true, team_id: 4 },
        { id: 6, name: 'Jorge Vega', email: null, is_leader: true, team_id: 5 }
    ];

    function catalogCategoryName(id) {
        var n = Number(id);
        var c = CATALOG_CATEGORIES.find(function (x) {
            return x.id === n;
        });
        return c ? c.name : '';
    }

    /** Nombre del integrante con rol líder/capitán (listados de equipos). */
    function catalogCaptainName(teamId) {
        var tid = Number(teamId, 10);
        if (isNaN(tid)) {
            return '';
        }
        var cap = CATALOG_MEMBERS.find(function (m) {
            return m.team_id === tid && m.is_leader;
        });
        return cap && cap.name ? String(cap.name) : '';
    }

    w.CRApiMockDatos = {
        delay: mockDelay,
        labelCategoria: labelCategoria,
        catalogCategoryName: catalogCategoryName,
        catalogCaptainName: catalogCaptainName,
        CATALOG_CATEGORIES: CATALOG_CATEGORIES,
        CATALOG_RULES: CATALOG_RULES,
        CATALOG_TEAMS: CATALOG_TEAMS,
        CATALOG_MEMBERS: CATALOG_MEMBERS
    };
})(window);
