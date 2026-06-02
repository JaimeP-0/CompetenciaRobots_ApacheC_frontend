/**
 * Vista #/visitante — dashboard público (en pista, próximos, resultados).
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    var POLL_MS = 12000;
    var RECENT_LIMIT = 2;
    var UPCOMING_LIMIT = 1;
    var LIVE_PAIRWISE_MAX = 6;

    if (!CRDom) {
        throw new Error('Carga core/escape-html antes de vista-visitante.js');
    }

    function bindStaffFooter(root) {
        var staffBar = root.querySelector('#cr-visitante-staff-bar');
        var label = root.querySelector('#cr-visitante-staff-label');
        var avatar = root.querySelector('.cr-visitante-staff-avatar');
        var btnLogout = root.querySelector('#cr-visitante-staff-logout');
        var guestFoot = root.querySelector('.cr-visitante-guest-foot');

        var sesion = w.CRStaffSesion && w.CRStaffSesion.read();
        var logged = !!(sesion && sesion.username);

        function roleLabel(role) {
            var r = String(role || '').toLowerCase();
            if (r === 'juez') {
                return 'Juez';
            }
            if (r === 'registro') {
                return 'Registro';
            }
            if (r === 'admin') {
                return 'Admin';
            }
            if (r === 'dev') {
                return 'Desarrollo';
            }
            if (r === 'visitante') {
                return 'Visitante';
            }
            if (r === 'arbitro') {
                return 'Árbitro';
            }
            return r || 'Staff';
        }

        if (staffBar) {
            staffBar.classList.toggle('hidden', !logged);
        }
        if (guestFoot) {
            guestFoot.classList.toggle('hidden', logged);
        }

        if (label) {
            if (logged) {
                var assign =
                    w.CRStaffSesion && typeof w.CRStaffSesion.assignmentSummary === 'function'
                        ? w.CRStaffSesion.assignmentSummary(sesion)
                        : '';
                var name = sesion.display_name || sesion.username || '';
                label.innerHTML =
                    '<strong>' +
                    CRDom.escapeHtml(name) +
                    '</strong>' +
                    '<span>' +
                    CRDom.escapeHtml(roleLabel(sesion.role) + (assign ? ' · ' + assign : '')) +
                    '</span>';
                if (avatar) {
                    avatar.textContent = name ? String(name).charAt(0).toUpperCase() : '?';
                }
            } else {
                label.textContent = '';
                if (avatar) {
                    avatar.textContent = '';
                }
            }
        }

        if (btnLogout) {
            btnLogout.classList.toggle('hidden', !logged);
        }

        if (btnLogout) {
            btnLogout.onclick = function () {
                if (w.CRStaffAuth && typeof w.CRStaffAuth.logoutAndLogin === 'function') {
                    w.CRStaffAuth.logoutAndLogin();
                    return;
                }
                if (w.CRStaffAuth && typeof w.CRStaffAuth.logout === 'function') {
                    w.CRStaffAuth.logout();
                }
                w.location.hash = '#/login';
                bindStaffFooter(root);
            };
        }
    }

    function initVisitante(outlet) {
        var root = (outlet && outlet.querySelector('#cr-visitante-root')) || outlet;
        if (!root || !w.CRApi || typeof w.CRApi.getPartidas !== 'function') {
            return;
        }

        var selCat = root.querySelector('#cr-visitante-cat');
        var inputSchool = root.querySelector('#cr-visitante-school');
        var schoolHint = root.querySelector('#cr-visitante-school-hint');
        var liveEl = root.querySelector('#cr-visitante-live');
        var upcomingEl = root.querySelector('#cr-visitante-upcoming');
        var recentEl = root.querySelector('#cr-visitante-recent');
        if (!selCat || !liveEl || !upcomingEl || !recentEl) {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(root);
        }

        bindStaffFooter(root);
        applyStaffSessionUi();

        function guestScope() {
            if (!w.CRTeamOrigin) {
                return '';
            }
            var school =
                (inputSchool && String(inputSchool.value || '').trim()) ||
                w.CRTeamOrigin.readStoredGuestSchool();
            if (!school) {
                return '';
            }
            return w.CRTeamOrigin.guestQueueScopeFromSchool(school);
        }

        function queueScope() {
            var ses = w.CRStaffSesion && w.CRStaffSesion.read();
            if (ses && w.CRStaffSesion && typeof w.CRStaffSesion.queueScope === 'function') {
                var staffScope = w.CRStaffSesion.queueScope(ses);
                if (staffScope) {
                    return staffScope;
                }
            }
            return guestScope();
        }

        function applyStaffSessionUi() {
            var ses = w.CRStaffSesion && w.CRStaffSesion.read();
            if (!ses) {
                return;
            }
            var schoolWrap = root.querySelector('.cr-visitante-dash-filter--school');
            var staffScope =
                w.CRStaffSesion && typeof w.CRStaffSesion.queueScope === 'function'
                    ? w.CRStaffSesion.queueScope(ses)
                    : '';
            if (staffScope && schoolWrap) {
                schoolWrap.classList.add('hidden');
            }
            if (!selCat) {
                return;
            }
            var catId =
                w.CRStaffSesion && typeof w.CRStaffSesion.primaryCategoryId === 'function'
                    ? w.CRStaffSesion.primaryCategoryId(ses)
                    : ses.category_id != null
                      ? String(ses.category_id)
                      : '';
            if (catId) {
                selCat.value = catId;
                selCat.disabled = true;
                return;
            }
            if (ses.category) {
                var i;
                for (i = 0; i < selCat.options.length; i++) {
                    if (selCat.options[i].text === ses.category) {
                        selCat.value = selCat.options[i].value;
                        selCat.disabled = true;
                        break;
                    }
                }
            }
        }

        function updateSchoolHint() {
            if (!schoolHint || !w.CRTeamOrigin) {
                return;
            }
            var school =
                (inputSchool && String(inputSchool.value || '').trim()) ||
                w.CRTeamOrigin.readStoredGuestSchool();
            if (!school) {
                schoolHint.textContent = 'Indica tu escuela para ver internos (UTNC) o solo externos.';
                return;
            }
            if (w.CRTeamOrigin.isInternalSchool(school)) {
                schoolHint.textContent = 'UTNC: mostrando encuentros de equipos internos.';
            } else {
                schoolHint.textContent = 'Escuela externa: solo encuentros de equipos externos.';
            }
        }

        function persistGuestSchool() {
            if (!inputSchool || !w.CRTeamOrigin) {
                return;
            }
            var school = String(inputSchool.value || '').trim();
            w.CRTeamOrigin.storeGuestSchool(school);
            var scope = queueScope();
            if (scope) {
                w.CRTeamOrigin.storeQueueScope(scope);
            }
            updateSchoolHint();
        }

        if (inputSchool && w.CRTeamOrigin) {
            var storedSchool = w.CRTeamOrigin.readStoredGuestSchool();
            if (storedSchool) {
                inputSchool.value = storedSchool;
            }
            updateSchoolHint();
            inputSchool.addEventListener(
                'change',
                function () {
                    persistGuestSchool();
                    refresh(true);
                },
                false
            );
        }

        var categorias = [];
        var teamsById = {};
        var pollTimer = null;
        var loadInflight = false;

        if (root._crVisitantePoll) {
            clearInterval(root._crVisitantePoll);
            root._crVisitantePoll = null;
        }

        function stopPoll() {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        }

        function startPoll() {
            stopPoll();
            pollTimer = setInterval(function () {
                refresh(false);
            }, POLL_MS);
            root._crVisitantePoll = pollTimer;
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

        function isEventCategoryName(name) {
            if (w.CRCategoriasCompetencia && w.CRCategoriasCompetencia.isEventCategoryName) {
                return w.CRCategoriasCompetencia.isEventCategoryName(name);
            }
            return true;
        }

        function teamName(teamId) {
            if (teamId == null) {
                return '—';
            }
            var t = teamsById[String(teamId)];
            if (t && t.name) {
                return String(t.name).trim();
            }
            return 'Equipo #' + teamId;
        }

        function teamMeta(teamId) {
            if (teamId == null) {
                return { school: '', tutor: '', captain: '' };
            }
            var t = teamsById[String(teamId)] || {};
            var school = t.school != null ? String(t.school).trim() : '';
            var tutorRaw =
                t.teacher != null
                    ? t.teacher
                    : t.tutor != null
                      ? t.tutor
                      : t.asesor != null
                        ? t.asesor
                        : t.advisor;
            var tutor = tutorRaw != null ? String(tutorRaw).trim() : '';
            var captainRaw = t.captain_name != null ? t.captain_name : t.capitan;
            var captain = captainRaw != null ? String(captainRaw).trim() : '';
            return {
                school: school,
                tutor: tutor,
                captain: captain
            };
        }

        function formatTeamMetaLine(teamId) {
            var meta = teamMeta(teamId);
            var parts = [];
            if (meta.school) {
                parts.push('Escuela: ' + meta.school);
            }
            if (meta.tutor) {
                parts.push('Tutor: ' + meta.tutor);
            }
            if (meta.captain) {
                parts.push('Capitán: ' + meta.captain);
            }
            return parts.join(' · ');
        }

        function formatTeamMetaSubtitle(teamId) {
            var meta = teamMeta(teamId);
            var parts = [];
            if (meta.school) {
                parts.push(meta.school);
            }
            if (meta.tutor) {
                parts.push(meta.tutor);
            }
            if (meta.captain) {
                parts.push(meta.captain);
            }
            return parts.join(' - ');
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

        function isPartidaComplete(partida, resByMatch) {
            var res = resByMatch[String(partida.id)] || partida.result || null;
            var catName = categoryLabel(partida.category_id);
            if (typeof w.CRApi.isPartidaResultComplete === 'function') {
                return w.CRApi.isPartidaResultComplete(res, catName);
            }
            return !!res;
        }

        function isVelocistaName(name) {
            return typeof w.CRApi.isVelocistaCategory === 'function' && w.CRApi.isVelocistaCategory(name);
        }

        function isPairwisePartida(p) {
            return (
                p.mode === 'pairwise' ||
                (p.team_a_id != null && p.team_b_id != null) ||
                !!(p.team_a && p.team_b)
            );
        }

        function isSoloPartida(p) {
            if (isPairwisePartida(p)) {
                return false;
            }
            return (p.queue && p.queue.length === 1) || (p.team_a_id != null && p.team_b_id == null);
        }

        function teamIdsFromPartida(p) {
            var ids = [];
            if (p.team_a_id != null) {
                ids.push(p.team_a_id);
            }
            if (p.team_b_id != null) {
                ids.push(p.team_b_id);
            }
            (p.queue || []).forEach(function (tid) {
                if (tid != null) {
                    ids.push(tid);
                }
            });
            return ids;
        }

        function matchesScope(partida, scope) {
            if (!scope || !w.CRTeamOrigin) {
                return true;
            }
            if (
                partida &&
                partida.is_internal != null &&
                typeof w.CRTeamOrigin.scopeFromIsInternal === 'function'
            ) {
                return w.CRTeamOrigin.scopeFromIsInternal(partida.is_internal) === scope;
            }
            return w.CRTeamOrigin.partidaMatchesQueueScope(partida, scope, teamsById);
        }

        function formatTime(res) {
            if (!res || !res.time) {
                return '';
            }
            if (typeof w.CRApi.formatResultTime === 'function') {
                return w.CRApi.formatResultTime(res.time);
            }
            return '';
        }

        function winnerIdFromResultado(res) {
            if (!res) {
                return null;
            }
            var id =
                res.team_id != null
                    ? res.team_id
                    : res.winner != null
                      ? res.winner
                      : res.winner_team_id;
            return id != null ? id : null;
        }

        function describeMatchup(p, resByMatch) {
            var catName = categoryLabel(p.category_id);
            if (isVelocistaName(catName) || isSoloPartida(p)) {
                var tid =
                    (p.queue && p.queue[0]) || p.team_a_id || (p.team_a && p.team_a.id);
                return {
                    type: 'solo',
                    label: teamName(tid),
                    sub: 'Carrera individual'
                };
            }
            var ta = p.team_a_id || (p.team_a && p.team_a.id);
            var tb = p.team_b_id || (p.team_b && p.team_b.id);
            return {
                type: 'pair',
                label: teamName(ta) + ' vs ' + teamName(tb),
                sub:
                    typeof w.CRApi.isFutbolCategory === 'function' && w.CRApi.isFutbolCategory(catName)
                        ? 'Fútbol 2v2'
                        : '1 vs 1'
            };
        }

        function describeResult(p, resByMatch) {
            var res = resByMatch[String(p.id)] || p.result || null;
            var catName = categoryLabel(p.category_id);
            var matchup = describeMatchup(p, resByMatch);
            if (isVelocistaName(catName)) {
                var tid =
                    winnerIdFromResultado(res) ||
                    (p.queue && p.queue[0]) ||
                    p.team_a_id;
                return {
                    headline: teamName(tid),
                    detail: formatTime(res) ? 'Tiempo ' + formatTime(res) : '—'
                };
            }
            var winner = winnerIdFromResultado(res);
            return {
                headline: winner != null ? teamName(winner) + ' ganó' : 'Resultado',
                detail: matchup.label
            };
        }

        function partitionPartidas(allPartidas, resByMatch, catFilter, scope) {
            var pending = [];
            var completed = [];

            (allPartidas || []).forEach(function (p) {
                if (!p || p.id == null) {
                    return;
                }
                var catName = categoryLabel(p.category_id);
                if (!isEventCategoryName(catName)) {
                    return;
                }
                if (catFilter && String(p.category_id) !== String(catFilter)) {
                    return;
                }
                if (!matchesScope(p, scope)) {
                    return;
                }
                if (isPartidaComplete(p, resByMatch)) {
                    completed.push(p);
                } else {
                    pending.push(p);
                }
            });

            completed.sort(function (a, b) {
                return Number(b.id) - Number(a.id);
            });

            var byCat = {};
            pending.forEach(function (p) {
                var key = String(p.category_id);
                if (!byCat[key]) {
                    byCat[key] = [];
                }
                byCat[key].push(p);
            });

            var live = [];
            var upcoming = [];

            Object.keys(byCat).forEach(function (catKey) {
                var list = byCat[catKey].slice().sort(function (a, b) {
                    return Number(a.id) - Number(b.id);
                });
                var catName = categoryLabel(catKey);
                if (isVelocistaName(catName)) {
                    if (list.length) {
                        live.push(list[0]);
                    }
                    upcoming = upcoming.concat(list.slice(1));
                    return;
                }
                list.forEach(function (p, idx) {
                    if (idx < LIVE_PAIRWISE_MAX) {
                        live.push(p);
                    } else {
                        upcoming.push(p);
                    }
                });
            });

            return {
                live: live,
                upcoming: upcoming.slice(0, UPCOMING_LIMIT),
                recent: completed.slice(0, RECENT_LIMIT)
            };
        }

        function renderEmptyBlock(msg, extraClass) {
            var cls = 'cr-visitante-empty' + (extraClass ? ' ' + extraClass : '');
            return '<p class="' + cls + '">' + CRDom.escapeHtml(msg) + '</p>';
        }

        function renderLiveCard(p, resByMatch) {
            var catName = categoryLabel(p.category_id);
            var matchup = describeMatchup(p, resByMatch);
            var body = '';

            if (matchup.type === 'pair') {
                var parts = matchup.label.split(' vs ');
                var ta = p.team_a_id || (p.team_a && p.team_a.id);
                var tb = p.team_b_id || (p.team_b && p.team_b.id);
                var titleA = parts[0] || '—';
                var titleB = parts[1] || '—';
                var metaA = formatTeamMetaSubtitle(ta);
                var metaB = formatTeamMetaSubtitle(tb);
                body =
                    '<div class="cr-visitante-match">' +
                    '<span class="cr-visitante-match-side">' +
                    '<span class="cr-visitante-match-title">' +
                    CRDom.escapeHtml(titleA) +
                    '</span>' +
                    (metaA
                        ? '<span class="cr-visitante-match-subtitle">' + CRDom.escapeHtml(metaA) + '</span>'
                        : '') +
                    '</span>' +
                    '<span class="cr-visitante-match-vs">VS</span>' +
                    '<span class="cr-visitante-match-side">' +
                    '<span class="cr-visitante-match-title">' +
                    CRDom.escapeHtml(titleB) +
                    '</span>' +
                    (metaB
                        ? '<span class="cr-visitante-match-subtitle">' + CRDom.escapeHtml(metaB) + '</span>'
                        : '') +
                    '</span>' +
                    '</div>' +
                    '<p class="cr-visitante-match-meta">' +
                    CRDom.escapeHtml(matchup.sub) +
                    '</p>';
            } else {
                var soloId = (p.queue && p.queue[0]) || p.team_a_id || (p.team_a && p.team_a.id);
                var soloMeta = formatTeamMetaLine(soloId);
                body =
                    '<p class="cr-visitante-match-solo">' +
                    CRDom.escapeHtml(matchup.label) +
                    '</p>' +
                    (soloMeta
                        ? '<p class="cr-visitante-team-meta cr-visitante-team-meta--solo">' +
                          CRDom.escapeHtml(soloMeta) +
                          '</p>'
                        : '') +
                    '<p class="cr-visitante-match-meta">' +
                    CRDom.escapeHtml(matchup.sub) +
                    '</p>';
            }

            return (
                '<article class="cr-visitante-live-card">' +
                '<div class="cr-visitante-live-card-top">' +
                '<span class="cr-visitante-tag cr-visitante-tag--cat">' +
                CRDom.escapeHtml(catName) +
                '</span>' +
                '<span class="cr-visitante-tag cr-visitante-tag--live">En pista</span>' +
                '</div>' +
                body +
                '</article>'
            );
        }

        function renderQueueRow(p, resByMatch, variant, index) {
            var catName = categoryLabel(p.category_id);
            var badge = variant === 'upcoming' ? 'En cola' : 'Final';
            var main = '';
            var sub = '';

            if (variant === 'recent') {
                var resInfo = describeResult(p, resByMatch);
                main = resInfo.headline;
                sub = resInfo.detail;
            } else {
                var matchup = describeMatchup(p, resByMatch);
                main = matchup.label;
                sub = matchup.sub;
            }

            var pos =
                variant === 'upcoming' && index != null
                    ? '<span class="cr-visitante-queue-pos" aria-hidden="true">' + (index + 1) + '</span>'
                    : '';

            return (
                '<article class="cr-visitante-queue-item' +
                (variant === 'recent' ? ' cr-visitante-queue-item--done' : '') +
                '">' +
                pos +
                '<div class="cr-visitante-queue-body">' +
                '<span class="cr-visitante-tag cr-visitante-tag--cat">' +
                CRDom.escapeHtml(catName) +
                '</span>' +
                '<p class="cr-visitante-queue-title">' +
                CRDom.escapeHtml(main) +
                '</p>' +
                (sub
                    ? '<p class="cr-visitante-queue-sub">' + CRDom.escapeHtml(sub) + '</p>'
                    : '') +
                '</div>' +
                '<span class="cr-visitante-tag cr-visitante-tag--badge">' +
                CRDom.escapeHtml(badge) +
                '</span>' +
                '</article>'
            );
        }

        function renderCard(p, resByMatch, variant, index) {
            if (variant === 'live') {
                return renderLiveCard(p, resByMatch);
            }
            return renderQueueRow(p, resByMatch, variant, index);
        }

        function setPanelCount(id, n) {
            var el = root.querySelector(id);
            if (!el) {
                return;
            }
            el.textContent = String(n);
            el.classList.toggle('cr-visitante-panel-count--zero', !n);
        }

        function setUpdatedLabel(manual) {
            return manual;
        }

        function loadTeamsForPartidas(partidas) {
            var catIds = [];
            var seen = {};
            (partidas || []).forEach(function (p) {
                if (p.category_id != null && !seen[String(p.category_id)]) {
                    seen[String(p.category_id)] = true;
                    catIds.push(p.category_id);
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
                (partidas || []).forEach(function (p) {
                    if (p.team_a && p.team_a.id != null) {
                        teamsById[String(p.team_a.id)] = p.team_a;
                    }
                    if (p.team_b && p.team_b.id != null) {
                        teamsById[String(p.team_b.id)] = p.team_b;
                    }
                });
                populateSchoolSelect();
            });
        }

        function populateSchoolSelect() {
            if (!inputSchool) {
                return;
            }
            var current = String(inputSchool.value || '').trim();
            var set = {};
            var schools = [];

            function addSchool(raw) {
                var s = String(raw || '').trim();
                if (!s) {
                    return;
                }
                var key = s.toLowerCase();
                if (set[key]) {
                    return;
                }
                set[key] = true;
                schools.push(s);
            }

            addSchool('Universidad Tecnológica del Norte de Coahuila');
            addSchool('UTNC');
            Object.keys(teamsById).forEach(function (id) {
                var t = teamsById[id];
                if (t && t.school != null) {
                    addSchool(t.school);
                }
            });

            schools.sort(function (a, b) {
                return a.localeCompare(b, 'es', { sensitivity: 'base' });
            });

            var html = '<option value="">Selecciona tu escuela</option>';
            schools.forEach(function (s) {
                html +=
                    '<option value="' +
                    CRDom.escapeHtml(s) +
                    '">' +
                    CRDom.escapeHtml(s) +
                    '</option>';
            });
            inputSchool.innerHTML = html;
            if (current && set[current.toLowerCase()]) {
                inputSchool.value = current;
            }
        }

        function renderDashboard(parts, resByMatch) {
            setPanelCount('#cr-visitante-live-count', parts.live.length);
            setPanelCount('#cr-visitante-upcoming-count', parts.upcoming.length);
            setPanelCount('#cr-visitante-recent-count', parts.recent.length);

            liveEl.innerHTML = parts.live.length
                ? parts.live
                      .map(function (p) {
                          return renderCard(p, resByMatch, 'live');
                      })
                      .join('')
                : renderEmptyBlock('Nadie en pista ahora mismo en este filtro.');

            upcomingEl.innerHTML = parts.upcoming.length
                ? parts.upcoming
                      .map(function (p, i) {
                          return renderCard(p, resByMatch, 'upcoming', i);
                      })
                      .join('')
                : renderEmptyBlock('No hay encuentros en cola de espera.');

            recentEl.innerHTML = parts.recent.length
                ? parts.recent
                      .map(function (p, i) {
                          return renderCard(p, resByMatch, 'recent', i);
                      })
                      .join('')
                : renderEmptyBlock('Aún no hay resultados registrados.');
        }

        function refresh(manual) {
            if (loadInflight) {
                return Promise.resolve();
            }
            loadInflight = true;
            if (manual) {
                liveEl.innerHTML = '<p class="cr-visitante-empty">Actualizando…</p>';
            }
            var catFilter = selCat.value || '';
            var scope = queueScope();

            return Promise.all([
                w.CRApi.getPartidas(),
                typeof w.CRApi.getPartidaResultados === 'function'
                    ? w.CRApi.getPartidaResultados().catch(function () {
                          return [];
                      })
                    : Promise.resolve([])
            ])
                .then(function (arr) {
                    var all = arr[0] || [];
                    var resByMatch = indexResultados(arr[1]);
                    all.forEach(function (p) {
                        if (p && p.result && p.id != null) {
                            resByMatch[String(p.id)] = p.result;
                        }
                    });
                    return loadTeamsForPartidas(all).then(function () {
                        var parts = partitionPartidas(all, resByMatch, catFilter, scope);
                        renderDashboard(parts, resByMatch);
                        setUpdatedLabel(!!manual);
                    });
                })
                .catch(function () {
                    liveEl.innerHTML = renderEmptyBlock(
                        'No se pudo cargar el tablero. Comprueba la conexión.'
                    );
                    upcomingEl.innerHTML = '';
                    recentEl.innerHTML = '';
                })
                .finally(function () {
                    loadInflight = false;
                });
        }

        function fillCategories(cats) {
            categorias =
                typeof w.CRApi.filterEventCategories === 'function'
                    ? w.CRApi.filterEventCategories(cats || [])
                    : cats || [];
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
            applyStaffSessionUi();
            bindStaffFooter(root);
        }

        function onFilterChange() {
            refresh(true);
        }

        selCat.addEventListener('change', onFilterChange, false);

        if (w.CRApi.fetchCategorias) {
            w.CRApi.fetchCategorias()
                .then(fillCategories)
                .then(function () {
                    return refresh(true);
                })
                .then(startPoll)
                .catch(function () {
                    fillCategories([]);
                    refresh(true).then(startPoll);
                });
        } else {
            fillCategories([]);
            refresh(true).then(startPoll);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.visitante = initVisitante;
})(window);
