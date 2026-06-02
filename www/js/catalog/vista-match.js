/**
 * Vista #/match — partidas, iniciar cola y resultados.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error('Carga core/escape-html y skeleton-html');

    function modeLabel(mode, categoryName) {
        if (w.CRCategoriasCompetencia && categoryName) {
            return w.CRCategoriasCompetencia.matchModeLabel(mode, categoryName);
        }
        if (mode === 'pairwise') {
            return 'Parejas (1 vs 1)';
        }
        if (mode === 'solo') {
            return 'Carrera individual (1 por equipo)';
        }
        if (mode === 'shared') {
            return 'Concurso (cola compartida)';
        }
        return 'Automático';
    }

    function initMatch(outlet, routeParams) {
        routeParams = routeParams || {};
        var root = (outlet && outlet.querySelector('#cr-match-root')) || outlet;
        if (!root || !w.CRApi || typeof w.CRApi.getPartidas !== 'function') {
            return;
        }

        var selCat = root.querySelector('#cr-match-cat');
        var pageTitleEl = root.querySelector('.cr-page-title');
        var scopeLockedHint = root.querySelector('#cr-match-scope-locked-hint');
        var lockedScope = !!routeParams.lockedScope;
        var routeScope = routeParams.queueScope || '';
        var selMode = root.querySelector('#cr-match-mode');
        var hintEl = root.querySelector('#cr-match-mode-hint');
        var btnIniciar = root.querySelector('#cr-match-iniciar');
        var statusEl = root.querySelector('#cr-match-status');
        var listEl = root.querySelector('#cr-match-list');
        var countEl = root.querySelector('#cr-match-list-count');
        var selListFilter = root.querySelector('#cr-match-list-filter');
        var selQueueScope = root.querySelector('#cr-match-queue-scope');
        var btnGenerarMas = root.querySelector('#cr-match-generar-mas');
        var btnVelocistaSiguiente = root.querySelector('#cr-velocista-siguiente');
        var listTitleEl = root.querySelector('#cr-match-list-title');
        var modeWrap = root.querySelector('#cr-match-mode-wrap');
        var lastPartidasLoadCtx = null;
        if (!selCat || !btnIniciar || !listEl) {
            return;
        }

        function getQueueScope() {
            if (!selQueueScope) {
                return '';
            }
            if (w.CRTeamOrigin && typeof w.CRTeamOrigin.normalizeQueueScope === 'function') {
                return w.CRTeamOrigin.normalizeQueueScope(selQueueScope.value);
            }
            return String(selQueueScope.value || '').trim().toLowerCase();
        }

        function initQueueScopeSelect() {
            if (!selQueueScope || !w.CRTeamOrigin) {
                return;
            }
            if (routeScope) {
                selQueueScope.value =
                    w.CRTeamOrigin.normalizeQueueScope(routeScope) === 'external' ? 'external' : 'internal';
            } else {
                var stored = w.CRTeamOrigin.readStoredQueueScope();
                if (stored) {
                    selQueueScope.value = stored === 'external' ? 'external' : 'internal';
                }
            }
            if (lockedScope) {
                selQueueScope.disabled = true;
                selQueueScope.setAttribute('aria-disabled', 'true');
                if (scopeLockedHint) {
                    scopeLockedHint.textContent =
                        'Cola fija para esta vista (' + (routeParams.scopeLabel || selQueueScope.value) + ').';
                    scopeLockedHint.classList.remove('hidden');
                }
            }
            if (pageTitleEl && routeParams.scopeLabel) {
                pageTitleEl.textContent = 'Partidas — ' + routeParams.scopeLabel;
            }
        }

        function persistQueueScope() {
            var scope = getQueueScope();
            if (scope && w.CRTeamOrigin) {
                w.CRTeamOrigin.storeQueueScope(scope);
            }
            return scope;
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
            var manual = selMode && selMode.value && modeWrap && !modeWrap.classList.contains('hidden');
            if (manual === 'pairwise' || manual === 'shared') {
                hintEl.textContent = 'Modo manual: ' + modeLabel(manual, cat.name) + '.';
                return;
            }
            var inferred =
                typeof w.CRApi.inferMatchMode === 'function'
                    ? w.CRApi.inferMatchMode(cat.name)
                    : 'shared';
            var extra = '';
            if (typeof w.CRApi.isFutbolCategory === 'function' && w.CRApi.isFutbolCategory(cat.name)) {
                extra = ' Cada equipo necesita 2 robots validados.';
            }
            if (typeof w.CRApi.isMinisumoCategory === 'function' && w.CRApi.isMinisumoCategory(cat.name)) {
                extra = ' Sin brackets: empareja 1v1 y usa «Generar más partidas» para la siguiente ronda.';
            }
            hintEl.textContent = modeLabel(inferred, cat.name) + '.' + extra;
        }

        function syncMatchUiForCategory() {
            var cat = selectedCategory();
            var isEvent =
                cat &&
                w.CRCategoriasCompetencia &&
                w.CRCategoriasCompetencia.isEventCategoryName(cat.name);
            if (modeWrap) {
                modeWrap.classList.toggle('hidden', !!isEvent);
            }
            if (btnGenerarMas) {
                var showGen =
                    cat &&
                    ((typeof w.CRApi.isMinisumoCategory === 'function' &&
                        w.CRApi.isMinisumoCategory(cat.name)) ||
                        (typeof w.CRApi.isFutbolCategory === 'function' &&
                            w.CRApi.isFutbolCategory(cat.name)));
                btnGenerarMas.classList.toggle('hidden', !showGen);
                btnGenerarMas.disabled = !selCat.value;
            }
            var isVel =
                cat && typeof w.CRApi.isVelocistaCategory === 'function' && w.CRApi.isVelocistaCategory(cat.name);
            if (btnVelocistaSiguiente) {
                btnVelocistaSiguiente.classList.toggle('hidden', !isVel);
            }
            btnIniciar.textContent = isVel ? 'Crear cola de carreras' : 'Iniciar cola';
            updateModeHint();
            syncIniciarEnabled();
        }

        function refreshGenerarMasState() {
            if (!btnGenerarMas || btnGenerarMas.classList.contains('hidden') || !selCat.value) {
                return;
            }
            var cat = selectedCategory();
            if (!cat) {
                return;
            }
            var opts = {
                queueScope: persistQueueScope(),
                categoryName: cat.name
            };
            if (!w.CRApiMatchmaking || typeof w.CRApiMatchmaking.countPendingInScope !== 'function') {
                return;
            }
            w.CRApiMatchmaking.countPendingInScope(selCat.value, opts).then(function (pending) {
                btnGenerarMas.disabled = pending > 0;
            });
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

        function isSoloRaceMatch(match) {
            if (!match) {
                return false;
            }
            var q = match.queue || [];
            if (q.length === 1) {
                return true;
            }
            if (match.team_a_id != null && match.team_b_id == null && !q.length) {
                return true;
            }
            return false;
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

        function resultKindForCategory(catId) {
            var name = categoryLabel(catId);
            if (typeof w.CRApi.isVelocistaCategory === 'function' && w.CRApi.isVelocistaCategory(name)) {
                return 'velocista';
            }
            if (typeof w.CRApi.isLineFollowerCategory === 'function' && w.CRApi.isLineFollowerCategory(name)) {
                return 'line-follower';
            }
            return 'winner';
        }

        function formatResultTime(time) {
            if (!time || time.minutes == null || time.seconds == null) {
                return '';
            }
            var mins = Number(time.minutes, 10);
            var secs = Number(time.seconds, 10);
            if (isNaN(mins) || isNaN(secs)) {
                return '';
            }
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
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

        function isResultComplete(kind, resultado) {
            if (!resultado) {
                return false;
            }
            if (kind === 'velocista') {
                if (typeof w.CRApi.isPartidaResultComplete === 'function') {
                    var cat = selectedCategory();
                    if (cat && cat.name) {
                        return w.CRApi.isPartidaResultComplete(resultado, cat.name);
                    }
                }
                return !!resultado.time;
            }
            return winnerIdFromResultado(resultado) != null;
        }

        function isPartidaPendiente(partida, resByMatch) {
            if (!partida) {
                return false;
            }
            var res = resByMatch[String(partida.id)] || partida.result || null;
            var catName = categoryLabel(partida.category_id);
            if (typeof w.CRApi.isPartidaResultComplete === 'function') {
                return !w.CRApi.isPartidaResultComplete(res, catName);
            }
            var kind = resultKindForCategory(partida.category_id);
            return !isResultComplete(kind, res);
        }

        function renderTimeFieldset(required) {
            var req = required ? ' required' : '';
            return (
                '<fieldset class="cr-match-time-fieldset">' +
                '<legend class="cr-match-time-legend">' +
                (required ? 'Tiempo' : 'Tiempo (opcional)') +
                '</legend>' +
                '<div class="cr-match-result-time-inputs">' +
                '<label class="cr-match-time-label">Min' +
                '<input type="number" name="time-min" min="0" step="1"' +
                req +
                ' class="cr-admin-input cr-match-time-min" inputmode="numeric" placeholder="0" aria-label="Minutos">' +
                '</label>' +
                '<span class="cr-match-result-time-sep" aria-hidden="true">:</span>' +
                '<label class="cr-match-time-label">Seg' +
                '<input type="number" name="time-sec" min="0" max="59" step="1"' +
                req +
                ' class="cr-admin-input cr-match-time-sec" inputmode="numeric" placeholder="00" aria-label="Segundos">' +
                '</label>' +
                '</div></fieldset>'
            );
        }

        function renderResultSaved(kind, match, resultado, teamsById) {
            var ids = teamIdsForMatch(match);
            var winnerId = winnerIdFromResultado(resultado);
            var teamId = winnerId != null ? winnerId : ids.length ? ids[0] : null;
            var html = '<div class="cr-match-result-done">';

            if (kind === 'velocista') {
                html +=
                    '<span class="cr-match-result-label">Tiempo</span> ' +
                    '<span class="cr-match-result-time-value">' +
                    CRDom.escapeHtml(formatResultTime(resultado.time) || '—') +
                    '</span>';
                if (teamId != null) {
                    html +=
                        '<span class="cr-match-result-time-done"> · ' +
                        CRDom.escapeHtml(teamName(teamsById, teamId)) +
                        '</span>';
                }
            } else {
                html +=
                    '<span class="cr-match-result-label">Ganador</span> ' +
                    CRDom.escapeHtml(teamName(teamsById, winnerId));
                if (resultado.time) {
                    html +=
                        '<span class="cr-match-result-time-done"> · ' +
                        CRDom.escapeHtml(formatResultTime(resultado.time)) +
                        '</span>';
                }
            }
            return html + '</div>';
        }

        function renderResultForm(kind, match, teamsById) {
            var ids = teamIdsForMatch(match);
            if (!ids.length) {
                return '<p class="cr-match-card-desc">Sin equipos para registrar resultado.</p>';
            }

            var attrs =
                'class="cr-match-result-form" data-match-id="' +
                CRDom.escapeHtml(String(match.id)) +
                '" data-result-kind="' +
                CRDom.escapeHtml(kind) +
                '"';

            if (kind === 'velocista' || (kind === 'line-follower' && isSoloRaceMatch(match))) {
                var soleId = ids[0];
                var timeRequired = kind === 'velocista';
                return (
                    '<form ' +
                    attrs +
                    ' data-team-id="' +
                    CRDom.escapeHtml(String(soleId)) +
                    '">' +
                    '<p class="cr-match-sole-team">' +
                    CRDom.escapeHtml(teamName(teamsById, soleId)) +
                    '</p>' +
                    renderTimeFieldset(timeRequired) +
                    '<button type="submit" class="cr-app-btn cr-app-btn--primary cr-match-save-result">Registrar tiempo</button>' +
                    '</form>'
                );
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
                '<form ' +
                attrs +
                '>' +
                '<label class="cr-admin-label cr-match-result-form-label" for="cr-match-winner-' +
                CRDom.escapeHtml(String(match.id)) +
                '">Ganador</label>' +
                '<div class="cr-match-result-form-row">' +
                '<select id="cr-match-winner-' +
                CRDom.escapeHtml(String(match.id)) +
                '" name="team_id" class="cr-admin-select cr-match-winner-select" required aria-label="Ganador">' +
                opts +
                '</select>' +
                '<button type="submit" class="cr-app-btn cr-app-btn--primary cr-match-save-result">Guardar</button>' +
                '</div>' +
                (kind === 'line-follower' ? renderTimeFieldset(false) : '') +
                '</form>'
            );
        }

        function renderResultSection(match, resultado, teamsById) {
            var kind = resultKindForCategory(match.category_id);
            if (isResultComplete(kind, resultado)) {
                return renderResultSaved(kind, match, resultado, teamsById);
            }
            return renderResultForm(kind, match, teamsById);
        }

        function readTimeFromForm(form) {
            var minEl = form.querySelector('[name=time-min]');
            var secEl = form.querySelector('[name=time-sec]');
            var minVal = minEl ? minEl.value : '';
            var secVal = secEl ? secEl.value : '';
            if ((minVal === '' || minVal == null) && (secVal === '' || secVal == null)) {
                return null;
            }
            return { minutes: minVal, seconds: secVal };
        }

        function buildPayloadFromForm(form) {
            var kind = form.getAttribute('data-result-kind') || 'winner';
            var body = {};

            if (kind === 'velocista' || form.getAttribute('data-team-id')) {
                var teamId = form.getAttribute('data-team-id');
                if (!teamId) {
                    throw new Error('No se encontró el equipo de la partida.');
                }
                var time = readTimeFromForm(form);
                var kindAttr = form.getAttribute('data-result-kind') || '';
                if (kindAttr === 'velocista' && !time) {
                    throw new Error('Indica minutos y segundos.');
                }
                if (kindAttr === 'line-follower' && !time) {
                    throw new Error('Indica minutos y segundos.');
                }
                body.team_id = Number(teamId, 10);
                if (time) {
                    body.requireTime = kindAttr === 'velocista';
                    body.time = time;
                }
                return body;
            }

            var sel = form.querySelector('[name=team_id]');
            if (!sel || !sel.value) {
                throw new Error('Elige un ganador.');
            }
            body.team_id = Number(sel.value, 10);
            if (kind === 'line-follower') {
                var optionalTime = readTimeFromForm(form);
                if (optionalTime) {
                    body.time = optionalTime;
                }
            }
            return body;
        }

        function renderSoloRaceCard(match, teamsById, resultado, kind) {
            var teamId =
                (match.queue && match.queue[0]) ||
                match.team_a_id ||
                null;
            var badge =
                kind === 'velocista'
                    ? 'Velocista'
                    : 'Carrera individual';
            var badgeCls =
                kind === 'velocista'
                    ? ' cr-match-card-badge--velocista'
                    : ' cr-match-card-badge--solo';
            return (
                '<article class="cr-catalog-team-card cr-match-card cr-match-card--solo">' +
                '<div class="cr-match-card-head">' +
                '<h3 class="cr-match-card-title">Partida #' +
                CRDom.escapeHtml(String(match.id)) +
                '</h3>' +
                '<span class="cr-match-card-badge' +
                badgeCls +
                '">' +
                CRDom.escapeHtml(badge) +
                '</span></div>' +
                '<p class="cr-match-card-line">' +
                categoryChip(match.category_id) +
                '</p>' +
                (teamId != null
                    ? '<p class="cr-match-velocista-team">' +
                      CRDom.escapeHtml(teamName(teamsById, teamId)) +
                      '</p>'
                    : '') +
                renderResultSection(match, resultado, teamsById) +
                '</article>'
            );
        }

        function renderMatchCard(match, teamsById, resultado) {
            var kind = resultKindForCategory(match.category_id);
            if ((kind === 'velocista' || kind === 'line-follower') && isSoloRaceMatch(match)) {
                return renderSoloRaceCard(match, teamsById, resultado, kind);
            }
            if (isPairwiseMatch(match)) {
                return renderPairwiseCard(match, teamsById, resultado);
            }
            return renderSharedCard(match, teamsById, resultado);
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
                renderResultSection(match, resultado, teamsById) +
                '</article>'
            );
        }

        function renderPairwiseCard(match, teamsById, resultado) {
            var catName = categoryLabel(match.category_id);
            var badge = '1v1';
            if (typeof w.CRApi.isFutbolCategory === 'function' && w.CRApi.isFutbolCategory(catName)) {
                badge = '2v2';
            }
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
                '<span class="cr-match-card-badge cr-match-card-badge--pair">' +
                CRDom.escapeHtml(badge) +
                '</span></div>' +
                '<p class="cr-match-card-line">' +
                categoryChip(match.category_id) +
                '</p>' +
                body +
                renderResultSection(match, resultado, teamsById) +
                '</article>'
            );
        }

        function renderEmptyList(conFiltro, todasCompletadas) {
            var title = conFiltro ? 'Sin partidas pendientes' : 'No hay partidas pendientes';
            var desc;
            if (todasCompletadas) {
                desc =
                    'Todas las partidas de esta categoría ya tienen resultado. Consulta la vista Resultados o inicia cola para equipos nuevos.';
            } else if (conFiltro) {
                desc = 'Usa «Iniciar cola» para agregar equipos validados que aún no tengan partida.';
            } else {
                desc = 'Inicia la cola en una categoría para crear partidas pendientes.';
            }
            listEl.innerHTML =
                '<div class="cr-match-empty">' +
                '<span class="cr-match-empty-icon" data-cr-icon="trophy" aria-hidden="true"></span>' +
                '<h2 class="cr-match-empty-title">' +
                CRDom.escapeHtml(title) +
                '</h2>' +
                '<p class="cr-match-empty-desc">' +
                CRDom.escapeHtml(desc) +
                '</p>' +
                '<button type="button" class="cr-app-btn cr-app-btn--secondary cr-match-empty-link" data-route="/ranking">Ver resultados</button>' +
                '</div>';
            if (w.CRIcons) {
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

        function isVelocistaCategoryId(catId) {
            if (!catId) {
                return false;
            }
            return (
                typeof w.CRApi.isVelocistaCategory === 'function' &&
                w.CRApi.isVelocistaCategory(categoryLabel(catId))
            );
        }

        function teamIdFromSoloPartida(partida) {
            if (!partida) {
                return null;
            }
            if (partida.queue && partida.queue.length) {
                return partida.queue[0];
            }
            return partida.team_a_id != null ? partida.team_a_id : null;
        }

        function updateListSectionTitle(isVelocistaView) {
            if (!listTitleEl) {
                return;
            }
            listTitleEl.textContent = isVelocistaView ? 'Cola velocista' : 'Partidas pendientes';
        }

        function focusVelocistaEnPista() {
            if (!listEl) {
                return;
            }
            var wrap = listEl.querySelector('.cr-velocista-now-wrap');
            if (wrap && wrap.scrollIntoView) {
                wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            var minInput = listEl.querySelector('#cr-velocista-now [name=time-min]');
            if (minInput && minInput.focus) {
                window.setTimeout(function () {
                    minInput.focus();
                }, 280);
            }
        }

        function syncVelocistaSiguienteButton(pendingCount, hasCurrent) {
            if (!btnVelocistaSiguiente) {
                return;
            }
            var catId = selListFilter ? selListFilter.value : selCat.value;
            var show =
                isVelocistaCategoryId(catId) &&
                (pendingCount > 0 || hasCurrent);
            btnVelocistaSiguiente.classList.toggle('hidden', !show);
            btnVelocistaSiguiente.disabled = !hasCurrent;
        }

        function renderVelocistaView(catId, allPartidas, resByMatch, teamsById, scope) {
            teamsById = mergeTeamsFromPartidas(allPartidas || [], teamsById || {});
            var runs = (allPartidas || []).filter(function (p) {
                return p && String(p.category_id) === String(catId) && isSoloRaceMatch(p);
            });
            if (scope && w.CRTeamOrigin) {
                runs = runs.filter(function (p) {
                    return w.CRTeamOrigin.partidaMatchesQueueScope(p, scope, teamsById);
                });
            }
            runs.sort(function (a, b) {
                return Number(a.id) - Number(b.id);
            });

            var pendingRuns = runs.filter(function (p) {
                return isPartidaPendiente(p, resByMatch);
            });
            var doneCount = runs.length - pendingRuns.length;
            var current = pendingRuns.length ? pendingRuns[0] : null;

            updateListSectionTitle(true);

            if (!runs.length) {
                if (countEl) {
                    countEl.textContent = '';
                }
                renderEmptyList(true, false);
                syncVelocistaSiguienteButton(0, false);
                return Promise.resolve(0);
            }

            var queueHtml = runs
                .map(function (p, idx) {
                    var tid = teamIdFromSoloPartida(p);
                    var res = resByMatch[String(p.id)] || p.result || null;
                    var complete = !isPartidaPendiente(p, resByMatch);
                    var isNow = current && String(p.id) === String(current.id);
                    var state = complete ? 'done' : isNow ? 'now' : 'wait';
                    var meta = complete
                        ? formatResultTime(res && res.time ? res.time : null) || 'Listo'
                        : isNow
                          ? 'En pista'
                          : 'En espera';
                    return (
                        '<li class="cr-velocista-queue-item cr-velocista-queue-item--' +
                        state +
                        '">' +
                        '<span class="cr-velocista-queue-pos">' +
                        (idx + 1) +
                        '</span>' +
                        '<span class="cr-velocista-queue-name">' +
                        CRDom.escapeHtml(teamName(teamsById, tid)) +
                        '</span>' +
                        '<span class="cr-velocista-queue-meta">' +
                        CRDom.escapeHtml(meta) +
                        '</span></li>'
                    );
                })
                .join('');

            var nowHtml = current
                ? '<div id="cr-velocista-now">' +
                  renderSoloRaceCard(current, teamsById, resByMatch[String(current.id)], 'velocista') +
                  '</div>'
                : '<p class="cr-velocista-done-all">Cola terminada. Todos los tiempos están registrados.</p>';

            if (countEl) {
                countEl.textContent =
                    pendingRuns.length > 0
                        ? doneCount +
                          ' de ' +
                          runs.length +
                          ' · ' +
                          (pendingRuns.length === 1
                              ? '1 en cola'
                              : pendingRuns.length + ' en cola')
                        : runs.length + ' carreras registradas';
            }

            listEl.innerHTML =
                '<div class="cr-velocista-panel">' +
                '<p class="cr-velocista-progress">' +
                'Orden de salida: de arriba hacia abajo. Registra el tiempo del equipo <strong>en pista</strong> y pulsa «Siguiente en pista».' +
                '</p>' +
                '<ol class="cr-velocista-queue" aria-label="Orden de carrera">' +
                queueHtml +
                '</ol>' +
                '<div class="cr-velocista-now-wrap">' +
                '<h3 class="cr-velocista-now-title">En pista</h3>' +
                nowHtml +
                '</div></div>';

            if (w.CRIcons) {
                w.CRIcons.decorate(listEl);
            }

            syncVelocistaSiguienteButton(pendingRuns.length, !!current);
            if (current) {
                focusVelocistaEnPista();
            }
            return Promise.resolve(pendingRuns.length);
        }

        function renderPartidasList(filtered, resByMatch, teamsById) {
            updateListSectionTitle(false);
            teamsById = mergeTeamsFromPartidas(filtered, teamsById || {});
            var html = filtered
                .map(function (m) {
                    var res = resByMatch[String(m.id)] || null;
                    return renderMatchCard(m, teamsById, res);
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
                    all.forEach(function (p) {
                        if (p && p.result && p.id != null) {
                            resByMatch[String(p.id)] = p.result;
                        }
                    });
                    var pendingAll = all.filter(function (p) {
                        return isPartidaPendiente(p, resByMatch);
                    });
                    var filtered = catFilter
                        ? pendingAll.filter(function (p) {
                              return String(p.category_id) === String(catFilter);
                          })
                        : pendingAll;
                    var scope = getQueueScope();
                    lastPartidasLoadCtx = {
                        catFilter: catFilter,
                        allPartidas: all,
                        resByMatch: resByMatch,
                        scope: scope
                    };
                    var catIdsScope = [];
                    var seenScope = {};
                    filtered.forEach(function (p) {
                        if (p.category_id != null && !seenScope[String(p.category_id)]) {
                            seenScope[String(p.category_id)] = true;
                            catIdsScope.push(p.category_id);
                        }
                    });

                    function renderFilteredList(list, teamsById) {
                        if (catFilter && isVelocistaCategoryId(catFilter) && lastPartidasLoadCtx) {
                            return renderVelocistaView(
                                catFilter,
                                lastPartidasLoadCtx.allPartidas,
                                lastPartidasLoadCtx.resByMatch,
                                teamsById,
                                lastPartidasLoadCtx.scope
                            );
                        }
                        var todasCompletadas =
                            !!catFilter &&
                            !list.length &&
                            all.some(function (p) {
                                return String(p.category_id) === String(catFilter);
                            });
                        if (countEl) {
                            countEl.textContent = list.length
                                ? list.length === 1
                                    ? '1 pendiente'
                                    : list.length + ' pendientes'
                                : '';
                        }
                        if (!list.length) {
                            renderEmptyList(!!catFilter, todasCompletadas);
                            return Promise.resolve(0);
                        }
                        var catIds = [];
                        var seen = {};
                        list.forEach(function (p) {
                            if (p.category_id != null && !seen[String(p.category_id)]) {
                                seen[String(p.category_id)] = true;
                                catIds.push(p.category_id);
                            }
                        });
                        if (!catIds.length) {
                            renderPartidasList(list, resByMatch, teamsById || {});
                            return Promise.resolve(list.length);
                        }
                        return loadTeamsMaps(catIds)
                            .then(function (extraTeams) {
                                var merged = teamsById || {};
                                Object.keys(extraTeams || {}).forEach(function (k) {
                                    merged[k] = extraTeams[k];
                                });
                                renderPartidasList(list, resByMatch, merged);
                                return list.length;
                            })
                            .catch(function () {
                                renderPartidasList(list, resByMatch, teamsById || {});
                                return list.length;
                            });
                    }

                    if (scope && w.CRTeamOrigin && catIdsScope.length) {
                        return loadTeamsMaps(catIdsScope)
                            .then(function (teamsById) {
                                var scoped = filtered.filter(function (p) {
                                    return w.CRTeamOrigin.partidaMatchesQueueScope(p, scope, teamsById);
                                });
                                return renderFilteredList(scoped, teamsById);
                            })
                            .then(function (n) {
                                refreshGenerarMasState();
                                return n;
                            });
                    }

                    return renderFilteredList(filtered, {}).then(function (n) {
                        refreshGenerarMasState();
                        return n;
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
                    return 0;
                });
        }

        function onListSubmit(e) {
            var form = e.target.closest('.cr-match-result-form');
            if (!form || !listEl.contains(form)) {
                return;
            }
            e.preventDefault();
            var matchId = form.getAttribute('data-match-id');
            if (!matchId) {
                return;
            }
            var btn = form.querySelector('.cr-match-save-result');
            var payload;
            try {
                payload = buildPayloadFromForm(form);
            } catch (err) {
                setStatus((err && err.message) || 'Revisa el formulario.', true);
                return;
            }
            if (btn) {
                btn.disabled = true;
            }
            setStatus('Guardando resultado…', false);
            var wasVelocista = isVelocistaCategoryId(selListFilter ? selListFilter.value : selCat.value);
            w.CRApi.postPartidaResultado(matchId, payload)
                .then(function () {
                    setStatus('Tiempo guardado. Siguiente en pista…', false);
                    return loadPartidasList().then(function () {
                        if (wasVelocista) {
                            focusVelocistaEnPista();
                        }
                    });
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo guardar el resultado.', true);
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        }

        function onIniciarClick() {
            var catId = selCat.value;
            if (!catId) {
                setStatus('Elige una categoría.', true);
                return;
            }
            var cat = selectedCategory();
            var opts = {
                categoryName: cat && cat.name ? cat.name : '',
                queueScope: persistQueueScope()
            };
            if (selMode && (selMode.value === 'pairwise' || selMode.value === 'shared')) {
                opts.mode = selMode.value;
            }
            var usedMode =
                opts.mode ||
                (w.CRApi.inferMatchMode && cat && cat.name
                    ? w.CRApi.inferMatchMode(cat.name)
                    : 'shared');

            btnIniciar.disabled = true;
            setStatus('Iniciando cola (' + modeLabel(usedMode, cat && cat.name ? cat.name : '') + ')…', false);

            w.CRApi.postPartidasIniciar(catId, opts)
                .then(function (matches) {
                    if (selListFilter) {
                        selListFilter.value = catId;
                    }
                    return loadPartidasList().then(function (pendingCount) {
                        var apiN = (matches || []).length;
                        if (
                            cat &&
                            typeof w.CRApi.isVelocistaCategory === 'function' &&
                            w.CRApi.isVelocistaCategory(cat.name) &&
                            apiN > 0
                        ) {
                            setStatus(
                                apiN === 1
                                    ? 'Cola de 1 carrera creada. Registra el tiempo en pista.'
                                    : 'Cola de ' + apiN + ' carreras creada. Uno tras otro en orden.',
                                false
                            );
                        } else if (pendingCount > 0) {
                            setStatus(
                                pendingCount === 1
                                    ? '1 partida pendiente lista para registrar.'
                                    : pendingCount + ' partidas pendientes listas para registrar.',
                                false
                            );
                        } else if (apiN > 0) {
                            setStatus(
                                'La cola respondió pero no hay partidas nuevas pendientes (puede que todos los equipos ya tengan resultado). Revisa Resultados.',
                                false
                            );
                        } else {
                            var scopeLbl =
                                w.CRTeamOrigin && opts.queueScope
                                    ? w.CRTeamOrigin.queueScopeLabel(opts.queueScope)
                                    : 'esta cola';
                            setStatus(
                                'No hay equipos validados en ' +
                                    scopeLbl +
                                    ' para nuevas partidas en esta categoría.',
                                false
                            );
                        }
                    });
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo iniciar la cola.', true);
                })
                .finally(function () {
                    syncMatchUiForCategory();
                    refreshGenerarMasState();
                });
        }

        function onGenerarMasClick() {
            var catId = selCat.value;
            if (!catId) {
                setStatus('Elige una categoría.', true);
                return;
            }
            var cat = selectedCategory();
            if (
                !cat ||
                ((typeof w.CRApi.isMinisumoCategory !== 'function' ||
                    !w.CRApi.isMinisumoCategory(cat.name)) &&
                    (typeof w.CRApi.isFutbolCategory !== 'function' ||
                        !w.CRApi.isFutbolCategory(cat.name)))
            ) {
                setStatus('Solo minisumo y fútbol permiten generar más partidas.', true);
                return;
            }
            var opts = {
                categoryName: cat.name,
                queueScope: persistQueueScope(),
                mode: 'pairwise'
            };
            if (btnGenerarMas) {
                btnGenerarMas.disabled = true;
            }
            setStatus('Generando emparejamientos…', false);
            w.CRApi.postGenerarMasPartidas(catId, opts)
                .then(function () {
                    if (selListFilter) {
                        selListFilter.value = catId;
                    }
                    return loadPartidasList();
                })
                .then(function (pendingCount) {
                    if (pendingCount > 0) {
                        setStatus(
                            pendingCount === 1
                                ? '1 partida nueva lista.'
                                : pendingCount + ' partidas nuevas listas.',
                            false
                        );
                    } else {
                        setStatus('Cola generada. Revisa la lista de pendientes.', false);
                    }
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudieron generar más partidas.', true);
                })
                .finally(function () {
                    syncMatchUiForCategory();
                    refreshGenerarMasState();
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

        function applyStaffSessionLocks() {
            var ses = w.CRStaffSesion && w.CRStaffSesion.read();
            if (!ses || !ses.username) {
                return;
            }
            var role = String(ses.role || '').toLowerCase();
            if (role !== 'juez' && role !== 'arbitro' && role !== 'registro') {
                return;
            }
            var catId =
                w.CRStaffSesion && typeof w.CRStaffSesion.primaryCategoryId === 'function'
                    ? w.CRStaffSesion.primaryCategoryId(ses)
                    : '';
            if (catId) {
                selCat.value = catId;
                selCat.disabled = true;
                if (selListFilter) {
                    selListFilter.value = catId;
                    selListFilter.disabled = true;
                }
            }
            var scope =
                w.CRStaffSesion && typeof w.CRStaffSesion.queueScope === 'function'
                    ? w.CRStaffSesion.queueScope(ses)
                    : '';
            if (scope && selQueueScope) {
                selQueueScope.value = scope === 'external' ? 'external' : 'internal';
                if (!lockedScope) {
                    selQueueScope.disabled = true;
                    selQueueScope.setAttribute('aria-disabled', 'true');
                }
                persistQueueScope();
            }
            syncMatchUiForCategory();
        }

        function fillCategorias(cats) {
            categorias =
                typeof w.CRApi.filterEventCategories === 'function'
                    ? w.CRApi.filterEventCategories(cats || [])
                    : cats || [];
            fillCategoryOptions(selCat, false);
            fillCategoryOptions(selListFilter, true);
            applyStaffSessionLocks();
            syncMatchUiForCategory();
            loadPartidasList();
        }

        function onCatChange() {
            if (
                selListFilter &&
                selCat.value &&
                isVelocistaCategoryId(selCat.value) &&
                !selListFilter.value
            ) {
                selListFilter.value = selCat.value;
            }
            syncMatchUiForCategory();
            setStatus('', false);
            loadPartidasList();
            refreshGenerarMasState();
        }

        function onListFilterChange() {
            syncMatchUiForCategory();
            loadPartidasList();
        }

        function onVelocistaSiguienteClick() {
            focusVelocistaEnPista();
        }

        function onModeChange() {
            updateModeHint();
        }

        function onQueueScopeChange() {
            if (lockedScope) {
                return;
            }
            persistQueueScope();
            loadPartidasList();
            refreshGenerarMasState();
        }

        initQueueScopeSelect();

        selCat.addEventListener('change', onCatChange, false);
        if (selListFilter) {
            selListFilter.addEventListener('change', onListFilterChange, false);
        }
        if (selMode) {
            selMode.addEventListener('change', onModeChange, false);
        }
        if (selQueueScope) {
            selQueueScope.addEventListener('change', onQueueScopeChange, false);
        }
        btnIniciar.addEventListener('click', onIniciarClick, false);
        if (btnGenerarMas) {
            btnGenerarMas.addEventListener('click', onGenerarMasClick, false);
        }
        if (btnVelocistaSiguiente) {
            btnVelocistaSiguiente.addEventListener('click', onVelocistaSiguienteClick, false);
        }
        listEl.addEventListener('submit', onListSubmit, false);

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
