/**
 * fetch o mock según config (useMockApi).
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    var Remoto = w.CRApiCatalogRemoto;
    var MockH = w.CRApiMockHandlers;
    if (!app || !Http || !Remoto || !MockH) throw new Error("Carga módulos api/* antes de request.js");
    var buildUrl = Http.buildUrl;
    var handleRegistroRemoteApi = Remoto.handleGet;
    var mockHandle = MockH.handle;

    function parseJsonBody(res, pathOnly) {
        if (res.status === 204) {
            return Promise.resolve(null);
        }
        return res.text().then(function (t) {
            var s = String(t || '').trim();
            if (!s) {
                return null;
            }
            try {
                return JSON.parse(s);
            } catch (parseErr) {
                throw new Error('Respuesta JSON inválida en ' + pathOnly);
            }
        });
    }

    function fetchJson(url, init, pathOnly, retried304) {
        init = init || {};
        init.cache = 'no-store';
        return fetch(url, init).then(function (res) {
            if (res.status === 304) {
                return res.text().then(function (t) {
                    var s = String(t || '').trim();
                    if (s) {
                        try {
                            return JSON.parse(s);
                        } catch (parseErr304) {
                            /* reintento abajo */
                        }
                    }
                    if (retried304) {
                        return null;
                    }
                    var bust = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cr=' + Date.now();
                    return fetchJson(bust, init, pathOnly, true);
                });
            }
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(res.status + ' ' + t);
                });
            }
            return parseJsonBody(res, pathOnly);
        });
    }

    function request(method, path, opts) {
        opts = opts || {};
        var query = opts.query;
        var body = opts.body;
        var pathOnly = String(path || '').split('?')[0];
        var url = buildUrl(path, query);

        if (!app.useMockApi) {
            var remote = handleRegistroRemoteApi(method, pathOnly, query);
            if (remote) {
                return remote;
            }
        }

        if (app.useMockApi) {
            try {
                return mockHandle(method, path.split('?')[0], query, body);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        var headers =
            method === 'GET' || method === 'HEAD'
                ? { Accept: 'application/json' }
                : { 'Content-Type': 'application/json', Accept: 'application/json' };

        return fetchJson(
            url,
            {
                method: method,
                headers: headers,
                body: body != null && method !== 'GET' ? JSON.stringify(body) : undefined
            },
            pathOnly,
            false
        );
    }

    w.CRApiRequest = { request: request };
})(window);
