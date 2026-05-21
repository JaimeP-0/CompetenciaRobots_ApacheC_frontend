/**
 * GET /registro: equipos, búsqueda y detalle para Registrar.
 */
(function (w) {
    'use strict';

    var Cats = w.CRApiCategorias;
    if (!Cats) throw new Error("Carga api/categorias-cache.js antes");
    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error("Carga api/http-build-url.js y config.js antes");
    }
    var buildUrl = Http.buildUrl;

    var registroTeamsCache = null;
    var registroTeamsPendientesCache = null;
    var registroTeamsInflight = null;
    var registroTeamsPendientesInflight = null;

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

    function enrichRegistroTeam(raw) {
        var members = normalizeMembers(raw.members);
        return {
            id: raw.id,
            name: raw.name != null ? String(raw.name).trim() : '',
            school: raw.school != null ? String(raw.school).trim() : '',
            grade: raw.grade != null ? String(raw.grade).trim() : '',
            teacher: raw.teacher != null ? String(raw.teacher).trim() : '',
            category_id: raw.category_id,
            category_name: Cats.labelById(raw.category_id),
            members: members,
            captain_name: captainNameFromMembers(members)
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
        var m = String((app.adminEquiposPaginacion || 'cliente')).toLowerCase();
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

    function enrichTeamsList(raw) {
        return Cats.fetch().then(function () {
            var teams = (raw || [])
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

    /** Paginación admin: ver config.adminEquiposPaginacion ('cliente' | 'servidor'). */
    function fetchTeamsPaged(opts) {
        opts = opts || {};
        var page = Math.max(1, Math.floor(Number(opts.page) || 1));
        var limit = Math.max(1, Math.min(100, Math.floor(Number(opts.limit) || 15)));
        var modo = adminPaginacionModo();

        if (modo === 'servidor') {
            var query = { page: page, limit: limit };
            if (opts.q) {
                query.q = String(opts.q).trim();
            }
            if (opts.categoryId != null && opts.categoryId !== '') {
                query.category_id = opts.categoryId;
            }
            var url = buildUrl(app.registroEquiposPath || '/registro', query);
            if (app.debugApi) {
                console.log('[CR] fetch página admin', url);
            }
            return fetch(url, { headers: { Accept: 'application/json' } })
                .then(function (res) {
                    if (!res.ok) {
                        return res.text().then(function (t) {
                            throw new Error(res.status + ' ' + t);
                        });
                    }
                    return res.json();
                })
                .then(function (data) {
                    var parsed = parseRegistroPagePayload(data);
                    if (parsed.esListaCompleta) {
                        return enrichTeamsList(parsed.items).then(function (teams) {
                            var filtered = applyAdminFilters(teams, opts);
                            var total = filtered.length;
                            var start = (page - 1) * limit;
                            return {
                                items: filtered.slice(start, start + limit),
                                total: total,
                                page: page,
                                limit: limit,
                                modo: 'cliente',
                                aviso: ''
                            };
                        });
                    }
                    return enrichTeamsList(parsed.items).then(function (teams) {
                        return {
                            items: teams,
                            total: parsed.total,
                            page: page,
                            limit: limit,
                            modo: 'servidor'
                        };
                    });
                });
        }

        return fetchRegistroTeams(!!opts.force).then(function (all) {
            var filtered = applyAdminFilters(all, opts);
            var total = filtered.length;
            var tp = total ? Math.ceil(total / limit) : 1;
            var p = page > tp ? tp : page;
            var start = (p - 1) * limit;
            return {
                items: filtered.slice(start, start + limit),
                total: total,
                page: p,
                limit: limit,
                modo: 'cliente'
            };
        });
    }

    function fetchRegistroTeamsFromApi(queryParams) {
        var url = buildUrl(app.registroEquiposPath || '/registro', queryParams);
        if (app.debugApi) {
            console.log('[CR] fetch', url);
        }
        return fetch(url, { headers: { Accept: 'application/json' } })
            .then(function (res) {
                if (!res.ok) {
                    return res.text().then(function (t) {
                        throw new Error(res.status + ' ' + t);
                    });
                }
                return res.json();
            })
            .then(function (data) {
                var raw = parseRegistroPayload(data);
                return Cats.fetch().then(function () {
                    var teams = raw
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

    function fetchRegistroTeams(force, opts) {
        opts = opts || {};
        var soloPendientes = !!(opts.excludeValidated || opts.soloPendientes);
        if (soloPendientes) {
            if (!force && registroTeamsPendientesCache) {
                return Promise.resolve(registroTeamsPendientesCache);
            }
            if (!force && registroTeamsPendientesInflight) {
                return registroTeamsPendientesInflight;
            }
            registroTeamsPendientesInflight = fetchRegistroTeamsFromApi({
                limit: 100,
                exclude_validated: 1
            })
                .then(function (teams) {
                    registroTeamsPendientesCache = teams;
                    return teams;
                })
                .finally(function () {
                    registroTeamsPendientesInflight = null;
                });
            return registroTeamsPendientesInflight;
        }
        if (!force && registroTeamsCache) {
            return Promise.resolve(registroTeamsCache);
        }
        if (!force && registroTeamsInflight) {
            return registroTeamsInflight;
        }
        registroTeamsInflight = fetchRegistroTeamsFromApi({ limit: 100 })
            .then(function (teams) {
                registroTeamsCache = teams;
                return teams;
            })
            .finally(function () {
                registroTeamsInflight = null;
            });
        return registroTeamsInflight;
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

    function findRegistroTeamByName(nombre) {
        var n = String(nombre || '').trim().toLowerCase();
        if (!n) {
            return Promise.resolve(null);
        }
        return fetchRegistroTeams(false, { excludeValidated: true }).then(function (teams) {
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
            escuela: t.school,
            capitan: t.captain_name || '',
            asesor: t.teacher,
            categoria: t.category_name,
            integrantes: ints.length ? ints.join('\n') : ''
        };
    }

    w.CRApiEquiposRegistro = {
        fetchTeams: fetchRegistroTeams,
        fetchTeamsPaged: fetchTeamsPaged,
        adminPaginacionModo: adminPaginacionModo,
        clearCache: function () {
            registroTeamsCache = null;
            registroTeamsPendientesCache = null;
        },
        filterByQuery: filterTeamsByQuery,
        findByName: findRegistroTeamByName,
        toDetallePanel: teamToRegistroDetalle,
        sugerencias: function (q) {
            return fetchRegistroTeams(false, { excludeValidated: true }).then(function (teams) {
                var needle = String(q || "").trim().toLowerCase();
                if (!needle) return [];
                return teams
                    .filter(function (t) {
                        return t.name.toLowerCase().indexOf(needle) !== -1;
                    })
                    .map(function (t) { return t.name; })
                    .slice(0, 12);
            });
        }
    };
})(window);
