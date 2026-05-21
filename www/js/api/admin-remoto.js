/**
 * CRUD admin contra backend PHP (MySQL).
 * Rutas: /categorias, /categorias/{id}/reglas, PATCH /registro/{id}
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    if (!app || !Http) {
        throw new Error('Carga config.js y http-build-url.js antes de admin-remoto.js');
    }
    var buildUrl = Http.buildUrl;

    function parseJson(res) {
        if (!res.ok) {
            return res.text().then(function (t) {
                var msg = t || res.statusText || String(res.status);
                try {
                    var j = JSON.parse(t);
                    if (j && j.error) {
                        msg = j.error;
                    }
                } catch (ignore) {}
                throw new Error(msg);
            });
        }
        return res.json();
    }

    function request(method, path, body) {
        var url = buildUrl(path, {});
        if (app.debugApi) {
            console.log('[CR admin]', method, url);
        }
        return fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: body != null && method !== 'GET' ? JSON.stringify(body) : undefined
        }).then(parseJson);
    }

    function clearCaches() {
        if (w.CRApiCategorias && typeof w.CRApiCategorias.clearCache === 'function') {
            w.CRApiCategorias.clearCache();
        }
        if (w.CRApiEquiposRegistro && typeof w.CRApiEquiposRegistro.clearCache === 'function') {
            w.CRApiEquiposRegistro.clearCache();
        }
        if (w.CRApi && typeof w.CRApi.clearRegistroCache === 'function') {
            w.CRApi.clearRegistroCache();
        }
    }

    function parseCategoriasList(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        return [];
    }

    function cloneCategoria(c) {
        return {
            id: c.id,
            name: c.name,
            rules: (c.rules || []).map(function (r) {
                return { id: r.id, description: r.description };
            })
        };
    }

    function catsPath() {
        return app.categoriasPath || '/categorias';
    }

    function registroPath(teamId) {
        var base = app.registroEquiposPath || '/registro';
        return base + '/' + encodeURIComponent(String(teamId));
    }

    function getCategorias() {
        return request('GET', catsPath()).then(function (data) {
            return parseCategoriasList(data).map(cloneCategoria);
        });
    }

    function getCategoria(id) {
        var cid = Number(id, 10);
        return getCategorias().then(function (list) {
            var cat = list.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            return cat ? cloneCategoria(cat) : null;
        });
    }

    function addCategoria(name) {
        var n = String(name || '').trim();
        if (!n) {
            return Promise.reject(new Error('Escribe el nombre de la categoría.'));
        }
        return request('POST', catsPath(), { name: n }).then(function (created) {
            clearCaches();
            return cloneCategoria(created);
        });
    }

    function updateCategoria(id, name) {
        var n = String(name || '').trim();
        if (!n) {
            return Promise.reject(new Error('El nombre no puede estar vacío.'));
        }
        return request('PUT', catsPath() + '/' + encodeURIComponent(String(id)), { name: n }).then(function (
            updated
        ) {
            clearCaches();
            return cloneCategoria(Object.assign({ rules: [] }, updated));
        });
    }

    function deleteCategoria(id) {
        return request('DELETE', catsPath() + '/' + encodeURIComponent(String(id))).then(function () {
            clearCaches();
        });
    }

    function addRegla(categoriaId, description) {
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('Escribe el texto de la regla.'));
        }
        var path =
            catsPath() + '/' + encodeURIComponent(String(categoriaId)) + '/reglas';
        return request('POST', path, { description: text }).then(function (regla) {
            clearCaches();
            return regla;
        });
    }

    function updateRegla(categoriaId, reglaId, description) {
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('La regla no puede estar vacía.'));
        }
        var path =
            catsPath() +
            '/' +
            encodeURIComponent(String(categoriaId)) +
            '/reglas/' +
            encodeURIComponent(String(reglaId));
        return request('PUT', path, { description: text }).then(function (regla) {
            clearCaches();
            return regla;
        });
    }

    function deleteRegla(categoriaId, reglaId) {
        var path =
            catsPath() +
            '/' +
            encodeURIComponent(String(categoriaId)) +
            '/reglas/' +
            encodeURIComponent(String(reglaId));
        return request('DELETE', path).then(function () {
            clearCaches();
        });
    }

    function setEquipoCategoria(teamId, categoryId) {
        var body = {
            category_id: categoryId == null || categoryId === '' ? null : Number(categoryId, 10)
        };
        return request('PATCH', registroPath(teamId), body).then(function () {
            clearCaches();
        });
    }

    w.CRApiAdminRemoto = {
        getCategorias: getCategorias,
        getCategoria: getCategoria,
        addCategoria: addCategoria,
        updateCategoria: updateCategoria,
        deleteCategoria: deleteCategoria,
        addRegla: addRegla,
        updateRegla: updateRegla,
        deleteRegla: deleteRegla,
        setEquipoCategoria: setEquipoCategoria,
        clearCaches: clearCaches
    };
})(window);
