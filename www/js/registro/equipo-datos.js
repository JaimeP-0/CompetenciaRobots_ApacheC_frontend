/**
 * Datos del equipo en pantalla Registrar (DOM + fetch detalle/sugerencias).
 */
(function (w) {
    'use strict';

    /** Un solo equipo de prueba (mock). */
    var MOCK_EQUIPOS = ['Test'];

    function getRegFiltroCategoriaId(root) {
        var sec = registroSectionRoot(root);
        var sel = sec.querySelector('#reg-filtro-categoria');
        if (!sel || !sel.value) {
            return null;
        }
        var n = Number(sel.value, 10);
        return isNaN(n) ? null : n;
    }

    /**
     * Autocompletado de equipos (GET /registro/{categoriaId}/equipos vía CRApi).
     */
    function fetchSugerenciasEquipo(query, root) {
        var q = String(query || '').trim();
        var app = w.CR_CONFIG || w.CR_APP || {};
        var categoryId = getRegFiltroCategoriaId(root);
        if (!q || categoryId == null) {
            return Promise.resolve([]);
        }
        if (app.useMockApi !== false) {
            return new Promise(function (resolve) {
                window.setTimeout(function () {
                    var needle = q.toLowerCase();
                    var hits = MOCK_EQUIPOS.filter(function (name) {
                        return name.toLowerCase().indexOf(needle) !== -1;
                    });
                    resolve(hits);
                }, 120);
            });
        }
        if (w.CRApi && typeof w.CRApi.getRegistroSugerencias === 'function') {
            return w.CRApi.getRegistroSugerencias(q, categoryId);
        }
        return Promise.resolve([]);
    }

    function registroSectionRoot(root) {
        return root.querySelector('#registrar-root') || root;
    }

    function setRegEquipoId(root, id) {
        var sec = registroSectionRoot(root);
        if (id != null && id !== '' && !isNaN(Number(id))) {
            sec.setAttribute('data-reg-equipo-id', String(Number(id)));
        } else {
            sec.removeAttribute('data-reg-equipo-id');
        }
    }

    function getRegEquipoId(root) {
        var sec = registroSectionRoot(root);
        var raw = sec.getAttribute('data-reg-equipo-id');
        if (raw == null || raw === '') {
            return null;
        }
        var n = Number(raw, 10);
        return isNaN(n) ? null : n;
    }

    function setRegCategoryId(root, id) {
        var sec = registroSectionRoot(root);
        if (id != null && id !== '' && !isNaN(Number(id))) {
            sec.setAttribute('data-reg-category-id', String(Number(id)));
        } else {
            sec.removeAttribute('data-reg-category-id');
        }
    }

    function getRegCategoryId(root) {
        var sec = registroSectionRoot(root);
        var raw = sec.getAttribute('data-reg-category-id');
        if (raw == null || raw === '') {
            return null;
        }
        var n = Number(raw, 10);
        return isNaN(n) ? null : n;
    }

    function limpiarDetalleEquipo(root) {
        setRegEquipoId(root, null);
        setRegCategoryId(root, null);
        var ids = [
            'reg-dato-escuela',
            'reg-dato-capitan',
            'reg-dato-asesor',
            'reg-dato-categoria',
            'reg-dato-robot-estado',
            'reg-dato-integrantes'
        ];
        ids.forEach(function (id) {
            var el = root.querySelector('#' + id);
            if (el) {
                el.textContent = '—';
            }
        });
    }

    function formatRobotEstado(d) {
        d = d || {};
        if (d.robot_valid === true) {
            return 'Validado';
        }
        if (d.robot_valid === false) {
            return 'Pendiente de verificación';
        }
        var robots = d.robots;
        if (Array.isArray(robots) && robots.length) {
            if (
                robots.some(function (r) {
                    return r && (r.is_valid === true || r.is_valid === 1);
                })
            ) {
                return 'Validado';
            }
        }
        return 'Pendiente de verificación';
    }

    function aplicarDetalleEquipo(root, d) {
        d = d || {};
        setRegEquipoId(root, d.team_id != null ? d.team_id : d.id);
        setRegCategoryId(root, d.category_id);
        function set(id, val) {
            var el = root.querySelector('#' + id);
            if (!el) {
                return;
            }
            var s = val != null ? String(val).trim() : '';
            el.textContent = s || '—';
        }
        set('reg-dato-escuela', d.escuela);
        set('reg-dato-capitan', d.capitan != null ? d.capitan : d.capitán);
        set('reg-dato-asesor', d.asesor);
        set('reg-dato-categoria', d.categoria != null ? d.categoria : d.categoría);
        set('reg-dato-robot-estado', formatRobotEstado(d));
        var ints = d.integrantes;
        if (Array.isArray(ints)) {
            ints = ints.join('\n');
        }
        set('reg-dato-integrantes', ints);
    }

    /**
     * Detalle del equipo para la tabla de solo lectura (columna derecha).
     * Real: equipo en GET /registro, mapeado a escuela, capitán, asesor, categoría, integrantes.
     */
    function fetchDetalleEquipoPorNombre(nombre, root) {
        var n = String(nombre || '').trim();
        var app = w.CR_CONFIG || w.CR_APP || {};
        var categoryId = getRegFiltroCategoriaId(root);
        if (!n || categoryId == null) {
            return Promise.resolve(null);
        }
        if (app.useMockApi !== false) {
            return new Promise(function (resolve) {
                window.setTimeout(function () {
                    if (n.toLowerCase() !== 'test') {
                        resolve(null);
                        return;
                    }
                    resolve({
                        team_id: 1,
                        category_id: 1,
                        escuela: 'Prueba',
                        capitan: 'Prueba',
                        asesor: 'Prueba',
                        categoria: 'Minisumo',
                        integrantes:
                            'Integrante 1\nIntegrante 2\nIntegrante 3\nIntegrante 4\nIntegrante 5\nIntegrante 6'
                    });
                }, 90);
            });
        }
        if (w.CRApi && typeof w.CRApi.getRegistroDetallePorNombre === 'function') {
            return w.CRApi.getRegistroDetallePorNombre(n, categoryId);
        }
        return Promise.resolve(null);
    }

    w.CRRegistroEquipos = {
        fetchSugerencias: fetchSugerenciasEquipo,
        fetchDetallePorNombre: fetchDetalleEquipoPorNombre,
        aplicarDetalle: aplicarDetalleEquipo,
        limpiarDetalle: limpiarDetalleEquipo,
        getEquipoId: getRegEquipoId,
        getCategoryId: getRegCategoryId,
        getFiltroCategoriaId: getRegFiltroCategoriaId,
        sectionRoot: registroSectionRoot
    };
})(window);
