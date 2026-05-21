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
    /** Última verificación por equipo (mock); se amplía al POST /registro/validar. */
    var MOCK_VALIDATIONS = [
        { id: 1, team_id: 1, pass: true, created_at: '2025-05-10T14:30:00.000Z' },
        { id: 2, team_id: 3, pass: true, created_at: '2025-05-11T09:15:00.000Z' }
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

    function pushMockValidation(teamId, pass) {
        var tid = Number(teamId, 10);
        if (isNaN(tid) || tid <= 0) {
            return;
        }
        var nextId = MOCK_VALIDATIONS.reduce(function (m, v) {
            return Math.max(m, Number(v.id, 10) || 0);
        }, 0) + 1;
        MOCK_VALIDATIONS.push({
            id: nextId,
            team_id: tid,
            pass: !!pass,
            created_at: new Date().toISOString()
        });
    }

    function mockValidacionesList(query) {
        query = query || {};
        var onlyPass = String(query.pass == null ? '1' : query.pass) !== '0';
        var q = String(query.q || '')
            .trim()
            .toLowerCase();
        var catId =
            query.category_id != null && query.category_id !== ''
                ? Number(query.category_id, 10)
                : null;
        var byTeam = {};
        MOCK_VALIDATIONS.forEach(function (v) {
            var tid = Number(v.team_id, 10);
            if (!byTeam[tid] || Number(v.id, 10) > Number(byTeam[tid].id, 10)) {
                byTeam[tid] = v;
            }
        });
        var items = [];
        CATALOG_TEAMS.forEach(function (t) {
            var v = byTeam[t.id];
            if (!v) {
                return;
            }
            if (onlyPass && !v.pass) {
                return;
            }
            if (catId != null && !isNaN(catId) && t.category_id !== catId) {
                return;
            }
            var blob = [t.name, t.school, t.teacher, catalogCategoryName(t.category_id)]
                .join(' ')
                .toLowerCase();
            if (q && blob.indexOf(q) === -1) {
                return;
            }
            items.push({
                id: t.id,
                name: t.name,
                school: t.school,
                grade: t.grade,
                teacher: t.teacher,
                category_id: t.category_id,
                category_name: catalogCategoryName(t.category_id),
                validation_id: v.id,
                pass: !!v.pass,
                validated_at: v.created_at,
                captain_name: catalogCaptainName(t.id)
            });
        });
        items.sort(function (a, b) {
            return String(b.validated_at || '').localeCompare(String(a.validated_at || ''));
        });
        return { items: items, total: items.length };
    }

    function latestValidationByTeam() {
        var byTeam = {};
        MOCK_VALIDATIONS.forEach(function (v) {
            var tid = Number(v.team_id, 10);
            if (!byTeam[tid] || Number(v.id, 10) > Number(byTeam[tid].id, 10)) {
                byTeam[tid] = v;
            }
        });
        return byTeam;
    }

    function teamYaValidadoMock(teamId) {
        return !!latestValidationByTeam()[Number(teamId, 10)];
    }

    function mockRegistroTeamsList(query) {
        query = query || {};
        var excludeValidated = ['1', 'true', 'yes'].indexOf(String(query.exclude_validated || '')) !== -1;
        var q = String(query.q || '')
            .trim()
            .toLowerCase();
        var catId =
            query.category_id != null && query.category_id !== ''
                ? Number(query.category_id, 10)
                : null;
        var byTeamVal = latestValidationByTeam();
        var items = [];
        CATALOG_TEAMS.forEach(function (t) {
            var lastVal = byTeamVal[t.id];
            if (excludeValidated && lastVal) {
                return;
            }
            if (catId != null && !isNaN(catId) && t.category_id !== catId) {
                return;
            }
            var blob = [t.name, t.school, t.teacher].join(' ').toLowerCase();
            if (q && blob.indexOf(q) === -1) {
                return;
            }
            var members = CATALOG_MEMBERS.filter(function (m) {
                return m.team_id === t.id;
            }).map(function (m) {
                return {
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    is_leader: m.is_leader,
                    team_id: m.team_id
                };
            });
            items.push({
                id: t.id,
                name: t.name,
                school: t.school,
                grade: t.grade,
                teacher: t.teacher,
                category_id: t.category_id,
                members: members
            });
        });
        return { items: items, total: items.length };
    }

    w.CRApiMockDatos = {
        delay: mockDelay,
        labelCategoria: labelCategoria,
        catalogCategoryName: catalogCategoryName,
        catalogCaptainName: catalogCaptainName,
        pushMockValidation: pushMockValidation,
        mockValidacionesList: mockValidacionesList,
        mockRegistroTeamsList: mockRegistroTeamsList,
        teamYaValidadoMock: teamYaValidadoMock,
        CATALOG_CATEGORIES: CATALOG_CATEGORIES,
        CATALOG_RULES: CATALOG_RULES,
        CATALOG_TEAMS: CATALOG_TEAMS,
        CATALOG_MEMBERS: CATALOG_MEMBERS
    };
})(window);
