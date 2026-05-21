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

        return fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: body != null && method !== 'GET' ? JSON.stringify(body) : undefined
        }).then(function (res) {
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(res.status + ' ' + t);
                });
            }
            return res.json();
        });
    }

    w.CRApiRequest = { request: request };
})(window);
