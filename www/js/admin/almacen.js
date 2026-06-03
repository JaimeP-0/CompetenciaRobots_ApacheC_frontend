/**
 * Admin: datos en MySQL (API PHP) o respaldo localStorage si adminDatosLocales === true.
 */
(function (w) {
    'use strict';

    var STORAGE_KEY = 'cr_admin_datos';

    function cfg() {
        return w.CR_CONFIG || w.CR_APP || {};
    }

    function isEnabled() {
        return cfg().adminDatosLocales === true;
    }

    function remoto() {
        return w.CRApiAdminRemoto;
    }

    function useRemoto() {
        return !isEnabled() && remoto();
    }

    function emptyDb() {
        return {
            seeded: false,
            categorias: [],
            equiposCategoria: {},
            nextCategoriaId: 1,
            nextReglaId: 1
        };
    }

    function load() {
        try {
            var raw = w.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return emptyDb();
            }
            var db = JSON.parse(raw);
            if (!db || typeof db !== 'object') {
                return emptyDb();
            }
            if (!Array.isArray(db.categorias)) {
                db.categorias = [];
            }
            if (!db.equiposCategoria || typeof db.equiposCategoria !== 'object') {
                db.equiposCategoria = {};
            }
            return db;
        } catch (ignore) {
            return emptyDb();
        }
    }

    function save(db) {
        w.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        if (w.CRApiCategorias && typeof w.CRApiCategorias.clearCache === 'function') {
            w.CRApiCategorias.clearCache();
        }
        if (w.CRApiEquiposRegistro && typeof w.CRApiEquiposRegistro.clearCache === 'function') {
            w.CRApiEquiposRegistro.clearCache();
        }
    }

    function cloneCategoria(c) {
        return {
            id: c.id,
            name: c.name,
            rules: (c.rules || []).map(function (r) {
                var item = { id: r.id, description: r.description };
                if (r.type != null) {
                    item.type = r.type;
                }
                if (r.category_id != null) {
                    item.category_id = r.category_id;
                }
                return item;
            })
        };
    }

    function nextId(list) {
        var max = 0;
        list.forEach(function (item) {
            var n = Number(item.id, 10);
            if (!isNaN(n) && n > max) {
                max = n;
            }
        });
        return max + 1;
    }

    function invalidateCaches() {
        if (useRemoto()) {
            remoto().clearCaches();
            return;
        }
        save(load());
    }

    function seedFromApi(categoriasApi, equiposApi) {
        var db = load();
        if (db.seeded) {
            return Promise.resolve(db);
        }
        db.categorias = (categoriasApi || []).map(cloneCategoria);
        db.nextCategoriaId = nextId(db.categorias);
        var maxRule = 0;
        db.categorias.forEach(function (c) {
            (c.rules || []).forEach(function (r) {
                var n = Number(r.id, 10);
                if (!isNaN(n) && n > maxRule) {
                    maxRule = n;
                }
                if (r.id == null) {
                    r.id = ++maxRule;
                }
            });
        });
        db.nextReglaId = maxRule + 1;
        (equiposApi || []).forEach(function (t) {
            if (t.id != null && t.category_id != null && t.category_id !== '') {
                db.equiposCategoria[String(t.id)] = Number(t.category_id, 10);
            }
        });
        db.seeded = true;
        save(db);
        return Promise.resolve(db);
    }

    function ensureSeeded() {
        if (useRemoto()) {
            return remoto().getCategorias().then(function () {
                return { seeded: true };
            });
        }
        if (!w.CRApi) {
            return Promise.resolve(load());
        }
        var db = load();
        if (db.seeded) {
            return Promise.resolve(db);
        }
        var catsP =
            typeof w.CRApi.fetchCategorias === 'function'
                ? w.CRApi.fetchCategorias(true)
                : Promise.resolve([]);
        var teamsP =
            typeof w.CRApi.fetchRegistroTeams === 'function'
                ? w.CRApi.fetchRegistroTeams(true)
                : Promise.resolve([]);
        return Promise.all([catsP, teamsP]).then(function (arr) {
            return seedFromApi(arr[0], arr[1]);
        });
    }

    function getCategoriasParaApp(apiList) {
        if (!isEnabled()) {
            return apiList || [];
        }
        var db = load();
        if (!db.seeded) {
            return apiList || [];
        }
        return db.categorias.map(cloneCategoria);
    }

    function aplicarCategoriaAEquipos(apiTeams) {
        if (!isEnabled()) {
            return apiTeams || [];
        }
        var db = load();
        if (!db.seeded) {
            return apiTeams || [];
        }
        return (apiTeams || []).map(function (t) {
            var key = String(t.id);
            if (db.equiposCategoria[key] != null && db.equiposCategoria[key] !== '') {
                var cid = Number(db.equiposCategoria[key], 10);
                return Object.assign({}, t, {
                    category_id: isNaN(cid) ? t.category_id : cid
                });
            }
            return t;
        });
    }

    function getCategorias() {
        if (useRemoto()) {
            return remoto().getCategorias();
        }
        return ensureSeeded().then(function (db) {
            return db.categorias.map(cloneCategoria);
        });
    }

    function getCategoria(id) {
        if (useRemoto()) {
            return remoto().getCategoria(id);
        }
        var cid = Number(id, 10);
        return getCategorias().then(function (list) {
            var cat = list.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            return cat ? cloneCategoria(cat) : null;
        });
    }

    function addCategoria(name) {
        if (useRemoto()) {
            return remoto().addCategoria(name);
        }
        var n = String(name || '').trim();
        if (!n) {
            return Promise.reject(new Error('Escribe el nombre de la categoría.'));
        }
        return ensureSeeded().then(function (db) {
            var id = db.nextCategoriaId++;
            db.categorias.push({ id: id, name: n, rules: [] });
            save(db);
            return { id: id, name: n, rules: [] };
        });
    }

    function denyCatRuleEdit() {
        return Promise.reject(
            new Error('Editar o eliminar categorías y reglas no está permitido desde la app.')
        );
    }

    function updateCategoria(id, name) {
        if (useRemoto()) {
            return denyCatRuleEdit();
        }
        var cid = Number(id, 10);
        var n = String(name || '').trim();
        if (!n) {
            return Promise.reject(new Error('El nombre no puede estar vacío.'));
        }
        return ensureSeeded().then(function (db) {
            var cat = db.categorias.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            if (!cat) {
                return Promise.reject(new Error('Categoría no encontrada.'));
            }
            cat.name = n;
            save(db);
            return cloneCategoria(cat);
        });
    }

    function deleteCategoria(id) {
        if (useRemoto()) {
            return denyCatRuleEdit();
        }
        var cid = Number(id, 10);
        return ensureSeeded().then(function (db) {
            db.categorias = db.categorias.filter(function (c) {
                return Number(c.id, 10) !== cid;
            });
            Object.keys(db.equiposCategoria).forEach(function (tid) {
                if (Number(db.equiposCategoria[tid], 10) === cid) {
                    delete db.equiposCategoria[tid];
                }
            });
            save(db);
        });
    }

    function normalizeReglaType(type) {
        var t = String(type || '')
            .trim()
            .toLowerCase();
        return t === 'characteristic' || t === 'restriction' ? t : null;
    }

    function addRegla(categoriaId, description, type) {
        if (useRemoto()) {
            return remoto().addRegla(categoriaId, description, type);
        }
        var cid = Number(categoriaId, 10);
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('Escribe el texto de la regla.'));
        }
        var ruleType = normalizeReglaType(type) || 'restriction';
        return ensureSeeded().then(function (db) {
            var cat = db.categorias.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            if (!cat) {
                return Promise.reject(new Error('Categoría no encontrada.'));
            }
            if (!cat.rules) {
                cat.rules = [];
            }
            var regla = { id: db.nextReglaId++, description: text, type: ruleType };
            cat.rules.push(regla);
            save(db);
            return regla;
        });
    }

    function updateRegla(categoriaId, reglaId, description, type) {
        if (useRemoto()) {
            return denyCatRuleEdit();
        }
        var cid = Number(categoriaId, 10);
        var rid = Number(reglaId, 10);
        var text = String(description || '').trim();
        if (!text) {
            return Promise.reject(new Error('La regla no puede estar vacía.'));
        }
        var ruleType = normalizeReglaType(type);
        return ensureSeeded().then(function (db) {
            var cat = db.categorias.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            if (!cat) {
                return Promise.reject(new Error('Categoría no encontrada.'));
            }
            var regla = (cat.rules || []).find(function (r) {
                return Number(r.id, 10) === rid;
            });
            if (!regla) {
                return Promise.reject(new Error('Regla no encontrada.'));
            }
            regla.description = text;
            if (ruleType) {
                regla.type = ruleType;
            }
            save(db);
            return regla;
        });
    }

    function deleteRegla(categoriaId, reglaId) {
        if (useRemoto()) {
            return denyCatRuleEdit();
        }
        var cid = Number(categoriaId, 10);
        var rid = Number(reglaId, 10);
        return ensureSeeded().then(function (db) {
            var cat = db.categorias.find(function (c) {
                return Number(c.id, 10) === cid;
            });
            if (!cat || !cat.rules) {
                return;
            }
            cat.rules = cat.rules.filter(function (r) {
                return Number(r.id, 10) !== rid;
            });
            save(db);
        });
    }

    function setEquipoCategoria(teamId, categoryId) {
        if (useRemoto()) {
            return remoto().setEquipoCategoria(teamId, categoryId);
        }
        var tid = String(teamId);
        return ensureSeeded().then(function (db) {
            if (categoryId == null || categoryId === '') {
                delete db.equiposCategoria[tid];
            } else {
                db.equiposCategoria[tid] = Number(categoryId, 10);
            }
            save(db);
        });
    }

    function addEquipo(payload) {
        if (useRemoto()) {
            return remoto().addEquipo(payload);
        }
        return Promise.reject(
            new Error('Crear equipos requiere base de datos (adminDatosLocales desactivado).')
        );
    }

    function addMiembro(teamId, payload) {
        if (useRemoto()) {
            return remoto().addMiembro(teamId, payload);
        }
        return Promise.reject(
            new Error('Agregar miembros requiere base de datos (adminDatosLocales desactivado).')
        );
    }

    function deleteMiembro(teamId, memberId) {
        if (useRemoto()) {
            return remoto().deleteMiembro(teamId, memberId);
        }
        return Promise.reject(
            new Error('Eliminar miembros requiere base de datos (adminDatosLocales desactivado).')
        );
    }

    function resetAlmacen() {
        if (useRemoto()) {
            return Promise.reject(
                new Error('Con base de datos activa no se usa reset local. Edita datos en MySQL.')
            );
        }
        w.localStorage.removeItem(STORAGE_KEY);
        invalidateCaches();
    }

    w.CRAdminAlmacen = {
        isEnabled: isEnabled,
        usesDatabase: function () {
            return !isEnabled();
        },
        ensureSeeded: ensureSeeded,
        seedFromApi: seedFromApi,
        getCategoriasParaApp: getCategoriasParaApp,
        aplicarCategoriaAEquipos: aplicarCategoriaAEquipos,
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
        resetAlmacen: resetAlmacen
    };
})(window);
