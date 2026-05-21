/**
 * Respuestas mock por ruta HTTP.
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    var Mock = w.CRApiMockDatos;
    if (!app || !Http || !Mock) throw new Error("Carga mock-datos y http antes");
    var mockDelay = Mock.delay;
    var labelCategoria = Mock.labelCategoria;
    var catalogCategoryName = Mock.catalogCategoryName;
    var catalogCaptainName = Mock.catalogCaptainName;
    var CATALOG_CATEGORIES = Mock.CATALOG_CATEGORIES;
    var CATALOG_RULES = Mock.CATALOG_RULES;
    var CATALOG_TEAMS = Mock.CATALOG_TEAMS;
    var CATALOG_MEMBERS = Mock.CATALOG_MEMBERS;
    var assertCategoria = Http.assertCategoria;
    var isCategoria = Http.isCategoria;

    function mockCatalog(method, path, query) {
        var q = query || {};
        if (method === 'GET' && path === '/cr-catalog/categories') {
            return mockDelay(40, { items: CATALOG_CATEGORIES.slice() });
        }
        var mCat = path.match(/^\/cr-catalog\/categories\/(\d+)$/);
        if (mCat && method === 'GET') {
            var cid = Number(mCat[1], 10);
            var cat = CATALOG_CATEGORIES.find(function (x) {
                return x.id === cid;
            });
            if (!cat) {
                return mockDelay(0, { category: null, rules: [] });
            }
            var rules = CATALOG_RULES.filter(function (r) {
                return r.category_id === cid;
            });
            return mockDelay(40, { category: cat, rules: rules });
        }
        if (method === 'GET' && path === '/cr-catalog/teams') {
            var filterCat = q.categoryId != null && q.categoryId !== '' ? Number(q.categoryId, 10) : null;
            var teams = CATALOG_TEAMS.filter(function (t) {
                if (filterCat == null || isNaN(filterCat)) {
                    return true;
                }
                return t.category_id === filterCat;
            }).map(function (t) {
                return Object.assign({}, t, {
                    category_name: catalogCategoryName(t.category_id),
                    captain_name: catalogCaptainName(t.id)
                });
            });
            return mockDelay(50, {
                items: teams,
                categoryName: filterCat != null && !isNaN(filterCat) ? catalogCategoryName(filterCat) : ''
            });
        }
        var mTeam = path.match(/^\/cr-catalog\/teams\/(\d+)$/);
        if (mTeam && method === 'GET') {
            var tid = Number(mTeam[1], 10);
            var team = CATALOG_TEAMS.find(function (x) {
                return x.id === tid;
            });
            if (!team) {
                return mockDelay(0, { team: null, members: [] });
            }
            var full = Object.assign({}, team, {
                category_name: catalogCategoryName(team.category_id),
                captain_name: catalogCaptainName(team.id)
            });
            var mems = CATALOG_MEMBERS.filter(function (m) {
                return m.team_id === tid;
            });
            return mockDelay(40, { team: full, members: mems });
        }
        if (method === 'GET' && path === '/cr-catalog/teams/search') {
            var needle = String(q.q || '')
                .trim()
                .toLowerCase();
            if (!needle) {
                return mockDelay(0, { items: [] });
            }
            var hits = CATALOG_TEAMS.filter(function (t) {
                var blob =
                    [t.name, t.school, t.grade, t.teacher].join(' ').toLowerCase() +
                    ' ' +
                    CATALOG_MEMBERS.filter(function (m) {
                        return m.team_id === t.id;
                    })
                        .map(function (m) {
                            return (m.name || '') + ' ' + (m.email || '');
                        })
                        .join(' ')
                        .toLowerCase();
                return blob.indexOf(needle) !== -1;
            }).map(function (t) {
                return Object.assign({}, t, {
                    category_name: catalogCategoryName(t.category_id),
                    captain_name: catalogCaptainName(t.id)
                });
            });
            return mockDelay(60, { items: hits });
        }
        return null;
    }

    /** GET /encuentros/reglas?id=&rango=1|2|3 */
    function payloadReglasRango(rango, encuentroId) {
        var r = String(rango);
        var id = encuentroId != null ? String(encuentroId) : '—';
        var base = { encuentroId: id, rango: r };
        if (r === '1') {
            return Object.assign({}, base, {
                titulo: 'Reglamento – rango 1',
                descripcion: 'Enfrentamiento estándar: duración máxima 3 min, victoria por inmovilización o salida del rival.',
                puntosClave: ['Dohyo 100 cm', 'Peso robot según norma', 'Sin armas rotativas']
            });
        }
        if (r === '2') {
            return Object.assign({}, base, {
                titulo: 'Reglamento – rango 2',
                descripcion: 'Modo agresivo: empuje continuo; penalización por tiempo fuera del anillo.',
                puntosClave: ['Salida acumulada = derrota', 'Reanudación central', 'Sin tiempo extra']
            });
        }
        if (r === '3') {
            return Object.assign({}, base, {
                titulo: 'Reglamento – rango 3 (desempate)',
                descripcion: 'Ronda corta: primer punto válido define ganador; empate técnico → sorteo de posición.',
                puntosClave: ['60 s máximo', 'Sin recolocación', 'Árbitro único']
            });
        }
        return Object.assign({}, base, {
            titulo: 'Reglamento – desconocido',
            descripcion: 'Usa rango=1, rango=2 o rango=3.',
            puntosClave: []
        });
    }

    function mockHandle(method, path, query, body) {
        var q = query || {};
        var b = body || {};

        if (method === 'POST' && path === '/login') {
            var usuario = String(b.usuario || b.user || '').trim();
            var password = String(b.password || b.pass || '');
            var esperadoUser = String(app.adminMockUsuario || 'admin');
            var esperadoPass = String(app.adminMockPassword || 'admin');
            if (usuario !== esperadoUser || password !== esperadoPass) {
                return Promise.reject(new Error('Usuario o contraseña incorrectos'));
            }
            return mockDelay(0, {
                ok: true,
                token: 'mock-admin-token',
                usuario: usuario,
                rol: 'admin'
            });
        }
        if (method === 'POST' && (path === '/registro' || path === '/registro/validar')) {
            var tidPost = Number(b.team_id, 10);
            if (b.pass && Mock.teamYaValidadoMock && Mock.teamYaValidadoMock(tidPost)) {
                return Promise.reject(new Error('Este equipo ya tiene una verificación registrada.'));
            }
            if (Mock.pushMockValidation) {
                Mock.pushMockValidation(b.team_id, b.pass);
            }
            return mockDelay(0, { ok: true, mensaje: 'Verificación registrada', payload: b });
        }
        if (method === 'GET' && (path === '/registro' || path === '/api/registro')) {
            return mockDelay(
                50,
                Mock.mockRegistroTeamsList ? Mock.mockRegistroTeamsList(q) : { items: [], total: 0 }
            );
        }
        if (method === 'GET' && (path === '/validaciones' || path === '/api/validaciones')) {
            return mockDelay(50, Mock.mockValidacionesList ? Mock.mockValidacionesList(q) : { items: [], total: 0 });
        }
        if (method === 'GET' && path === '/perfil') {
            return mockDelay(0, {
                id: q.id || '1',
                nombre: 'Participante demo',
                email: 'demo@cr.local',
                categoriasPreferidas: app.listaCategorias()
            });
        }

        var catRes = mockCatalog(method, path, query);
        if (catRes) {
            return catRes;
        }

        var mRegExport = path.match(/^\/registros\/([^/]+)\/exportar$/);
        if (mRegExport && method === 'GET') {
            var catEx = mRegExport[1];
            assertCategoria(catEx);
            return mockDelay(0, {
                categoria: catEx,
                formato: 'texto/csv',
                nombreArchivo: 'registros-' + catEx + '.csv',
                contenido: 'id,nombre,club\n101,Robot Alfa,Club A\n102,Robot Beta,Club B\n'
            });
        }

        var mReg = path.match(/^\/registros\/([^/]+)$/);
        if (mReg) {
            var catR = mReg[1];
            assertCategoria(catR);
            if (method === 'GET') {
                return mockDelay(0, {
                    categoria: catR,
                    items: [
                        { id: '101', nombre: 'Robot Alfa', club: 'Club A' },
                        { id: '102', nombre: 'Robot Beta', club: 'Club B' }
                    ]
                });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, id: 'reg-' + Date.now(), categoria: catR, payload: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, id: q.id, categoria: catR, actualizado: b });
            }
        }

        var mComp = path.match(/^\/competencias\/([^/]+)$/);
        if (mComp) {
            var catC = mComp[1];
            assertCategoria(catC);
            if (method === 'GET') {
                return mockDelay(0, {
                    categoria: catC,
                    nombre: labelCategoria(catC) + ' – competencia regional',
                    fecha: '2026-06-01',
                    sede: 'Polideportivo demo',
                    administracion: 'Alta / edición por categoría (DFD)'
                });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, id: 'cmp-' + Date.now(), categoria: catC, payload: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, id: q.id, categoria: catC, actualizado: b });
            }
        }

        var mEmp = path.match(/^\/emparejamientos\/([^/]+)$/);
        if (mEmp) {
            var catE = mEmp[1];
            assertCategoria(catE);
            if (method === 'GET') {
                return mockDelay(0, {
                    categoria: catE,
                    modo: 'VS',
                    nota: 'Emparejamientos tipo VS (contrincante A vs B) por categoría.',
                    rondas: [
                        { id: 'r1', contrincanteA: '101', contrincanteB: '102' },
                        { id: 'r2', contrincanteA: '103', contrincanteB: '104' }
                    ]
                });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, id: 'emp-' + Date.now(), categoria: catE, modo: 'VS', payload: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, id: q.id, categoria: catE, actualizado: b });
            }
        }

        if (method === 'GET' && path === '/encuentros/reglas') {
            return mockDelay(0, payloadReglasRango(q.rango, q.id));
        }

        if (path === '/encuentros') {
            if (method === 'GET') {
                if (q.id) {
                    return mockDelay(0, {
                        id: q.id,
                        fase: 'cuartos',
                        categoria: 'minisumo',
                        estado: 'programado',
                        gestion: 'Gestión de peleas / encuentros (DFD)'
                    });
                }
                return mockDelay(0, {
                    items: [
                        { id: '1', categoria: 'minisumo', estado: 'en curso' },
                        { id: '2', categoria: 'seguidor', estado: 'pendiente' }
                    ]
                });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, id: 'enc-' + Date.now(), creado: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, id: q.id, actualizado: b });
            }
        }

        if (path === '/encuentros/observaciones') {
            if (method === 'GET') {
                return mockDelay(0, { encuentroId: q.id, texto: 'Sin incidencias (mock).' });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, encuentroId: q.id, creado: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, encuentroId: q.id, actualizado: b });
            }
        }

        if (path === '/resultados') {
            if (method === 'GET') {
                if (q.encuentro) {
                    return mockDelay(0, { filtro: 'encuentro', encuentro: q.encuentro, ganador: '101', detalle: 'Consulta por encuentro' });
                }
                if (q.categoria) {
                    return mockDelay(0, { filtro: 'categoria', categoria: q.categoria, tabla: [{ puesto: 1, robot: 'Alfa', puntos: 9 }] });
                }
                if (q.id) {
                    return mockDelay(0, { id: q.id, puntosA: 2, puntosB: 1, notas: 'Detalle de resultado' });
                }
                return mockDelay(0, { items: [{ id: 'res-1', encuentro: '1', resumen: '2-1' }] });
            }
            if (method === 'POST') {
                return mockDelay(0, { ok: true, id: 'res-' + Date.now(), creado: b });
            }
            if (method === 'PUT') {
                return mockDelay(0, { ok: true, id: q.id, actualizado: b });
            }
        }

        return Promise.reject(new Error('Mock no implementado: ' + method + ' ' + path));
    }

    w.CRApiMockHandlers = { handle: mockHandle, catalog: mockCatalog };
})(window);
