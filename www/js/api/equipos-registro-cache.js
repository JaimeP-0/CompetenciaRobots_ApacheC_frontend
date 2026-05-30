/**
 * Equipos de registro vía GET /registro/{id}/equipos; catálogo/admin vía GET /categorias/{id}/equipos o GET /registro.
 */
(function (w) {
    'use strict';

    var Cats = w.CRApiCategorias;
    if (!Cats) throw new Error('Carga api/categorias-cache.js antes');
    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error('Carga api/http-build-url.js y config.js antes');
    }
    var buildUrl = Http.buildUrl;

    var registroTeamsCacheMap = {};
    var registroTeamsInflightMap = {};

    function catsPath() {
        return app.categoriasPath || '/categorias';
    }

    function equiposPath() {
        return app.equiposPath || '/equipos';
    }

    function equipoPath(teamId) {
        return equiposPath() + '/' + encodeURIComponent(String(teamId));
    }

    function normalizeMember(m) {
        if (m == null) {
            return null;
        }
        if (typeof m === 'string') {
            var s = m.trim();
            return s ? { name: s, email: null, is_leader: false } : null;
        }
        var name = m.name != null ? m.name : m.nombre;
        return {
            id: m.id != null ? m.id : undefined,
            name: name != null ? String(name).trim() : '',
            email: m.email != null ? m.email : null,
            is_leader: !!(m.is_leader || m.isLeader || m.lider || m.leader)
        };
    }

    function normalizeMembers(arr) {
        if (!Array.isArray(arr)) {
            return [];
        }
        var out = [];
        arr.forEach(function (m) {
            var n = normalizeMember(m);
            if (n && n.name) {
                out.push(n);
            }
        });
        return out;
    }

    function captainNameFromMembers(members) {
        var list = members || [];
        var cap = list.filter(function (m) {
            return m.is_leader;
        })[0];
        if (cap && cap.name) {
            return cap.name;
        }
        return list[0] && list[0].name ? list[0].name : '';
    }

    function normalizeCatalogRules(rules, fallbackCategoryId) {
        if (Cats && typeof Cats.normalizeRules === 'function') {
            return Cats.normalizeRules(rules, fallbackCategoryId);
        }
        return Array.isArray(rules) ? rules : [];
    }

    function parseRobotListPayload(data) {
        if (Array.isArray(data)) {
            return data;
        }
        var fromList = parseRegistroPayload(data);
        if (fromList.length) {
            return fromList;
        }
        if (data && data.id != null) {
            return [data];
        }
        return [];
    }

    function normalizeRobotFromApi(raw, fallbackCategoryId) {
        if (!raw || raw.id == null) {
            return null;
        }
        var id = Number(raw.id, 10);
        if (isNaN(id)) {
            return null;
        }
        var teamId = Number(raw.team_id, 10);
        var catId = Number(raw.category_id, 10);
        if (isNaN(catId) && fallbackCategoryId != null) {
            catId = Number(fallbackCategoryId, 10);
        }
        var validRules = [];
        if (Array.isArray(raw.valid_rules)) {
            raw.valid_rules.forEach(function (rid) {
                var n = Number(rid, 10);
                if (!isNaN(n) && n > 0 && validRules.indexOf(n) === -1) {
                    validRules.push(n);
                }
            });
        }
        var robot = {
            id: id,
            is_valid: !!(raw.is_valid === true || raw.is_valid === 1),
            valid_rules: validRules,
            rules: normalizeCatalogRules(raw.rules, isNaN(catId) ? fallbackCategoryId : catId)
        };
        if (!isNaN(teamId)) {
            robot.team_id = teamId;
        }
        if (!isNaN(catId)) {
            robot.category_id = catId;
        }
        return robot;
    }

    function normalizeRobotsList(raw, fallbackCategoryId) {
        return parseRobotListPayload(raw)
            .map(function (r) {
                return normalizeRobotFromApi(r, fallbackCategoryId);
            })
            .filter(Boolean);
    }

    function robotValidFromTeamRaw(raw, robots) {
        if (raw && (raw.robot_valid === true || raw.robot_valid === 1)) {
            return true;
        }
        if (raw && (raw.robot_valid === false || raw.robot_valid === 0)) {
            return false;
        }
        if (robots && robots.length) {
            return robots.some(function (r) {
                return r.is_valid;
            });
        }
        return false;
    }

    function normalizeTeamFromApi(raw, fallbackCategoryId) {
        if (!raw || raw.id == null) {
            return null;
        }
        var cid = Number(raw.category_id, 10);
        if (isNaN(cid) && fallbackCategoryId != null) {
            cid = Number(fallbackCategoryId, 10);
        }
        var team = {
            id: raw.id,
            name: raw.name != null ? String(raw.name).trim() : '',
            school: raw.school != null ? String(raw.school).trim() : '',
            grade: raw.grade != null ? String(raw.grade).trim() : '',
            teacher: raw.teacher != null ? String(raw.teacher).trim() : ''
        };
        if (!isNaN(cid)) {
            team.category_id = cid;
        } else if (raw.category_id != null) {
            team.category_id = raw.category_id;
        }
        if (Array.isArray(raw.members)) {
            team.members = normalizeMembers(raw.members);
        }
        if (Array.isArray(raw.robots)) {
            team.robots = normalizeRobotsList(raw.robots, isNaN(cid) ? fallbackCategoryId : cid);
        } else {
            team.robots = [];
        }
        team.robot_valid = robotValidFromTeamRaw(raw, team.robots);
        if (raw.category != null && String(raw.category).trim()) {
            team.category = String(raw.category).trim();
        }
        return team;
    }

    function enrichRegistroTeam(raw) {
        var base = normalizeTeamFromApi(raw, raw && raw.category_id);
        if (!base) {
            return {
                id: raw && raw.id,
                name: '',
                school: '',
                grade: '',
                teacher: '',
                category_id: raw && raw.category_id,
                category_name: Cats.labelById(raw && raw.category_id),
                members: [],
                captain_name: '',
                robots: [],
                robot_valid: false
            };
        }
        var members = base.members != null ? base.members : normalizeMembers(raw.members);
        var categoryName =
            (raw && raw.category) ||
            base.category ||
            (raw && raw.category_name) ||
            Cats.labelById(base.category_id);
        return {
            id: base.id,
            name: base.name,
            school: base.school,
            grade: base.grade,
            teacher: base.teacher,
            category_id: base.category_id,
            category_name: categoryName,
            members: members,
            captain_name: captainNameFromMembers(members),
            robots: base.robots || [],
            robot_valid: base.robot_valid === true
        };
    }

    function parseRegistroPayload(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        if (data && Array.isArray(data.value)) {
            return data.value;
        }
        return [];
    }

    function adminPaginacionModo() {
        var m = String(app.adminEquiposPaginacion || 'cliente').toLowerCase();
        return m === 'servidor' ? 'servidor' : 'cliente';
    }

    function applyAdminFilters(teams, opts) {
        var list = teams || [];
        var q = String((opts && opts.q) || '')
            .trim()
            .toLowerCase();
        var catRaw = opts && opts.categoryId;
        var catId =
            catRaw != null && catRaw !== '' && !isNaN(Number(catRaw, 10)) ? Number(catRaw, 10) : null;

        if (q) {
            list = list.filter(function (t) {
                return filterTeamsByQuery([t], q).length > 0;
            });
        }
        if (catId != null) {
            list = list.filter(function (t) {
                return Number(t.category_id, 10) === catId;
            });
        }
        return list;
    }

    function apiGet(path, query) {
        var url = buildUrl(path, query || {});
        if (app.debugApi) {
            console.log('[CR] fetch', url);
        }
        return fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }).then(function (res) {
            if (res.status === 304) {
                return res.text().then(function (t) {
                    var s = String(t || '').trim();
                    return s ? JSON.parse(s) : null;
                });
            }
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(res.status + ' ' + t);
                });
            }
            if (res.status === 204) {
                return null;
            }
            return res.text().then(function (t) {
                var s = String(t || '').trim();
                if (!s) {
                    return null;
                }
                return JSON.parse(s);
            });
        });
    }

    function fetchTeamsByCategory(catId) {
        var path = catsPath() + '/' + encodeURIComponent(String(catId)) + '/equipos';
        return apiGet(path).then(function (data) {
            return parseRegistroPayload(data)
                .map(function (t) {
                    return normalizeTeamFromApi(t, catId);
                })
                .filter(function (t) {
                    return t && t.id != null;
                });
        });
    }

    function fetchMembersForTeam(teamId) {
        return apiGet(equipoPath(teamId) + '/miembros')
            .then(function (data) {
                return normalizeMembers(parseRegistroPayload(data));
            })
            .catch(function () {
                return [];
            });
    }

    function fetchRobotsForTeam(teamId) {
        return apiGet(equipoPath(teamId) + '/robots')
            .then(function (data) {
                return normalizeRobotsList(data);
            })
            .catch(function () {
                return [];
            });
    }

    function robotsPath() {
        return app.robotsPath || '/robots';
    }

    function fetchRobots() {
        return apiGet(robotsPath()).then(function (data) {
            return normalizeRobotsList(data);
        });
    }

    function fetchRobotById(robotId) {
        return apiGet(robotsPath() + '/' + encodeURIComponent(String(robotId))).then(function (data) {
            return normalizeRobotFromApi(data);
        });
    }

    function attachMembersToTeams(teams) {
        return Promise.all(
            (teams || []).map(function (t) {
                if (Array.isArray(t.members)) {
                    return Promise.resolve(t);
                }
                return fetchMembersForTeam(t.id).then(function (members) {
                    return Object.assign({}, t, { members: members });
                });
            })
        );
    }

    function enrichTeamsList(raw) {
        return Cats.fetch().then(function () {
            return attachMembersToTeams(raw || []).then(function (withMembers) {
                var teams = withMembers
                    .map(enrichRegistroTeam)
                    .filter(function (t) {
                        return t.name;
                    });
                if (w.CRAdminAlmacen && w.CRAdminAlmacen.isEnabled()) {
                    teams = w.CRAdminAlmacen.aplicarCategoriaAEquipos(teams);
                    teams.forEach(function (t) {
                        t.category_name = Cats.labelById(t.category_id);
                    });
                }
                return teams;
            });
        });
    }

    function parseRegistroPagePayload(data) {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            var items = parseRegistroPayload(data);
            var total = Number(data.total, 10);
            if (isNaN(total)) {
                total = Number(data.count, 10);
            }
            if (isNaN(total)) {
                total = Number(data.totalCount, 10);
            }
            if (isNaN(total)) {
                total = items.length;
            }
            return { items: items, total: total };
        }
        var arr = parseRegistroPayload(data);
        return { items: arr, total: arr.length, esListaCompleta: true };
    }

    function fetchTeamsPaged(opts) {
        opts = opts || {};
        var page = Math.max(1, Math.floor(Number(opts.page) || 1));
        var limit = Math.max(1, Math.min(100, Math.floor(Number(opts.limit) || 15)));

        if (opts.categoryId != null && opts.categoryId !== '') {
            return fetchTeamsByCategory(opts.categoryId)
                .then(function (raw) {
                    return enrichTeamsList(raw);
                })
                .then(function (teams) {
                    var filtered = applyAdminFilters(teams, opts);
                    var total = filtered.length;
                    var start = (page - 1) * limit;
                    return {
                        items: filtered.slice(start, start + limit),
                        total: total,
                        page: page,
                        limit: limit,
                        modo: 'cliente'
                    };
                });
        }

        return Promise.resolve({
            items: [],
            total: 0,
            page: page,
            limit: limit,
            modo: 'cliente'
        });
    }

    function registroPath() {
        return app.registroPath || '/registro';
    }

    function registroEquiposPath(catId) {
        return registroPath() + '/' + encodeURIComponent(String(catId)) + '/equipos';
    }

    function cacheKeyForOpts(opts) {
        opts = opts || {};
        if (opts.categoryId != null && opts.categoryId !== '') {
            var key = String(opts.categoryId);
            if (opts.requireCategory || opts.excludeRobotValid) {
                key += '_pendientes';
            }
            return key;
        }
        return '_all';
    }

    function filterTeamsSinRobotValidado(teams) {
        return (teams || []).filter(function (t) {
            return t && t.robot_valid !== true;
        });
    }

    function parseRegistroEquiposResponse(data, catId) {
        var page = parseRegistroPagePayload(data);
        return (page.items || [])
            .map(function (t) {
                return normalizeTeamFromApi(t, catId != null ? catId : t.category_id);
            })
            .filter(function (t) {
                return t && t.id != null;
            });
    }

    function fetchRegistroEquiposByCategory(catId, query) {
        return apiGet(registroEquiposPath(catId), query)
            .then(function (data) {
                return parseRegistroEquiposResponse(data, catId);
            })
            .catch(function () {
                return fetchTeamsByCategory(catId);
            });
    }

    function fetchRegistroTeamsFromApi(opts) {
        opts = opts || {};
        var query = {};
        if (opts.q != null && String(opts.q).trim() !== '') {
            query.q = String(opts.q).trim();
        }
        var catId = opts.categoryId;
        if ((catId == null || catId === '') && opts.requireCategory) {
            return Promise.resolve([]);
        }
        var loadRaw;
        if (catId != null && catId !== '') {
            loadRaw = fetchRegistroEquiposByCategory(catId, query);
        } else {
            loadRaw = apiGet(registroPath(), query).then(function (data) {
                return parseRegistroEquiposResponse(data, null);
            });
        }
        return loadRaw
            .then(function (raw) {
                return enrichTeamsList(raw);
            })
            .then(function (teams) {
                if (opts.requireCategory || opts.excludeRobotValid) {
                    return filterTeamsSinRobotValidado(teams);
                }
                return teams;
            });
    }

    function fetchRegistroTeams(force, opts) {
        opts = opts || {};
        var key = cacheKeyForOpts(opts);
        if (!force && registroTeamsCacheMap[key]) {
            return Promise.resolve(registroTeamsCacheMap[key]);
        }
        if (!force && registroTeamsInflightMap[key]) {
            return registroTeamsInflightMap[key];
        }
        registroTeamsInflightMap[key] = fetchRegistroTeamsFromApi(opts)
            .then(function (teams) {
                registroTeamsCacheMap[key] = teams;
                return teams;
            })
            .finally(function () {
                delete registroTeamsInflightMap[key];
            });
        return registroTeamsInflightMap[key];
    }

    function filterTeamsByQuery(teams, needle) {
        var q = String(needle || '')
            .trim()
            .toLowerCase();
        if (!q) {
            return [];
        }
        return teams.filter(function (t) {
            var blob =
                [
                    t.name,
                    t.school,
                    t.grade,
                    t.teacher,
                    t.category_name,
                    (t.members || [])
                        .map(function (m) {
                            return (m.name || '') + ' ' + (m.email || '');
                        })
                        .join(' ')
                ].join(' ').toLowerCase();
            return blob.indexOf(q) !== -1;
        });
    }

    function findRegistroTeamByName(nombre, categoryId) {
        var n = String(nombre || '').trim().toLowerCase();
        if (!n || categoryId == null || categoryId === '') {
            return Promise.resolve(null);
        }
        return fetchRegistroTeams(false, {
            categoryId: categoryId,
            requireCategory: true,
            excludeRobotValid: true
        }).then(function (teams) {
            var exact = teams.filter(function (t) {
                return t.name.toLowerCase() === n;
            });
            if (exact.length === 1) {
                return exact[0];
            }
            var partial = teams.filter(function (t) {
                return t.name.toLowerCase().indexOf(n) !== -1;
            });
            return partial.length === 1 ? partial[0] : null;
        });
    }

    function teamToRegistroDetalle(t) {
        if (!t) {
            return null;
        }
        var ints = (t.members || [])
            .map(function (m) {
                return m.name;
            })
            .filter(Boolean);
        return {
            team_id: t.id,
            category_id: t.category_id,
            escuela: t.school,
            capitan: t.captain_name || '',
            asesor: t.teacher,
            categoria: t.category_name,
            integrantes: ints.length ? ints.join('\n') : '',
            robot_valid: t.robot_valid === true,
            robots: t.robots || []
        };
    }

    function fetchReglasByCategory(catId) {
        if (Cats && typeof Cats.fetchRulesForCategory === 'function') {
            return Cats.fetchRulesForCategory(catId);
        }
        var path = catsPath() + '/' + encodeURIComponent(String(catId)) + '/reglas';
        return apiGet(path)
            .then(function (data) {
                var raw = parseRegistroPayload(data);
                if (Cats && typeof Cats.normalizeRules === 'function') {
                    return Cats.normalizeRules(raw, catId);
                }
                return raw;
            })
            .catch(function () {
                return [];
            });
    }

    function fetchTeamsByCategoryEnriched(catId) {
        return fetchTeamsByCategory(catId).then(function (raw) {
            return enrichTeamsList(raw);
        });
    }

    w.CRApiEquiposRegistro = {
        fetchTeams: fetchRegistroTeams,
        fetchTeamsPaged: fetchTeamsPaged,
        fetchTeamsByCategory: fetchTeamsByCategory,
        fetchTeamsByCategoryEnriched: fetchTeamsByCategoryEnriched,
        fetchMembersForTeam: fetchMembersForTeam,
        fetchRobotsForTeam: fetchRobotsForTeam,
        fetchRobots: fetchRobots,
        fetchRobotById: fetchRobotById,
        normalizeRobotFromApi: normalizeRobotFromApi,
        fetchReglasByCategory: fetchReglasByCategory,
        adminPaginacionModo: adminPaginacionModo,
        clearCache: function () {
            registroTeamsCacheMap = {};
            registroTeamsInflightMap = {};
        },
        filterByQuery: filterTeamsByQuery,
        findByName: findRegistroTeamByName,
        toDetallePanel: teamToRegistroDetalle,
        sugerencias: function (q, categoryId) {
            if (categoryId == null || categoryId === '') {
                return Promise.resolve([]);
            }
            return fetchRegistroTeams(false, {
                categoryId: categoryId,
                requireCategory: true,
                excludeRobotValid: true
            }).then(function (teams) {
                var needle = String(q || '').trim().toLowerCase();
                if (!needle) {
                    return [];
                }
                return teams
                    .filter(function (t) {
                        return t.name.toLowerCase().indexOf(needle) !== -1;
                    })
                    .map(function (t) {
                        return t.name;
                    })
                    .slice(0, 12);
            });
        }
    };
})(window);
