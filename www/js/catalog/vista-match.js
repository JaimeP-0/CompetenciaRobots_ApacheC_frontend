/**
 * Vista #/match — partidas, iniciar cola y resultados.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function modeLabel(mode) {
        if (mode === 'pairwise') {
            return 'Parejas (1 vs 1)';
        }
        if (mode === 'shared') {
            return 'Concurso (cola compartida)';
        }
        return 'Automático';
    }

    function initMatch(outlet) {
        var root = (outlet && outlet.querySelector('#cr-match-root')) || outlet;
        if (!root || !w.CRApi || typeof w.CRApi.getPartidas !== 'function') {
            return;
        }

        var selCat = root.querySelector('#cr-match-cat');
        var selMode = root.querySelector('#cr-match-mode');
        var hintEl = root.querySelector('#cr-match-mode-hint');
        var btnIniciar = root.querySelector('#cr-match-iniciar');
        var statusEl = root.querySelector('#cr-match-status');
        var listEl = root.querySelector('#cr-match-list');
        var countEl = root.querySelector('#cr-match-list-count');
        var selListFilter = root.querySelector('#cr-match-list-filter');
        if (!selCat || !btnIniciar || !listEl) {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(root);
        }

        var categorias = [];

        function setStatus(msg, isError) {
            if (!statusEl) {
                return;
            }
            if (!msg) {
                statusEl.classList.add('hidden');
                statusEl.textContent = '';
                statusEl.classList.remove('cr-match-status--error');
                return;
            }
            statusEl.textContent = msg;
            statusEl.classList.remove('hidden');
            statusEl.classList.toggle('cr-match-status--error', !!isError);
        }

        function syncIniciarEnabled() {
            btnIniciar.disabled = !selCat.value;
        }

        function selectedCategory() {
            var id = selCat.value;
            if (!id) {
                return null;
            }
            var found = null;
            categorias.forEach(function (c) {
                if (c && String(c.id) === String(id)) {
                    found = c;
                }
            });
            return found || { id: Number(id, 10), name: '' };
        }

        function updateModeHint() {
            if (!hintEl) {
                return;
            }
            var cat = selectedCategory();
            if (!cat) {
                hintEl.textContent = '';
                return;
            }
            var manual = selMode && selMode.value;
            if (manual === 'pairwise' || manual === 'shared') {
                hintEl.textContent = 'Modo manual: ' + modeLabel(manual) + '.';
                return;
            }
            var inferred =
                typeof w.CRApi.inferMatchMode === 'function'
                    ? w.CRApi.inferMatchMode(cat.name)
                    : 'shared';
            hintEl.textContent =
                'Modo automático: ' +
                modeLabel(inferred) +
                (inferred === 'pairwise'
                    ? ' (categorías tipo sumo).'
                    : ' (p. ej. velocista). Solo equipos con robot válido.');
        }

        function categoryLabel(catId) {
            if (catId == null) {
                return '';
            }
            var found = categorias.filter(function (c) {
                return c && String(c.id) === String(catId);
            })[0];
            return found && found.name ? found.name : 'Categoría ' + catId;
        }

        function teamFromMatch(match, side, teamsById) {
            var embed = side === 'a' ? match.team_a : match.team_b;
            if (embed) {
                return embed;
            }
            var id = side === 'a' ? match.team_a_id : match.team_b_id;
            if (id != null && teamsById[String(id)]) {
                return teamsById[String(id)];
            }
            return id != null ? { id: id, name: 'Equipo #' + id } : null;
        }

        function teamDisplayName(team, fallbackId) {
            if (team && team.name) {
                return String(team.name).trim();
            }
            return 'Equipo #' + fallbackId;
        }

        function teamName(teamsById, teamId) {
            var t = teamsById[String(teamId)];
            if (t && t.name) {
                return String(t.name).trim();
            }
            return 'Equipo #' + teamId;
        }

        function mergeTeamsFromPartidas(partidas, teamsById) {
            var map = {};
            var k;
            for (k in teamsById) {
                if (Object.prototype.hasOwnProperty.call(teamsById, k)) {
                    map[k] = teamsById[k];
                }
            }
            (partidas || []).forEach(function (p) {
                if (p.team_a && p.team_a.id != null) {
                    map[String(p.team_a.id)] = p.team_a;
                }
                if (p.team_b && p.team_b.id != null) {
                    map[String(p.team_b.id)] = p.team_b;
                }
            });
            return map;
        }

        function isPairwiseMatch(match) {
            return match.mode === 'pairwise' || !!(match.team_a || match.team_b || match.team_a_id != null);
        }

        function teamIdsForMatch(match) {
            if (isPairwiseMatch(match)) {
                var ids = [];
                if (match.team_a_id != null) {
                    ids.push(match.team_a_id);
                }
                if (match.team_b_id != null) {
                    ids.push(match.team_b_id);
                }
                return ids;
            }
            return match.queue || [];
        }

        function categoryChip(catId) {
            var label = categoryLabel(catId);
            return label
                ? '<span class="cr-catalog-team-chip">' + CRDom.escapeHtml(label) + '</span>'
                : '';
        }

        function renderResultadoBlock(match, resultado, teamsById) {
            if (resultado && resultado.winner_team_id != null) {
                return (
                    '<div class="cr-match-result-done">' +
                    '<span class="cr-match-result-label">Ganador</span> ' +
                    CRDom.escapeHtml(teamName(teamsById, resultado.winner_team_id)) +
                    '</div>'
                );
            }
            var ids = teamIdsForMatch(match);
            if (!ids.length) {
                return '<p class="cr-match-card-desc">Sin equipos para registrar resultado.</p>';
            }
            var opts = ids
                .map(function (tid) {
                    return (
                        '<option value="' +
                        CRDom.escapeHtml(String(tid)) +
                        '">' +
                        CRDom.escapeHtml(teamName(teamsById, tid)) +
                        '</option>'
                    );
                })
                .join('');
            return (
                '<div class="cr-match-result-form" data-match-id="' +
                CRDom.escapeHtml(String(match.id)) +
                '">' +
                '<label class="cr-admin-label cr-match-result-form-label">Registrar ganador</label>' +
                '<div class="cr-match-result-form-row">' +
                '<select class="cr-admin-select cr-match-winner-select" aria-label="Ganador">' +
                opts +
                '</select>' +
                '<button type="button" class="cr-app-btn cr-app-btn--outline cr-match-save-result">Guardar</button>' +
                '</div></div>'
            );
        }

        function renderSharedCard(match, teamsById, resultado) {
            var queue = match.queue || [];
            var chips = queue
                .map(function (tid, idx) {
                    return (
                        '<li class="cr-match-queue-item">' +
                        '<span class="cr-match-queue-pos">' +
                        (idx + 1) +
                        '</span>' +
                        '<span class="cr-match-queue-name">' +
                        CRDom.escapeHtml(teamName(teamsById, tid)) +
                        '</span></li>'
                    );
                })
                .join('');
            return (
                '<article class="cr-catalog-team-card cr-match-card cr-match-card--shared">' +
                '<div class="cr-match-card-head">' +
                '<h3 class="cr-match-card-title">Partida #' +
                CRDom.escapeHtml(String(match.id)) +
                '</h3>' +
                '<span class="cr-match-card-badge">Concurso</span></div>' +
                '<p class="cr-match-card-line">' +
                categoryChip(match.category_id) +
                '<span class="cr-match-card-desc-inline">' +
                queue.length +
                ' en cola</span></p>' +
                '<ol class="cr-match-queue-list">' +
                chips +
                '</ol>' +
                renderResultadoBlock(match, resultado, teamsById) +
                '</article>'
            );
        }

        function renderPairwiseCard(match, teamsById, resultado) {
            var teamA = teamFromMatch(match, 'a', teamsById);
            var teamB = teamFromMatch(match, 'b', teamsById);
            var body = '';
            if (teamA && teamB) {
                body =
                    '<p class="cr-match-vs">' +
                    '<span class="cr-match-vs-team">' +
                    CRDom.escapeHtml(teamDisplayName(teamA, match.team_a_id)) +
                    '</span>' +
                    '<span class="cr-match-vs-sep" aria-hidden="true">vs</span>' +
                    '<span class="cr-match-vs-team">' +
                    CRDom.escapeHtml(teamDisplayName(teamB, match.team_b_id)) +
                    '</span></p>';
                if (teamA.school || teamB.school) {
                    body +=
                        '<p class="cr-match-card-desc">' +
                        CRDom.escapeHtml(teamA.school || '—') +
                        ' · ' +
                        CRDom.escapeHtml(teamB.school || '—') +
                        '</p>';
                }
            } else {
                body = '<p class="cr-match-card-desc">Emparejamiento incompleto.</p>';
            }
            return (
                '<article class="cr-catalog-team-card cr-match-card cr-match-card--pairwise">' +
                '<div class="cr-match-card-head">' +
                '<h3 class="cr-match-card-title">Partida #' +
                CRDom.escapeHtml(String(match.id)) +
                '</h3>' +
                '<span class="cr-match-card-badge cr-match-card-badge--pair">Parejas</span></div>' +
                '<p class="cr-match-card-line">' +
                categoryChip(match.category_id) +
                '</p>' +
                body +
                renderResultadoBlock(match, resultado, teamsById) +
                '</article>'
            );
        }

        function renderEmptyList(conFiltro) {
            listEl.innerHTML =
                '<div class="cr-match-empty">' +
                '<span class="cr-match-empty-icon" data-cr-icon="trophy" aria-hidden="true"></span>' +
                '<h2 class="cr-match-empty-title">' +
                (conFiltro ? 'Sin partidas en esta categoría' : 'No hay partidas') +
                '</h2>' +
                '<p class="cr-match-empty-desc">' +
                (conFiltro
                    ? 'Usa «Iniciar cola» para crear partidas con equipos validados.'
                    : 'Inicia la cola en una categoría para crear partidas.') +
                '</p></div>';
            if (w.CRIicons) {
                w.CRIcons.decorate(listEl);
            }
        }

        function loadTeamsMaps(categoryIds) {
            var ids = categoryIds || [];
            if (!ids.length || typeof w.CRApi.getEquiposByCategory !== 'function') {
                return Promise.resolve({});
            }
            return Promise.all(
                ids.map(function (cid) {
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

        function indexResultados(resultados) {
            var map = {};
            (resultados || []).forEach(function (r) {
                if (r && r.match_id != null) {
                    map[String(r.match_id)] = r;
                }
            });
            return map;
        }

        function renderPartidasList(filtered, resByMatch, teamsById) {
            teamsById = mergeTeamsFromPartidas(filtered, teamsById || {});
            var html = filtered
                .map(function (m) {
                    var res = resByMatch[String(m.id)] || null;
                    if (isPairwiseMatch(m)) {
                        return renderPairwiseCard(m, teamsById, res);
                    }
                    return renderSharedCard(m, teamsById, res);
                })
                .join('');
            listEl.innerHTML = '<div class="cr-match-results-grid">' + html + '</div>';
            if (w.CRIcons) {
                w.CRIcons.decorate(listEl);
            }
        }

        function loadPartidasList() {
            listEl.innerHTML = '<p class="cr-match-loading">Cargando partidas…</p>';
            var catFilter = selListFilter ? selListFilter.value : '';
            return Promise.all([
                w.CRApi.getPartidas(),
                typeof w.CRApi.getPartidaResultados === 'function'
                    ? w.CRApi.getPartidaResultados().catch(function () {
                          return [];
                      })
                    : Promise.resolve([])
            ])
                .then(function (arr) {
                    var all = (arr[0] || []).slice().sort(function (a, b) {
                        return Number(b.id) - Number(a.id);
                    });
                    var resByMatch = indexResultados(arr[1]);
                    var filtered = catFilter
                        ? all.filter(function (p) {
                              return String(p.category_id) === String(catFilter);
                          })
                        : all;
                    if (countEl) {
                        countEl.textContent = filtered.length
                            ? filtered.length === 1
                                ? '1 partida'
                                : filtered.length + ' partidas'
                            : '';
                    }
                    if (!filtered.length) {
                        renderEmptyList(!!catFilter);
                        return;
                    }
                    renderPartidasList(filtered, resByMatch, {});
                    var catIds = [];
                    var seen = {};
                    filtered.forEach(function (p) {
                        if (p.category_id != null && !seen[String(p.category_id)]) {
                            seen[String(p.category_id)] = true;
                            catIds.push(p.category_id);
                        }
                    });
                    if (!catIds.length) {
                        return;
                    }
                    return loadTeamsMaps(catIds)
                        .then(function (extraTeams) {
                            renderPartidasList(filtered, resByMatch, extraTeams);
                        })
                        .catch(function () {
                            /* ya visible con equipos embebidos */
                        });
                })
                .catch(function (err) {
                    if ((w.CR_APP || w.CR_CONFIG) && (w.CR_APP || w.CR_CONFIG).debugApi) {
                        console.error('[CR match] loadPartidasList', err);
                    }
                    if (countEl) {
                        countEl.textContent = '';
                    }
                    var detail =
                        err && err.message
                            ? '<p class="cr-match-empty-desc">' + CRDom.escapeHtml(String(err.message)) + '</p>'
                            : '<p class="cr-match-empty-desc">Comprueba la conexión e inténtalo de nuevo.</p>';
                    listEl.innerHTML =
                        '<div class="cr-match-empty cr-match-empty--error">' +
                        '<span class="cr-match-empty-icon" data-cr-icon="exclamation-triangle" aria-hidden="true"></span>' +
                        '<h2 class="cr-match-empty-title">No se pudieron cargar las partidas</h2>' +
                        detail +
                        '</div>';
                    if (w.CRIcons) {
                        w.CRIcons.decorate(listEl);
                    }
                });
        }

        function onListClick(e) {
            var btn = e.target.closest('.cr-match-save-result');
            if (!btn || !listEl.contains(btn)) {
                return;
            }
            var form = btn.closest('.cr-match-result-form');
            if (!form) {
                return;
            }
            var matchId = form.getAttribute('data-match-id');
            var sel = form.querySelector('.cr-match-winner-select');
            if (!matchId || !sel || !sel.value) {
                return;
            }
            btn.disabled = true;
            setStatus('Guardando resultado…', false);
            w.CRApi.postPartidaResultado(matchId, { winner_team_id: Number(sel.value, 10) })
                .then(function () {
                    setStatus('Resultado guardado.', false);
                    return loadPartidasList();
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo guardar el resultado.', true);
                    btn.disabled = false;
                });
        }

        function onIniciarClick() {
            var catId = selCat.value;
            if (!catId) {
                setStatus('Elige una categoría.', true);
                return;
            }
            var opts = {};
            if (selMode && (selMode.value === 'pairwise' || selMode.value === 'shared')) {
                opts.mode = selMode.value;
            }
            var usedMode =
                opts.mode ||
                (w.CRApi.inferMatchMode
                    ? w.CRApi.inferMatchMode(selectedCategory() && selectedCategory().name)
                    : 'shared');

            btnIniciar.disabled = true;
            setStatus('Iniciando cola (' + modeLabel(usedMode) + ')…', false);

            w.CRApi.postPartidasIniciar(catId, opts)
                .then(function (matches) {
                    var n = (matches || []).length;
                    setStatus(
                        n
                            ? n === 1
                                ? 'Se creó 1 partida.'
                                : 'Se crearon ' + n + ' partidas.'
                            : 'Cola iniciada sin partidas nuevas.',
                        false
                    );
                    return loadPartidasList();
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo iniciar la cola.', true);
                })
                .finally(function () {
                    syncIniciarEnabled();
                });
        }

        function fillCategoryOptions(selectEl, includeAllOption) {
            if (!selectEl) {
                return;
            }
            var html = includeAllOption
                ? '<option value="">Todas las categorías</option>'
                : '<option value="">— Elige categoría —</option>';
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
            selectEl.innerHTML = html;
        }

        function fillCategorias(cats) {
            categorias = cats || [];
            fillCategoryOptions(selCat, false);
            fillCategoryOptions(selListFilter, true);
            updateModeHint();
            syncIniciarEnabled();
            loadPartidasList();
        }

        function onCatChange() {
            updateModeHint();
            syncIniciarEnabled();
            setStatus('', false);
        }

        function onListFilterChange() {
            loadPartidasList();
        }

        function onModeChange() {
            updateModeHint();
        }

        selCat.addEventListener('change', onCatChange, false);
        if (selListFilter) {
            selListFilter.addEventListener('change', onListFilterChange, false);
        }
        if (selMode) {
            selMode.addEventListener('change', onModeChange, false);
        }
        btnIniciar.addEventListener('click', onIniciarClick, false);
        listEl.addEventListener('click', onListClick, false);

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
    w.CRCatalogViews.match = initMatch;
})(window);
