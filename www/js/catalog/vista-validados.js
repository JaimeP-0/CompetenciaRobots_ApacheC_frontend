/**
 * Listado de equipos con robot validado (#/validados) vía GET /robots.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function categoryIdFromRobot(robot) {
        if (!robot) {
            return null;
        }
        var cid = Number(robot.category_id, 10);
        if (!isNaN(cid)) {
            return cid;
        }
        var rules = robot.rules || [];
        var i;
        for (i = 0; i < rules.length; i++) {
            var fromRule = Number(rules[i].category_id, 10);
            if (!isNaN(fromRule)) {
                return fromRule;
            }
        }
        return null;
    }

    function groupValidRobotsByTeam(robots) {
        var byTeam = {};
        (robots || []).forEach(function (r) {
            if (!r || r.team_id == null) {
                return;
            }
            var tid = String(r.team_id);
            if (!byTeam[tid] || Number(r.id, 10) > Number(byTeam[tid].id, 10)) {
                byTeam[tid] = r;
            }
        });
        return Object.keys(byTeam).map(function (k) {
            return byTeam[k];
        });
    }

    function initValidados(outlet) {
        var listHost = outlet.querySelector('#cr-validados-list');
        var countEl = outlet.querySelector('#cr-validados-count');
        var form = outlet.querySelector('#f-validados-filtro');
        var inputBuscar = outlet.querySelector('#cr-validados-buscar');
        var selCat = outlet.querySelector('#cr-validados-cat');
        if (!listHost || !w.CRApi || typeof w.CRApi.getRobotsValidados !== 'function') {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(outlet);
        }

        var filtroQ = '';
        var filtroCat = '';
        var categoriasById = {};

        function setCount(n, loading) {
            if (!countEl) {
                return;
            }
            if (loading || n === 0) {
                countEl.classList.add('hidden');
                countEl.textContent = '';
                return;
            }
            countEl.textContent = n === 1 ? '1 equipo validado' : n + ' equipos validados';
            countEl.classList.remove('hidden');
        }

        function fillCategorias() {
            if (!selCat || !w.CRApi.fetchCategorias) {
                return Promise.resolve();
            }
            return w.CRApi.fetchCategorias().then(function (cats) {
                categoriasById = {};
                (cats || []).forEach(function (c) {
                    if (c && c.id != null) {
                        categoriasById[String(c.id)] = c.name || '';
                    }
                });
                var html = '<option value="">Todas las categorías</option>';
                (cats || []).forEach(function (c) {
                    html +=
                        '<option value="' +
                        CRDom.escapeHtml(c.id) +
                        '"' +
                        (String(filtroCat) === String(c.id) ? ' selected' : '') +
                        '>' +
                        CRDom.escapeHtml(c.name) +
                        '</option>';
                });
                selCat.innerHTML = html;
            });
        }

        function categoryLabel(robot, team) {
            if (team && team.category_name) {
                return team.category_name;
            }
            var cid = categoryIdFromRobot(robot);
            if (cid != null && categoriasById[String(cid)]) {
                return categoriasById[String(cid)];
            }
            return cid != null ? 'Categoría ' + cid : '';
        }

        function renderRulesBlock(robot) {
            var rules = robot.rules || [];
            if (!rules.length) {
                var n = (robot.valid_rules || []).length;
                return (
                    '<p class="cr-catalog-team-line cr-catalog-team-line--dense">' +
                    '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Reglas</span> ' +
                    CRDom.escapeHtml(String(n)) +
                    ' cumplida' +
                    (n === 1 ? '' : 's') +
                    '</span></p>'
                );
            }
            var items = rules
                .map(function (rule) {
                    var desc = rule.description != null ? String(rule.description).trim() : '';
                    if (!desc) {
                        return '';
                    }
                    var kind =
                        rule.type === 'restriction'
                            ? 'Restricción'
                            : rule.type === 'characteristic'
                              ? 'Característica'
                              : 'Regla';
                    return (
                        '<li><span class="font-medium text-graphite/70">' +
                        CRDom.escapeHtml(kind) +
                        ':</span> ' +
                        CRDom.escapeHtml(desc) +
                        '</li>'
                    );
                })
                .filter(Boolean)
                .join('');
            return (
                '<details class="cr-validados-rules">' +
                '<summary>Reglas cumplidas (' +
                rules.length +
                ')</summary>' +
                '<ul class="cr-validados-rules-list">' +
                items +
                '</ul></details>'
            );
        }

        function renderCard(robot, team) {
            var teamId = robot.team_id;
            var teamName = team && team.name ? team.name : 'Equipo #' + teamId;
            var cap = team && String(team.captain_name || '').trim();
            var capHtml = cap
                ? '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Capitán</span> ' +
                  CRDom.escapeHtml(cap) +
                  '</span>'
                : '';
            var catLabel = categoryLabel(robot, team);
            var catChip = catLabel
                ? '<span class="cr-catalog-team-chip">' + CRDom.escapeHtml(catLabel) + '</span>'
                : '';
            var school = team && team.school ? team.school : '—';
            return (
                '<article class="cr-catalog-team-card cr-validados-card">' +
                '<div class="cr-catalog-team-card-top">' +
                '<a class="cr-catalog-team-name cr-catalog-team-name--compact" href="#/equipo/' +
                CRDom.escapeHtml(String(teamId)) +
                '">' +
                CRDom.escapeHtml(teamName) +
                '</a>' +
                '<span class="cr-validados-badge" title="Verificación aprobada">' +
                '<span class="cr-validados-badge-icon" data-cr-icon="check-circle" aria-hidden="true"></span>' +
                '<span class="cr-validados-badge-text">Validado</span></span></div>' +
                '<p class="cr-catalog-team-line cr-catalog-team-line--school">' +
                '<span class="min-w-0 truncate">' +
                CRDom.escapeHtml(school) +
                '</span>' +
                catChip +
                '</p>' +
                '<p class="cr-catalog-team-line cr-catalog-team-line--dense">' +
                (capHtml ? capHtml + '<span class="cr-catalog-team-dot" aria-hidden="true">·</span>' : '') +
                '<span class="cr-catalog-team-inline"><span class="cr-catalog-team-inline-k">Robot</span> #' +
                CRDom.escapeHtml(String(robot.id)) +
                '</span></p>' +
                renderRulesBlock(robot) +
                '</article>'
            );
        }

        function renderEmpty() {
            var conFiltro = !!(filtroQ || filtroCat);
            listHost.innerHTML =
                '<div class="cr-validados-empty">' +
                '<span class="cr-validados-empty-icon" data-cr-icon="clipboard-document-check" aria-hidden="true"></span>' +
                '<h2 class="cr-validados-empty-title">' +
                (conFiltro ? 'Sin resultados' : 'Aún no hay equipos validados') +
                '</h2>' +
                '<p class="cr-validados-empty-desc">' +
                (conFiltro
                    ? 'Prueba otro término o quita el filtro de categoría.'
                    : 'Los equipos verificados en Registrar robots aparecerán aquí.') +
                '</p>' +
                '<a href="#/registro" data-route="/registro" class="cr-app-btn cr-app-btn--primary cr-validados-empty-cta">Registrar robots</a>' +
                '</div>';
            if (w.CRIcons) {
                w.CRIcons.decorate(listHost);
            }
        }

        function loadTeamsMap(categoryIds) {
            if (!categoryIds.length || typeof w.CRApi.getEquiposByCategory !== 'function') {
                return Promise.resolve({});
            }
            return Promise.all(
                categoryIds.map(function (cid) {
                    return w.CRApi.getEquiposByCategory(cid).catch(function () {
                        return [];
                    });
                })
            ).then(function (lists) {
                var byId = {};
                lists.forEach(function (teams) {
                    (teams || []).forEach(function (t) {
                        if (t && t.id != null) {
                            byId[String(t.id)] = t;
                        }
                    });
                });
                return byId;
            });
        }

        function applyFilters(robots, teamsById) {
            var q = filtroQ.toLowerCase();
            return robots.filter(function (robot) {
                var cid = categoryIdFromRobot(robot);
                if (filtroCat && String(cid) !== String(filtroCat)) {
                    return false;
                }
                if (!q) {
                    return true;
                }
                var team = teamsById[String(robot.team_id)];
                var blob = [
                    team && team.name,
                    team && team.school,
                    team && team.teacher,
                    team && team.captain_name,
                    team && team.category_name,
                    String(robot.id),
                    (robot.rules || [])
                        .map(function (r) {
                            return r.description;
                        })
                        .join(' ')
                ]
                    .join(' ')
                    .toLowerCase();
                return blob.indexOf(q) !== -1;
            });
        }

        function loadList() {
            listHost.setAttribute('aria-busy', 'true');
            setCount(0, true);
            listHost.innerHTML = '<p class="cr-validados-loading">Cargando equipos validados…</p>';
            return w.CRApi.getRobotsValidados()
                .then(function (robots) {
                    var grouped = groupValidRobotsByTeam(robots);
                    var catIds = [];
                    var seen = {};
                    grouped.forEach(function (r) {
                        var cid = categoryIdFromRobot(r);
                        if (cid != null && !seen[String(cid)]) {
                            seen[String(cid)] = true;
                            catIds.push(cid);
                        }
                    });
                    return loadTeamsMap(catIds).then(function (teamsById) {
                        var items = applyFilters(grouped, teamsById);
                        setCount(items.length, false);
                        if (!items.length) {
                            renderEmpty();
                            return;
                        }
                        listHost.innerHTML = items
                            .map(function (robot) {
                                return renderCard(robot, teamsById[String(robot.team_id)]);
                            })
                            .join('');
                        if (w.CRIcons) {
                            w.CRIcons.decorate(listHost);
                        }
                    });
                })
                .catch(function () {
                    setCount(0, true);
                    listHost.innerHTML =
                        '<div class="cr-validados-empty cr-validados-empty--error">' +
                        '<span class="cr-validados-empty-icon" data-cr-icon="exclamation-triangle" aria-hidden="true"></span>' +
                        '<h2 class="cr-validados-empty-title">No se pudo cargar</h2>' +
                        '<p class="cr-validados-empty-desc">Comprueba tu conexión e inténtalo de nuevo.</p>' +
                        '</div>';
                    if (w.CRIcons) {
                        w.CRIcons.decorate(listHost);
                    }
                })
                .finally(function () {
                    listHost.setAttribute('aria-busy', 'false');
                });
        }

        fillCategorias().then(loadList);

        if (form) {
            form.addEventListener(
                'submit',
                function (e) {
                    e.preventDefault();
                    filtroQ = inputBuscar ? String(inputBuscar.value || '').trim() : '';
                    filtroCat = selCat ? selCat.value : '';
                    loadList();
                },
                false
            );
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.validados = initValidados;
})(window);
