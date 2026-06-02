/**
 * Sesión staff (árbitros; juez legacy solo consulta en partidas) en sessionStorage.
 */
(function (w) {
    'use strict';

    var STORAGE_KEY = 'cr_staff_sesion';
    var ROLES_SIN_CATEGORIA = { admin: true, dev: true, visitante: true };

    function read() {
        try {
            var raw = w.sessionStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            var data = JSON.parse(raw);
            if (!data || !data.username) {
                return null;
            }
            return data;
        } catch (ignore) {
            return null;
        }
    }

    function save(data) {
        w.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function clear() {
        w.sessionStorage.removeItem(STORAGE_KEY);
    }

    function isLoggedIn() {
        return !!read();
    }

    function normalizeRole(role) {
        var r = String(role || '').trim().toLowerCase();
        if (r === 'árbitro') {
            return 'arbitro';
        }
        return r;
    }

    function scopeFromIsInternal(isInternal) {
        if (!w.CRTeamOrigin || typeof w.CRTeamOrigin.scopeFromIsInternal !== 'function') {
            if (isInternal === true || isInternal === 1) {
                return 'internal';
            }
            if (isInternal === false || isInternal === 0) {
                return 'external';
            }
            return '';
        }
        return w.CRTeamOrigin.scopeFromIsInternal(isInternal) || '';
    }

    function parseCategories(body) {
        var list = [];
        var ids = [];
        var i;
        if (Array.isArray(body.categories)) {
            for (i = 0; i < body.categories.length; i++) {
                var c = body.categories[i];
                if (!c || c.category_id == null) {
                    continue;
                }
                var cid = Number(c.category_id, 10);
                if (isNaN(cid) || cid <= 0) {
                    continue;
                }
                list.push({
                    category_id: cid,
                    is_internal: c.is_internal
                });
                ids.push(cid);
            }
        }
        if (!ids.length && Array.isArray(body.category_ids)) {
            for (i = 0; i < body.category_ids.length; i++) {
                var n = Number(body.category_ids[i], 10);
                if (!isNaN(n) && n > 0) {
                    ids.push(n);
                    list.push({ category_id: n, is_internal: null });
                }
            }
        }
        return { categories: list, category_ids: ids };
    }

    /** Construye sesión desde POST /login (Go). */
    function parseFromLogin(body, fallbackUsername) {
        body = body && body.body ? body.body : body;
        if (!body || !body.username) {
            throw new Error('Respuesta de login inválida.');
        }
        var uname = String(body.username || fallbackUsername || '').trim();
        var role = normalizeRole(body.role || '');
        var parsed = parseCategories(body);
        var categories = parsed.categories;
        var categoryIds = parsed.category_ids;
        var primary = categories.length ? categories[0] : null;
        var scope = body.scope ? String(body.scope) : '';
        if (!scope && primary && primary.is_internal != null) {
            scope = scopeFromIsInternal(primary.is_internal);
        }
        var categoryId =
            body.category_id != null
                ? String(body.category_id)
                : primary
                  ? String(primary.category_id)
                  : categoryIds.length
                    ? String(categoryIds[0])
                    : '';

        if (ROLES_SIN_CATEGORIA[role]) {
            categories = [];
            categoryIds = [];
            categoryId = '';
        }

        return {
            username: uname,
            display_name: String(body.name || body.display_name || body.nombre || uname).trim(),
            role: role,
            scope: scope,
            category: body.category != null ? String(body.category) : '',
            category_id: categoryId,
            category_ids: categoryIds,
            categories: categories,
            token: body.token ? String(body.token) : 'sess:' + uname
        };
    }

    function primaryCategoryId(session) {
        if (!session) {
            return '';
        }
        if (session.category_id != null && String(session.category_id) !== '') {
            return String(session.category_id);
        }
        if (session.category_ids && session.category_ids.length) {
            return String(session.category_ids[0]);
        }
        if (session.categories && session.categories.length && session.categories[0].category_id != null) {
            return String(session.categories[0].category_id);
        }
        return '';
    }

    function queueScope(session) {
        if (!session) {
            return '';
        }
        if (session.scope && w.CRTeamOrigin) {
            return w.CRTeamOrigin.normalizeQueueScope(session.scope);
        }
        var primary = session.categories && session.categories[0];
        if (primary && primary.is_internal != null) {
            return scopeFromIsInternal(primary.is_internal);
        }
        return '';
    }

    function assignmentSummary(session) {
        if (!session) {
            return '';
        }
        var catId = primaryCategoryId(session);
        var scope = queueScope(session);
        var parts = [];
        if (catId) {
            parts.push('cat. ' + catId);
        }
        if (scope === 'internal') {
            parts.push('interno');
        } else if (scope === 'external') {
            parts.push('externo');
        }
        return parts.join(' · ');
    }

    w.CRStaffSesion = {
        read: read,
        save: save,
        clear: clear,
        isLoggedIn: isLoggedIn,
        parseFromLogin: parseFromLogin,
        primaryCategoryId: primaryCategoryId,
        queueScope: queueScope,
        assignmentSummary: assignmentSummary
    };
})(window);
