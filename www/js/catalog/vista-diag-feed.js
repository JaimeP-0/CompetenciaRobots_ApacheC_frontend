/**
 * Vista oculta #/cr-pit-arena-x7k9m2 — feed de logs del API Go.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    var POLL_MS = 4000;
    var ROUTE_HINT = '/cr-pit-arena-x7k9m2';

    if (!CRDom) {
        throw new Error('Carga core/escape-html antes de vista-diag-feed.js');
    }

    function cfg() {
        return w.CR_CONFIG || w.CR_APP || {};
    }

    function diagKey() {
        var c = cfg();
        return (c.diagFeedKey || w.CR_API_OVERRIDES && w.CR_API_OVERRIDES.diagFeedKey) || '';
    }

    function feedPath() {
        var c = cfg();
        return c.diagFeedPath || '/cr-internal/telemetry/v1/feed';
    }

    function buildFeedUrl(since, limit) {
        var base = (cfg().apiBase || cfg().apiRemoteBase || '').replace(/\/$/, '');
        var path = feedPath();
        var url = base + path;
        var q = [];
        var key = diagKey();
        if (key) {
            q.push('key=' + encodeURIComponent(key));
        }
        if (since != null && since > 0) {
            q.push('since=' + encodeURIComponent(String(since)));
        }
        if (limit) {
            q.push('limit=' + encodeURIComponent(String(limit)));
        }
        return url + (q.length ? '?' + q.join('&') : '');
    }

    function levelClass(level) {
        var lv = String(level || 'info').toLowerCase();
        if (lv === 'error') {
            return 'cr-diag-line--error';
        }
        if (lv === 'warn' || lv === 'warning') {
            return 'cr-diag-line--warn';
        }
        if (lv === 'log') {
            return 'cr-diag-line--log';
        }
        return 'cr-diag-line--info';
    }

    function initDiagFeed(outlet) {
        var root = (outlet && outlet.querySelector('#cr-diag-root')) || outlet;
        if (!root) {
            return;
        }

        var logEl = root.querySelector('#cr-diag-log');
        var statusEl = root.querySelector('#cr-diag-status');
        var selLevel = root.querySelector('#cr-diag-level');
        var btnRefresh = root.querySelector('#cr-diag-refresh');
        var btnClear = root.querySelector('#cr-diag-clear');
        if (!logEl) {
            return;
        }

        var entries = [];
        var since = 0;
        var pollTimer = null;
        var inflight = false;
        var levelFilter = '';

        if (root._crDiagPoll) {
            clearInterval(root._crDiagPoll);
        }

        function setStatus(msg, isErr) {
            if (!statusEl) {
                return;
            }
            statusEl.textContent = msg || '';
            statusEl.classList.toggle('cr-diag-status--err', !!isErr);
        }

        function filteredEntries() {
            if (!levelFilter) {
                return entries;
            }
            return entries.filter(function (e) {
                return String(e.level || '').toLowerCase() === levelFilter;
            });
        }

        function renderLines() {
            var list = filteredEntries();
            if (!list.length) {
                logEl.innerHTML =
                    '<p class="cr-diag-msg">' +
                    CRDom.escapeHtml(
                        levelFilter
                            ? 'Sin entradas para este filtro.'
                            : 'Sin logs todavía. El API registrará peticiones y errores aquí.'
                    ) +
                    '</p>';
                return;
            }
            logEl.innerHTML = list
                .map(function (e) {
                    var at = e.at ? String(e.at).replace('T', ' ').replace('Z', '') : '';
                    return (
                        '<div class="cr-diag-line ' +
                        levelClass(e.level) +
                        '">' +
                        '<span class="cr-diag-line-at">' +
                        CRDom.escapeHtml(at) +
                        '</span>' +
                        '<span class="cr-diag-line-lv">' +
                        CRDom.escapeHtml(String(e.level || 'info').toUpperCase()) +
                        '</span>' +
                        '<span class="cr-diag-line-msg">' +
                        CRDom.escapeHtml(String(e.msg || '')) +
                        '</span></div>'
                    );
                })
                .join('');
            logEl.scrollTop = logEl.scrollHeight;
        }

        function mergeEntries(batch) {
            if (!batch || !batch.length) {
                return;
            }
            batch.forEach(function (e) {
                if (!e || e.id == null) {
                    return;
                }
                var exists = entries.some(function (x) {
                    return x.id === e.id;
                });
                if (!exists) {
                    entries.push(e);
                }
            });
            if (entries.length > 900) {
                entries = entries.slice(entries.length - 900);
            }
        }

        function fetchFeed(initial) {
            if (inflight) {
                return Promise.resolve();
            }
            if (!diagKey()) {
                setStatus('Falta diagFeedKey en config.local.js', true);
                logEl.innerHTML =
                    '<p class="cr-diag-msg">Configura diagFeedKey en el servidor (config.local.js).</p>';
                return Promise.resolve();
            }
            inflight = true;
            var url = buildFeedUrl(initial ? 0 : since, initial ? 300 : 0);
            var transport = w.CRApiTransport && w.CRApiTransport.fetch ? w.CRApiTransport.fetch : w.fetch;
            return transport(url, { method: 'GET', headers: { Accept: 'application/json' } })
                .then(function (res) {
                    if (res.status === 404) {
                        throw new Error('Feed no disponible (404). ¿Desplegaste el API con logger?');
                    }
                    if (!res.ok) {
                        throw new Error('HTTP ' + res.status);
                    }
                    return res.json();
                })
                .then(function (data) {
                    mergeEntries(data && data.entries);
                    if (data && data.next_since != null) {
                        since = Number(data.next_since) || since;
                    }
                    renderLines();
                    var d = new Date();
                    setStatus(
                        'Última lectura ' +
                            d.toLocaleTimeString() +
                            ' · ruta ' +
                            ROUTE_HINT +
                            ' · auto cada ' +
                            Math.round(POLL_MS / 1000) +
                            ' s',
                        false
                    );
                })
                .catch(function (err) {
                    setStatus(err.message || 'Error al leer logs', true);
                })
                .finally(function () {
                    inflight = false;
                });
        }

        function clearFeed() {
            if (!diagKey()) {
                return;
            }
            var url = buildFeedUrl(0, 0);
            var transport = w.CRApiTransport && w.CRApiTransport.fetch ? w.CRApiTransport.fetch : w.fetch;
            transport(url, { method: 'DELETE' })
                .then(function (res) {
                    if (!res.ok && res.status !== 204) {
                        throw new Error('HTTP ' + res.status);
                    }
                    entries = [];
                    since = 0;
                    renderLines();
                    return fetchFeed(true);
                })
                .catch(function (err) {
                    setStatus(err.message || 'No se pudo limpiar', true);
                });
        }

        function onLevelChange() {
            levelFilter = selLevel ? selLevel.value || '' : '';
            renderLines();
        }

        if (btnRefresh) {
            btnRefresh.addEventListener('click', function () {
                fetchFeed(false);
            });
        }
        if (btnClear) {
            btnClear.addEventListener('click', clearFeed);
        }
        if (selLevel) {
            selLevel.addEventListener('change', onLevelChange, false);
        }

        fetchFeed(true).then(function () {
            pollTimer = setInterval(function () {
                fetchFeed(false);
            }, POLL_MS);
            root._crDiagPoll = pollTimer;
        });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.diagFeed = initDiagFeed;
})(window);
