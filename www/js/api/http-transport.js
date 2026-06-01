/**
 * fetch en browser; cordova-plugin-advanced-http en Android/iOS (HTTP nativo, sin CORS WebView).
 */
(function (w) {
    'use strict';

    var serializerReady = false;

    function nativeHttp() {
        return w.cordova && w.cordova.plugin && w.cordova.plugin.http;
    }

    function useNative() {
        if (!nativeHttp()) {
            return false;
        }
        var pid = w.cordova.platformId;
        if (pid === 'browser') {
            return false;
        }
        if (pid === 'android' || pid === 'ios') {
            return true;
        }
        var loc = w.location || {};
        var port = String(loc.port || '');
        if (port === '8000' || port === String(w.CR_DEV_SERVER_PORT || '8000')) {
            return false;
        }
        return !!w.cordova;
    }

    function ensureSerializer() {
        if (serializerReady || !nativeHttp()) {
            return;
        }
        try {
            w.cordova.plugin.http.setDataSerializer('json');
            serializerReady = true;
        } catch (e) {
            /* noop */
        }
    }

    function wrapResponse(status, bodyText) {
        var data = bodyText != null ? String(bodyText) : '';
        return {
            ok: status >= 200 && status < 300,
            status: status,
            text: function () {
                return Promise.resolve(data);
            },
            json: function () {
                var s = data.trim();
                if (!s) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(JSON.parse(s));
            }
        };
    }

    function nativeFetch(url, init) {
        ensureSerializer();
        init = init || {};
        var method = String(init.method || 'GET').toUpperCase();
        var headers = Object.assign({}, init.headers || {});
        var http = w.cordova.plugin.http;

        return new Promise(function (resolve, reject) {
            function onSuccess(response) {
                resolve(wrapResponse(response.status, response.data));
            }

            function onFail(response) {
                if (response && response.status) {
                    resolve(wrapResponse(response.status, response.data || response.error || ''));
                    return;
                }
                reject(new Error((response && response.error) || 'Error de red'));
            }

            if (method === 'GET' || method === 'HEAD') {
                http.sendRequest(url, { method: method, headers: headers }, onSuccess, onFail);
                return;
            }

            var data = {};
            if (init.body != null && init.body !== '') {
                try {
                    data = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
                } catch (parseErr) {
                    data = { _: String(init.body) };
                }
            }

            http.sendRequest(
                url,
                { method: method, headers: headers, data: data, serializer: 'json' },
                onSuccess,
                onFail
            );
        });
    }

    function transportFetch(url, init) {
        if (useNative()) {
            return nativeFetch(url, init);
        }
        return w.fetch(url, init);
    }

    w.CRApiTransport = { fetch: transportFetch, useNative: useNative };
})(window);
