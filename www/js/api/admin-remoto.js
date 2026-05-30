/**
 * CRUD admin contra backend PHP (MySQL).
 * GET: /categorias, /categorias/{id}/reglas, /categorias/{id}/equipos, /equipos/{id}/miembros
 * POST: /categorias, /reglas, /equipos, /miembros
 */
(function (w) {
    'use strict';

    var app = w.CR_APP || w.CR_CONFIG;
    var Http = w.CRApiHttp;
    var Cats = w.CRApiCategorias;
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
            console.log('[CR admin]', method, url, body || '');
        }
        var headers = { Accept: 'application/json' };
        var hasBody = body != null && method !== 'GET' && method !== 'HEAD';
        if (hasBody) {
            headers['Content-Type'] = 'application/json';
        }
        return fetch(url, {
            method: method,
            headers: headers,
            body: hasBody ? JSON.stringify(body) : undefined
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

    var REG_RULE_TYPES = ['characteristic', 'restriction'];

    function normalizeReglaType(type) {
        var t = String(type || '')
            .trim()
            .toLowerCase();
        return REG_RULE_TYPES.indexOf(t) !== -1 ? t : null;
    }

    function cloneRegla(r) {
        var item = { id: r.id, description: r.description };
        var ruleType = normalizeReglaType(r.type);
        if (ruleType) {
            item.type = ruleType;
        }
        if (r.category_id != null) {
            var cid = Number(r.category_id, 10);
            if (!isNaN(cid)) {
                item.category_id = cid;
            }
        }
        return item;
    }

    function cloneCategoria(c) {
        return {
            id: c.id,
            name: c.name,
            rules: (c.rules || []).map(cloneRegla)
        };
    }

    function catsPath() {
        return app.categoriasPath || '/categorias';
    }

    function equiposPath() {
        return app.equiposPath || '/equipos';
    }

    function reglasPath() {
        return app.reglasPath || '/reglas';
    }

    function miembrosPath() {
        return app.miembrosPath || '/miembros';
    }

    function equipoPath(teamId) {
        return equiposPath() + '/' + encodeURIComponent(String(teamId));
    }

    function fetchReglasForCategory(catId) {
        if (Cats && typeof Cats.fetchRulesForCategory === 'function') {
            return Cats.fetchRulesForCategory(catId);
        }
        return request('GET', catsPath() + '/' + encodeURIComponent(String(catId)) + '/reglas')
            .then(function (data) {
                var list = parseCategoriasList(data);
                return list.map(function (r) {
                    return cloneRegla(
                        Object.assign({}, r, {
                            category_id: r.category_id != null ? r.category_id : catId
                        })
                    );
                });
            })
            .catch(function () {
                return [];
            });
    }

    function getCategorias() {
        return request('GET', catsPath()).then(function (data) {
            var base = parseCategoriasList(data).map(function (c) {
                return { id: c.id, name: c.name, rules: [] };
            });
            return Promise.all(
                base.map(function (c) {
                    return fetchReglasForCategory(c.id).then(function (rules) {
                        return cloneCategoria({ id: c.id, name: c.name, rules: rules });
                    });
                })
            );
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

    function addRegla(categoriaId, description, type) {
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('Escribe el texto de la regla.'));
        }
        var ruleType = normalizeReglaType(type);
        if (!ruleType) {
            return Promise.reject(
                new Error('El tipo de regla debe ser "characteristic" o "restriction".')
            );
        }
        return request('POST', reglasPath(), {
            description: text,
            category_id: Number(categoriaId, 10),
            type: ruleType
        }).then(function (regla) {
            clearCaches();
            return regla;
        });
    }

    function updateRegla(categoriaId, reglaId, description, type) {
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('La regla no puede estar vacía.'));
        }
        var ruleType = normalizeReglaType(type);
        if (!ruleType) {
            return Promise.reject(
                new Error('El tipo de regla debe ser "characteristic" o "restriction".')
            );
        }
        var path =
            catsPath() +
            '/' +
            encodeURIComponent(String(categoriaId)) +
            '/reglas/' +
            encodeURIComponent(String(reglaId));
        return request('PUT', path, { description: text, type: ruleType }).then(function (regla) {
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
            category_id:
                categoryId == null || categoryId === ''
                    ? null
                    : String(categoryId)
        };
        return request('PATCH', equipoPath(teamId), body).then(function () {
            clearCaches();
        });
    }

    function addEquipo(payload) {
        var name = String((payload && payload.name) || '').trim();
        if (!name) {
            return Promise.reject(new Error('Escribe el nombre del equipo.'));
        }
        var body = {
            name: name,
            school: String((payload && payload.school) || '').trim(),
            grade: String((payload && payload.grade) || '').trim(),
            teacher: String((payload && payload.teacher) || '').trim()
        };
        if (payload && payload.category_id != null && payload.category_id !== '') {
            body.category_id = Number(payload.category_id, 10);
        }
        return request('POST', equiposPath(), body).then(function (created) {
            clearCaches();
            return created;
        });
    }

    function addMiembro(teamId, payload) {
        var name = String((payload && payload.name) || '').trim();
        if (!name) {
            return Promise.reject(new Error('Escribe el nombre del miembro.'));
        }
        var body = {
            name: name,
            email: String((payload && payload.email) || '').trim(),
            is_leader: !!(payload && payload.is_leader),
            team_id: Number(teamId, 10)
        };
        return request('POST', miembrosPath(), body).then(function (created) {
            clearCaches();
            return created;
        });
    }

    function deleteMiembro(teamId, memberId) {
        var path =
            equipoPath(teamId) + '/miembros/' + encodeURIComponent(String(memberId));
        return request('DELETE', path).then(function () {
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
        addEquipo: addEquipo,
        addMiembro: addMiembro,
        deleteMiembro: deleteMiembro,
        clearCaches: clearCaches
    };
})(window);
