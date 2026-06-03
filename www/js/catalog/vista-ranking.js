/**
 * Vista #/ranking — resultados por categoría ordenados por tiempo.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function initRanking(outlet) {
        var root = (outlet && outlet.querySelector('#cr-ranking-root')) || outlet;
        if (!root || !w.CRApi || typeof w.CRApi.getPartidas !== 'function') {
            return;
        }

        var selCat = root.querySelector('#cr-ranking-cat');
        var selSort = root.querySelector('#cr-ranking-sort');
        var listEl = root.querySelector('#cr-ranking-list');
        var countEl = root.querySelector('#cr-ranking-count');
        var finalsEl = root.querySelector('#cr-ranking-finals');
        var championEl = root.querySelector('#cr-ranking-champion');
        var btnPdfChampion = root.querySelector('#cr-ranking-pdf-champion');
        if (!selCat || !listEl) {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(root);
        }

        var categorias = [];
        var teamsById = {};

        function categoryLabel(catId) {
            if (catId == null) {
                return '';
            }
            var found = categorias.filter(function (c) {
                return c && String(c.id) === String(catId);
            })[0];
            return found && found.name ? found.name : 'Categoría ' + catId;
        }

        function isTimeTrialCategory(catId) {
            var name = categoryLabel(catId);
            if (!name) {
                return false;
            }
            if (typeof w.CRApi.isVelocistaCategory === 'function' && w.CRApi.isVelocistaCategory(name)) {
                return true;
            }
            if (typeof w.CRApi.isLineFollowerCategory === 'function' && w.CRApi.isLineFollowerCategory(name)) {
                return true;
            }
            return false;
        }

        function isResultComplete(partida, res, catName) {
            if (typeof w.CRApi.isPartidaResultComplete === 'function') {
                return w.CRApi.isPartidaResultComplete(res, catName);
            }
            return !!res;
        }

        function formatTime(time) {
            if (typeof w.CRApi.formatResultTime === 'function') {
                return w.CRApi.formatResultTime(time) || '—';
            }
            if (!time || time.minutes == null || time.seconds == null) {
                return '—';
            }
            var mins = Number(time.minutes, 10);
            var secs = Number(time.seconds, 10);
            if (isNaN(mins) || isNaN(secs)) {
                return '—';
            }
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        function timeSeconds(res) {
            if (typeof w.CRApi.resultTimeSeconds === 'function') {
                return w.CRApi.resultTimeSeconds(res);
            }
            return null;
        }

        function teamName(teamId) {
            var t = teamsById[String(teamId)];
            if (t && t.name) {
                return String(t.name).trim();
            }
            return 'Equipo #' + teamId;
        }

        function winnerIdFromResultado(resultado) {
            if (!resultado) {
                return null;
            }
            var id =
                resultado.team_id != null
                    ? resultado.team_id
                    : resultado.winner != null
                      ? resultado.winner
                      : resultado.winner_team_id;
            return id != null ? id : null;
        }

        function indexResultados(resultados) {
            var map = {};
            (resultados || []).forEach(function (r) {
                if (r && r.match_id != null) {
                    map[String(r.match_id)] = r;
                }
            });
            return map;
        }

        function buildRows(partidas, resByMatch) {
            var rows = [];
            (partidas || []).forEach(function (p) {
                if (!p || p.id == null) {
                    return;
                }
                var res = resByMatch[String(p.id)] || p.result || null;
                var catName = categoryLabel(p.category_id);
                if (!isResultComplete(p, res, catName)) {
                    return;
                }
                var winnerId = winnerIdFromResultado(res);
                var velocista = isTimeTrialCategory(p.category_id);
                var displayTeamId =
                    winnerId != null
                        ? winnerId
                        : p.queue && p.queue.length
                          ? p.queue[0]
                          : p.team_a_id != null
                            ? p.team_a_id
                            : null;
                rows.push({
                    matchId: p.id,
                    categoryId: p.category_id,
                    categoryName: catName,
                    velocista: velocista,
                    teamId: displayTeamId,
                    teamName: displayTeamId != null ? teamName(displayTeamId) : '—',
                    time: res && res.time ? res.time : null,
                    timeSec: timeSeconds(res),
                    winnerId: winnerId,
                    eliminatedId: res && res.eliminated_team_id != null ? res.eliminated_team_id : null,
                    detail:
                        !velocista && winnerId != null
                            ? teamName(winnerId) +
                              (res.eliminated_team_id != null
                                  ? ' venció a ' + teamName(res.eliminated_team_id)
                                  : '')
                            : ''
                });
            });
            return rows;
        }

        function sortRows(rows, sortOrder) {
            var desc = sortOrder === 'desc';
            return rows.slice().sort(function (a, b) {
                var aHas = a.timeSec != null;
                var bHas = b.timeSec != null;
                if (a.velocista && b.velocista) {
                    if (aHas && bHas) {
                        return desc ? b.timeSec - a.timeSec : a.timeSec - b.timeSec;
                    }
                    if (aHas) {
                        return -1;
                    }
                    if (bHas) {
                        return 1;
                    }
                }
                return Number(b.matchId) - Number(a.matchId);
            });
        }

        function renderEmpty(conFiltro) {
            listEl.innerHTML =
                '<div class="cr-ranking-empty">' +
                '<span class="cr-ranking-empty-icon" data-cr-icon="chart-bar" aria-hidden="true"></span>' +
                '<h2 class="cr-ranking-empty-title">' +
                (conFiltro ? 'Sin resultados en esta categoría' : 'Aún no hay resultados') +
                '</h2>' +
                '<p class="cr-ranking-empty-desc">' +
                (conFiltro
                    ? 'Registra tiempos o ganadores en Match para verlos aquí.'
                    : 'Registra resultados en Match para construir el ranking.') +
                '</p>' +
                '<button type="button" class="cr-app-btn cr-app-btn--secondary" data-route="/match">Ir a Match</button>' +
                '</div>';
            if (w.CRIcons) {
                w.CRIcons.decorate(listEl);
            }
        }

        function renderTable(rows) {
            var showTimeCol = rows.some(function (r) {
                return r.velocista;
            });
            var head =
                '<thead><tr>' +
                '<th scope="col" class="cr-ranking-th cr-ranking-th--pos">#</th>' +
                '<th scope="col" class="cr-ranking-th">Equipo / resultado</th>' +
                (showTimeCol ? '<th scope="col" class="cr-ranking-th cr-ranking-th--time">Tiempo</th>' : '') +
                '<th scope="col" class="cr-ranking-th cr-ranking-th--cat">Categoría</th>' +
                '<th scope="col" class="cr-ranking-th cr-ranking-th--match">Partida</th>' +
                '</tr></thead>';
            var body = rows
                .map(function (row, idx) {
                    var mainCell;
                    if (row.velocista) {
                        mainCell = CRDom.escapeHtml(row.teamName);
                    } else if (row.detail) {
                        mainCell = CRDom.escapeHtml(row.detail);
                    } else {
                        mainCell = CRDom.escapeHtml(row.teamName);
                    }
                    return (
                        '<tr class="cr-ranking-row">' +
                        '<td class="cr-ranking-td cr-ranking-td--pos">' +
                        (idx + 1) +
                        '</td>' +
                        '<td class="cr-ranking-td cr-ranking-td--team">' +
                        mainCell +
                        '</td>' +
                        (showTimeCol
                            ? '<td class="cr-ranking-td cr-ranking-td--time">' +
                              CRDom.escapeHtml(row.velocista ? formatTime(row.time) : row.time ? formatTime(row.time) : '—') +
                              '</td>'
                            : '') +
                        '<td class="cr-ranking-td cr-ranking-td--cat">' +
                        CRDom.escapeHtml(row.categoryName) +
                        '</td>' +
                        '<td class="cr-ranking-td cr-ranking-td--match">#' +
                        CRDom.escapeHtml(String(row.matchId)) +
                        '</td>' +
                        '</tr>'
                    );
                })
                .join('');
            listEl.innerHTML =
                '<div class="cr-ranking-table-wrap">' +
                '<table class="cr-ranking-table">' +
                head +
                '<tbody>' +
                body +
                '</tbody></table></div>';
        }

        function loadTeamsForRows(rows) {
            var catIds = [];
            var seen = {};
            rows.forEach(function (r) {
                if (r.categoryId != null && !seen[String(r.categoryId)]) {
                    seen[String(r.categoryId)] = true;
                    catIds.push(r.categoryId);
                }
            });
            if (!catIds.length || typeof w.CRApi.getEquiposByCategory !== 'function') {
                return Promise.resolve();
            }
            return Promise.all(
                catIds.map(function (cid) {
                    return w.CRApi.getEquiposByCategory(cid).catch(function () {
                        return [];
                    });
                })
            ).then(function (lists) {
                lists.forEach(function (teams) {
                    (teams || []).forEach(function (t) {
                        if (t && t.id != null) {
                            teamsById[String(t.id)] = t;
                        }
                    });
                });
            });
        }

        function loadChampion(catFilter) {
            if (!finalsEl || !championEl) {
                return Promise.resolve();
            }
            if (!catFilter || !w.CRApi || typeof w.CRApi.getBracket !== 'function') {
                finalsEl.classList.add('hidden');
                return Promise.resolve();
            }
            return w.CRApi.getBracket(catFilter, {})
                .then(function (br) {
                    var champId = br && br.champion != null ? br.champion : null;
                    if (champId == null) {
                        finalsEl.classList.add('hidden');
                        return;
                    }
                    var name = teamsById[String(champId)] && teamsById[String(champId)].name;
                    if (!name && w.CRApi.getEquiposByCategory) {
                        return w.CRApi.getEquiposByCategory(catFilter).then(function (teams) {
                            (teams || []).forEach(function (t) {
                                if (t && t.id != null) {
                                    teamsById[String(t.id)] = t;
                                }
                            });
                            name =
                                (teamsById[String(champId)] && teamsById[String(champId)].name) ||
                                'Equipo #' + champId;
                            championEl.textContent = name;
                            finalsEl.classList.remove('hidden');
                        });
                    }
                    championEl.textContent = name || 'Equipo #' + champId;
                    finalsEl.classList.remove('hidden');
                })
                .catch(function () {
                    finalsEl.classList.add('hidden');
                });
        }

        function onPdfChampionClick() {
            var catFilter = selCat.value;
            if (!catFilter || !w.CRPdfEvento || typeof w.CRPdfEvento.campeonCategoria !== 'function') {
                return;
            }
            var catName = categoryLabel(catFilter);
            var champName = championEl ? championEl.textContent : '';
            w.CRPdfEvento.campeonCategoria({
                categoryName: catName,
                championName: champName,
                filename: 'ganador-' + String(catName).replace(/\s+/g, '-').toLowerCase() + '.pdf'
            }).catch(function () {});
        }

        function loadRanking() {
            listEl.innerHTML = '<p class="cr-ranking-loading">Cargando resultados…</p>';
            var catFilter = selCat.value;
            var sortOrder = selSort && selSort.value === 'desc' ? 'desc' : 'asc';
            return Promise.all([
                w.CRApi.getPartidas(),
                typeof w.CRApi.getPartidaResultados === 'function'
                    ? w.CRApi.getPartidaResultados().catch(function () {
                          return [];
                      })
                    : Promise.resolve([])
            ])
                .then(function (arr) {
                    var resByMatch = indexResultados(arr[1]);
                    (arr[0] || []).forEach(function (p) {
                        if (p && p.result && p.id != null) {
                            resByMatch[String(p.id)] = p.result;
                        }
                    });
                    var rows = buildRows(arr[0] || [], resByMatch);
                    if (catFilter) {
                        rows = rows.filter(function (r) {
                            return String(r.categoryId) === String(catFilter);
                        });
                    }
                    return loadTeamsForRows(rows).then(function () {
                        rows = buildRows(arr[0] || [], resByMatch);
                        if (catFilter) {
                            rows = rows.filter(function (r) {
                                return String(r.categoryId) === String(catFilter);
                            });
                        }
                        rows = sortRows(rows, sortOrder);
                        if (countEl) {
                            countEl.textContent = rows.length
                                ? rows.length === 1
                                    ? '1 resultado'
                                    : rows.length + ' resultados'
                                : '';
                        }
                        if (!rows.length) {
                            renderEmpty(!!catFilter);
                            return loadChampion(catFilter);
                        }
                        renderTable(rows);
                        return loadChampion(catFilter);
                    });
                })
                .catch(function (err) {
                    if ((w.CR_APP || w.CR_CONFIG) && (w.CR_APP || w.CR_CONFIG).debugApi) {
                        console.error('[CR ranking] loadRanking', err);
                    }
                    if (countEl) {
                        countEl.textContent = '';
                    }
                    var detail =
                        err && err.message
                            ? CRDom.escapeHtml(String(err.message))
                            : 'Comprueba la conexión e inténtalo de nuevo.';
                    listEl.innerHTML =
                        '<div class="cr-ranking-empty cr-ranking-empty--error">' +
                        '<h2 class="cr-ranking-empty-title">No se pudieron cargar los resultados</h2>' +
                        '<p class="cr-ranking-empty-desc">' +
                        detail +
                        '</p></div>';
                });
        }

        function fillCategorias(cats) {
            categorias = cats || [];
            var html = '<option value="">Todas las categorías</option>';
            categorias.forEach(function (c) {
                if (c && c.id != null && c.name) {
                    html +=
                        '<option value="' +
                        CRDom.escapeHtml(String(c.id)) +
                        '">' +
                        CRDom.escapeHtml(c.name) +
                        '</option>';
                }
            });
            selCat.innerHTML = html;
            loadRanking();
        }

        selCat.addEventListener('change', loadRanking, false);
        if (selSort) {
            selSort.addEventListener('change', loadRanking, false);
        }
        if (btnPdfChampion) {
            btnPdfChampion.addEventListener('click', onPdfChampionClick, false);
        }

        if (w.CRApi.fetchCategorias) {
            w.CRApi.fetchCategorias()
                .then(fillCategorias)
                .catch(function () {
                    fillCategorias([]);
                });
        } else {
            fillCategorias([]);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.ranking = initRanking;
})(window);
