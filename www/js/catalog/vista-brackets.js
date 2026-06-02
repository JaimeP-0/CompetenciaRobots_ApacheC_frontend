/**
 * Vista #/brackets — cuadro vertical (actual + siguiente) y lista de eliminados.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    var Engine = w.CRBracketEngine;
    var BracketsApi = w.CRApiBrackets;
    if (!CRDom || !Engine || !BracketsApi) {
        throw new Error('Carga bracket-engine, brackets.js y core/escape-html');
    }

    function initBrackets(outlet) {
        var root = (outlet && outlet.querySelector('#cr-brackets-root')) || outlet;
        if (!root || !w.CRApi || typeof w.CRApi.getBracket !== 'function') {
            return;
        }

        var selCat = root.querySelector('#cr-brackets-cat');
        var selQueueScope = root.querySelector('#cr-brackets-queue-scope');
        var tabWinner = root.querySelector('#cr-brackets-tab-winner');
        var tabLoser = root.querySelector('#cr-brackets-tab-loser');
        var btnGenerar = root.querySelector('#cr-brackets-generar');
        var btnRefresh = root.querySelector('#cr-brackets-refresh');
        var metaEl = root.querySelector('#cr-brackets-meta');
        var statusEl = root.querySelector('#cr-brackets-status');
        var boardWrap = root.querySelector('#cr-brackets-board-wrap');
        var loserPanel = root.querySelector('#cr-brackets-loser-panel');
        var colCurrent = root.querySelector('#cr-brackets-col-current');
        var colNext = root.querySelector('#cr-brackets-col-next');
        var roundFooterEl = root.querySelector('#cr-brackets-round-footer');
        var roundDoneMsgEl = root.querySelector('#cr-brackets-round-done-msg');
        var btnNextRound = root.querySelector('#cr-brackets-next-round');
        var championEl = root.querySelector('#cr-brackets-champion');
        var emptyEl = root.querySelector('#cr-brackets-empty');
        if (!selCat || !btnGenerar || !colCurrent || !colNext) {
            return;
        }

        if (w.CRIcons) {
            w.CRIcons.decorate(root);
        }

        var sumoCats = [];
        var view = null;
        var teamsById = {};
        var activeTab = 'winner';

        function getQueueScope() {
            if (!selQueueScope) {
                return '';
            }
            if (w.CRTeamOrigin && typeof w.CRTeamOrigin.normalizeQueueScope === 'function') {
                return w.CRTeamOrigin.normalizeQueueScope(selQueueScope.value);
            }
            return String(selQueueScope.value || '').trim().toLowerCase();
        }

        function bracketOpts(extra) {
            var opts = { queueScope: getQueueScope() };
            if (extra) {
                Object.keys(extra).forEach(function (k) {
                    opts[k] = extra[k];
                });
            }
            return opts;
        }

        function initQueueScopeSelect() {
            if (!selQueueScope || !w.CRTeamOrigin) {
                return;
            }
            var stored = w.CRTeamOrigin.readStoredQueueScope();
            if (stored) {
                selQueueScope.value = stored;
            }
        }

        function persistQueueScope() {
            var scope = getQueueScope();
            if (scope && w.CRTeamOrigin) {
                w.CRTeamOrigin.storeQueueScope(scope);
            }
            return scope;
        }

        function setStatus(msg, isError) {
            if (!statusEl) {
                return;
            }
            if (!msg) {
                statusEl.classList.add('hidden');
                statusEl.textContent = '';
                statusEl.classList.remove('cr-brackets-status--error');
                return;
            }
            statusEl.textContent = msg;
            statusEl.classList.remove('hidden');
            statusEl.classList.toggle('cr-brackets-status--error', !!isError);
        }

        function isSumoCat(cat) {
            if (!cat || !cat.name) {
                return false;
            }
            return typeof w.CRApi.isSumoCategory === 'function' && w.CRApi.isSumoCategory(cat.name);
        }

        function teamName(teamId) {
            if (teamId == null) {
                return 'Por definir';
            }
            var t = teamsById[String(teamId)];
            if (t && t.name) {
                return String(t.name).trim();
            }
            return 'Equipo #' + teamId;
        }

        function syncTabUi() {
            var isWinner = activeTab === 'winner';
            if (tabWinner) {
                tabWinner.classList.toggle('cr-brackets-tab--active', isWinner);
                tabWinner.setAttribute('aria-selected', isWinner ? 'true' : 'false');
            }
            if (tabLoser) {
                tabLoser.classList.toggle('cr-brackets-tab--active', !isWinner);
                tabLoser.setAttribute('aria-selected', !isWinner ? 'true' : 'false');
            }
            if (boardWrap) {
                boardWrap.classList.toggle('hidden', !isWinner);
            }
            if (loserPanel) {
                loserPanel.classList.toggle('hidden', isWinner);
            }
        }

        function syncButtons() {
            btnGenerar.disabled = !selCat.value || activeTab !== 'winner';
            if (btnRefresh) {
                btnRefresh.disabled = !selCat.value;
            }
        }

        function showEmpty(show) {
            if (emptyEl) {
                emptyEl.classList.toggle('hidden', !show || activeTab !== 'winner');
            }
        }

        function loadTeams(categoryId) {
            if (!categoryId || typeof w.CRApi.getEquiposByCategory !== 'function') {
                return Promise.resolve();
            }
            return w.CRApi.getEquiposByCategory(categoryId)
                .then(function (teams) {
                    (teams || []).forEach(function (t) {
                        if (t && t.id != null) {
                            teamsById[String(t.id)] = t;
                        }
                    });
                })
                .catch(function () {
                    /* fallback nombres */
                });
        }

        function updateTabCounts(pair) {
            var alive = pair && pair.winner ? (pair.winner.aliveTeamIds || []).length : 0;
            var elim = pair && pair.loser ? pair.loser.count || 0 : 0;
            if (tabWinner) {
                tabWinner.textContent = alive > 0 ? 'En competencia (' + alive + ')' : 'En competencia';
            }
            if (tabLoser) {
                tabLoser.textContent = elim > 0 ? 'Eliminados (' + elim + ')' : 'Eliminados';
            }
        }

        function renderMeta(v) {
            if (!metaEl) {
                return;
            }
            if (!v || v.isList) {
                metaEl.textContent = '';
                return;
            }
            var pending = (v.currentMatches || []).filter(function (m) {
                return Engine.isMatchReady(m);
            }).length;
            metaEl.textContent =
                (v.aliveTeamIds || []).length +
                ' equipos vivos' +
                (pending ? ' · ' + pending + ' combate(s) pendiente(s)' : '') +
                (v.eliminatedCount ? ' · ' + v.eliminatedCount + ' eliminado(s)' : '');
        }

        function renderMatchActions(match) {
            if (!Engine.isMatchReady(match)) {
                return '';
            }
            return (
                '<div class="cr-brackets-match-actions">' +
                '<button type="button" class="cr-brackets-pick-winner" data-match-key="' +
                CRDom.escapeHtml(match.key) +
                '" data-team-id="' +
                CRDom.escapeHtml(String(match.teamA)) +
                '">Gana ' +
                CRDom.escapeHtml(teamName(match.teamA)) +
                '</button>' +
                '<button type="button" class="cr-brackets-pick-winner" data-match-key="' +
                CRDom.escapeHtml(match.key) +
                '" data-team-id="' +
                CRDom.escapeHtml(String(match.teamB)) +
                '">Gana ' +
                CRDom.escapeHtml(teamName(match.teamB)) +
                '</button></div>'
            );
        }

        function renderTeamSlot(teamId, isWinner, isLoser) {
            var cls = 'cr-brackets-slot';
            if (teamId == null) {
                return '<div class="' + cls + ' cr-brackets-slot--tbd">Por definir</div>';
            }
            if (isWinner) {
                cls += ' cr-brackets-slot--winner';
            }
            if (isLoser) {
                cls += ' cr-brackets-slot--loser';
            }
            return '<div class="' + cls + '">' + CRDom.escapeHtml(teamName(teamId)) + '</div>';
        }

        function renderMatchCard(match, isPreview) {
            var winner = match.winner;
            var status = match.status || 'pending';
            if (Engine.isMatchCompleted(match)) {
                status = 'completed';
            }
            var cls =
                'cr-brackets-match cr-brackets-match--vertical cr-brackets-match--' +
                status +
                (isPreview ? ' cr-brackets-match--preview' : '');
            return (
                '<article class="' +
                cls +
                '" data-match-key="' +
                CRDom.escapeHtml(match.key) +
                '">' +
                renderTeamSlot(match.teamA, winner === match.teamA, winner != null && winner !== match.teamA) +
                '<span class="cr-brackets-vs" aria-hidden="true">vs</span>' +
                renderTeamSlot(match.teamB, winner === match.teamB, winner != null && winner !== match.teamB) +
                (isPreview ? '' : renderMatchActions(match)) +
                '</article>'
            );
        }

        function renderWinnerBoard(v) {
            var current = v.currentMatches || [];
            var preview = v.nextPreview || [];

            if (current.length) {
                colCurrent.innerHTML = current.map(function (m) {
                    return renderMatchCard(m, false);
                }).join('');
            } else {
                colCurrent.innerHTML =
                    '<p class="cr-brackets-col-empty">No hay combates activos en esta ronda.</p>';
            }

            if (preview.length) {
                colNext.innerHTML = preview
                    .map(function (m) {
                        return renderMatchCard(m, true);
                    })
                    .join('');
            } else if (v.champion != null) {
                colNext.innerHTML =
                    '<p class="cr-brackets-col-empty cr-brackets-col-empty--champion">Campeón: <strong>' +
                    CRDom.escapeHtml(teamName(v.champion)) +
                    '</strong></p>';
            } else {
                colNext.innerHTML =
                    '<p class="cr-brackets-col-empty">Los ganadores de la ronda actual aparecerán aquí emparejados.</p>';
            }

            var hasContent = current.length > 0 || preview.length > 0 || v.champion != null;
            showEmpty(!hasContent);

            if (championEl) {
                if (v.champion != null) {
                    championEl.classList.remove('hidden');
                    championEl.innerHTML =
                        '<span class="cr-brackets-champion-label">Campeón</span> ' +
                        '<strong class="cr-brackets-champion-name">' +
                        CRDom.escapeHtml(teamName(v.champion)) +
                        '</strong>';
                } else {
                    championEl.classList.add('hidden');
                    championEl.innerHTML = '';
                }
            }

            if (roundFooterEl && btnNextRound) {
                if (BracketsApi.canAdvanceBracket(v)) {
                    roundFooterEl.classList.remove('hidden');
                    btnNextRound.classList.remove('hidden');
                    btnNextRound.textContent = 'Iniciar siguiente ronda';
                    if (roundDoneMsgEl) {
                        roundDoneMsgEl.textContent =
                            'Ronda completada. Solo los ganadores pasan — los eliminados no vuelven a entrar.';
                        roundDoneMsgEl.classList.remove('hidden');
                    }
                } else {
                    roundFooterEl.classList.add('hidden');
                    btnNextRound.classList.add('hidden');
                    if (roundDoneMsgEl) {
                        roundDoneMsgEl.classList.add('hidden');
                    }
                }
            }

            renderMeta(v);
            syncButtons();
        }

        function renderLoserList(listView) {
            if (!loserPanel) {
                return;
            }
            var items = (listView && listView.eliminatedList) || [];
            if (!items.length) {
                loserPanel.innerHTML =
                    '<div class="cr-brackets-loser-empty">' +
                    '<p class="cr-brackets-loser-empty-title">Sin eliminados aún</p>' +
                    '<p class="cr-brackets-loser-empty-desc">Cuando un equipo pierda en el cuadro principal, aparecerá aquí. No vuelve a competir.</p>' +
                    '</div>';
                return;
            }
            var html =
                '<div class="cr-brackets-loser-header">' +
                '<h2 class="cr-brackets-loser-title">Equipos eliminados</h2>' +
                '<p class="cr-brackets-loser-desc">' +
                items.length +
                ' equipo(s) fuera del cuadro principal. Solo registro — no compiten de nuevo.</p>' +
                '</div>' +
                '<ul class="cr-brackets-loser-list">';
            items.forEach(function (item) {
                html +=
                    '<li class="cr-brackets-loser-item">' +
                    '<span class="cr-brackets-loser-name">' +
                    CRDom.escapeHtml(teamName(item.teamId)) +
                    '</span>' +
                    '<span class="cr-brackets-loser-meta">#' +
                    CRDom.escapeHtml(String(item.teamId)) +
                    '</span>' +
                    '</li>';
            });
            html += '</ul>';
            loserPanel.innerHTML = html;
        }

        function applyView(data) {
            view = data;
            var catId = selCat.value;
            return loadTeams(catId).then(function () {
                if (activeTab === 'loser') {
                    renderLoserList(data);
                    showEmpty(false);
                } else {
                    if (data && !data.isList) {
                        renderWinnerBoard(data);
                    } else {
                        showEmpty(true);
                        if (emptyEl) {
                            var desc = emptyEl.querySelector('.cr-brackets-empty-desc');
                            if (desc) {
                                desc.textContent =
                                    'Elige categoría y pulsa «Iniciar cola» para emparejar solo equipos vivos.';
                            }
                        }
                    }
                }
                syncTabUi();
            });
        }

        function refreshPairCounts(catId) {
            return w.CRApi.getBracketPair(catId, bracketOpts())
                .then(updateTabCounts)
                .catch(function () {
                    /* opcional */
                });
        }

        function loadView(catId) {
            if (!catId) {
                view = null;
                showEmpty(true);
                renderMeta(null);
                syncButtons();
                syncTabUi();
                return Promise.resolve();
            }
            var type = activeTab === 'loser' ? 'loser' : 'winner';
            return w.CRApi.getBracket(catId, bracketOpts({ bracketType: type }))
                .then(function (data) {
                    return applyView(data);
                })
                .then(function () {
                    return refreshPairCounts(catId);
                });
        }

        function onGenerar() {
            var catId = selCat.value;
            if (!catId) {
                setStatus('Elige una categoría sumo.', true);
                return;
            }
            btnGenerar.disabled = true;
            setStatus('Generando partidas…', false);
            persistQueueScope();
            w.CRApi.postBracketIniciar(catId, bracketOpts())
                .then(function (v) {
                    activeTab = 'winner';
                    syncTabUi();
                    setStatus(v && v.hasActiveCombats ? 'Partidas creadas.' : 'Cola iniciada.', false);
                    return applyView(v);
                })
                .then(function () {
                    return refreshPairCounts(catId);
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo generar partidas.', true);
                })
                .finally(function () {
                    syncButtons();
                });
        }

        function onRefresh() {
            var catId = selCat.value;
            if (!catId) {
                return;
            }
            setStatus('Actualizando…', false);
            loadView(catId)
                .then(function () {
                    setStatus('', false);
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo actualizar.', true);
                });
        }

        function onNextRound() {
            var catId = selCat.value;
            if (!view || !BracketsApi.canAdvanceBracket(view)) {
                return;
            }
            btnNextRound.disabled = true;
            setStatus('Creando siguiente ronda…', false);
            BracketsApi.advanceBracketRound(catId, bracketOpts())
                .then(function (v) {
                    setStatus('Siguiente ronda lista.', false);
                    return applyView(v);
                })
                .then(function () {
                    return refreshPairCounts(catId);
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo iniciar la ronda.', true);
                })
                .finally(function () {
                    btnNextRound.disabled = false;
                });
        }

        function onBoardClick(e) {
            var btn = e.target.closest('.cr-brackets-pick-winner');
            if (!btn || !boardWrap || !boardWrap.contains(btn)) {
                return;
            }
            var matchKey = btn.getAttribute('data-match-key');
            var teamId = btn.getAttribute('data-team-id');
            var catId = selCat.value;
            if (!matchKey || !teamId || !catId || !view || view.isList) {
                return;
            }
            btn.disabled = true;
            setStatus('Registrando ganador…', false);
            w.CRApi.postBracketWinner(catId, view, matchKey, teamId, bracketOpts())
                .then(function (updated) {
                    setStatus('Ganador registrado. El perdedor queda eliminado.', false);
                    return applyView(updated);
                })
                .then(function () {
                    return refreshPairCounts(catId);
                })
                .catch(function (err) {
                    setStatus((err && err.message) || 'No se pudo registrar.', true);
                    btn.disabled = false;
                });
        }

        function onTabChange(tab) {
            if (activeTab === tab) {
                return;
            }
            activeTab = tab;
            syncTabUi();
            setStatus('', false);
            loadView(selCat.value);
        }

        function fillCategories(cats) {
            sumoCats = (cats || []).filter(isSumoCat);
            var html = '<option value="">— Elige categoría —</option>';
            sumoCats.forEach(function (c) {
                html +=
                    '<option value="' +
                    CRDom.escapeHtml(String(c.id)) +
                    '">' +
                    CRDom.escapeHtml(c.name) +
                    '</option>';
            });
            selCat.innerHTML = html;
            if (!sumoCats.length) {
                setStatus('No hay categorías sumo configuradas.', true);
            }
            syncButtons();
        }

        function onCatChange() {
            activeTab = 'winner';
            syncTabUi();
            setStatus('', false);
            loadView(selCat.value);
        }

        initQueueScopeSelect();

        selCat.addEventListener('change', onCatChange, false);
        if (selQueueScope) {
            selQueueScope.addEventListener('change', function () {
                persistQueueScope();
                loadView(selCat.value);
            });
        }
        btnGenerar.addEventListener('click', onGenerar, false);
        if (btnRefresh) {
            btnRefresh.addEventListener('click', onRefresh, false);
        }
        if (boardWrap) {
            boardWrap.addEventListener('click', onBoardClick, false);
        }
        if (btnNextRound) {
            btnNextRound.addEventListener('click', onNextRound, false);
        }
        if (tabWinner) {
            tabWinner.addEventListener('click', function () {
                onTabChange('winner');
            });
        }
        if (tabLoser) {
            tabLoser.addEventListener('click', function () {
                onTabChange('loser');
            });
        }

        syncTabUi();

        if (w.CRApi.fetchCategorias) {
            w.CRApi.fetchCategorias()
                .then(fillCategories)
                .catch(function () {
                    fillCategories([]);
                });
        } else {
            fillCategories([]);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.brackets = initBrackets;
})(window);
