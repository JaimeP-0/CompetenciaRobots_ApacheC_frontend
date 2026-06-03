/**
 * Pantalla #registrar: verificar, tablas checklist, POST validar.
 */
(function (w) {
    'use strict';

    var U = w.CRUtil;
    var Equipos = w.CRRegistroEquipos;
    var Chk = w.CRRegistroChecklists;
    var Cats = w.CRCategoriasCompetencia;
    if (!U || !Equipos || !Chk) {
        throw new Error("Carga registro/* y core/views antes");
    }
    var getRegEquipoId = Equipos.getEquipoId;
    var getRegCategoryId = Equipos.getCategoryId;
    var getRegFiltroCategoriaId = Equipos.getFiltroCategoriaId;
    var limpiarDetalleEquipo = Equipos.limpiarDetalle;
    var aplicarDetalleEquipo = Equipos.aplicarDetalle;
    var fetchDetalleEquipoPorNombre = Equipos.fetchDetallePorNombre;

    function initRegistrarFlow(root) {
        var noop = function () {};
        var section = root.querySelector('#registrar-root') || root;
        var input = section.querySelector('#nombre-equipo');
        var panel = section.querySelector('#reg-detalle-panel');
        var shell = section.querySelector('#reg-checklist-shell');
        var host1 = section.querySelector('#reg-checklist-1-host');
        var host2 = section.querySelector('#reg-checklist-2-host');
        var filaSig = section.querySelector('#reg-siguiente-fila');
        var filaReg = section.querySelector('#reg-registrar-fila');
        var btnVer = section.querySelector('#btn-reg-verificar');
        var btnSig = section.querySelector('#btn-reg-checklist-siguiente');
        var btnReg = section.querySelector('#btn-reg-registrar');
        var btnPdf = section.querySelector('#btn-reg-pdf-checklist');
        var scrollHost = section.querySelector('#reg-checklist-scroll');
        var modalPost = section.querySelector('#reg-modal-postregistro');
        var modalPostTitulo = section.querySelector('#reg-modal-postregistro-titulo');
        var modalPostMensaje = section.querySelector('#reg-modal-postregistro-mensaje');
        var modalPostAceptar = section.querySelector('#reg-modal-postregistro-aceptar');
        var modalConfirm = section.querySelector('#reg-modal-confirmar');
        var modalConfirmTitulo = section.querySelector('#reg-modal-confirmar-titulo');
        var modalConfirmMensaje = section.querySelector('#reg-modal-confirmar-mensaje');
        var modalConfirmAceptar = section.querySelector('#reg-modal-confirmar-aceptar');
        var modalConfirmCancelar = section.querySelector('#reg-modal-confirmar-cancelar');
        var modalDesc = section.querySelector('#reg-modal-descalificar');
        var modalDescMensaje = section.querySelector('#reg-modal-descalificar-mensaje');
        var modalDescAceptar = section.querySelector('#reg-modal-descalificar-aceptar');
        if (
            !input ||
            !panel ||
            !shell ||
            !host1 ||
            !host2 ||
            !btnVer ||
            !btnSig ||
            !scrollHost ||
            !filaReg ||
            !btnReg ||
            !modalPost ||
            !modalPostTitulo ||
            !modalPostMensaje ||
            !modalPostAceptar ||
            !modalConfirm ||
            !modalConfirmTitulo ||
            !modalConfirmMensaje ||
            !modalConfirmAceptar ||
            !modalConfirmCancelar ||
            !modalDesc ||
            !modalDescMensaje ||
            !modalDescAceptar
        ) {
            return { cleanup: noop, onDetalleChange: noop, cancelPendingDetalle: noop };
        }

        /** Tras cerrar el modal: inicio, equipos de la categoría, o solo re-habilitar Registrar. */
        var modalPostIrAlInicio = false;
        var modalPostRedirectEquiposCat = null;
        var modalConfirmOnAceptar = null;
        var cachedReglasCategoria = null;
        var cachedRestrictionRules = [];

        function resolveChecklistCategoryId() {
            var catId = getRegCategoryId(section);
            if (catId == null && typeof getRegFiltroCategoriaId === 'function') {
                catId = getRegFiltroCategoriaId(section);
            }
            return catId;
        }

        function resolveCategoryName() {
            var cell = section.querySelector('#reg-dato-categoria');
            if (cell) {
                var t = String(cell.textContent || '').trim();
                if (t && t !== '—') {
                    return t;
                }
            }
            var sel = section.querySelector('#reg-filtro-categoria');
            if (sel && sel.selectedIndex >= 0) {
                return String(sel.options[sel.selectedIndex].text || '').trim();
            }
            return '';
        }

        function isFutbolRegistro() {
            return Cats && typeof Cats.isFutbolCategoryName === 'function'
                ? Cats.isFutbolCategoryName(resolveCategoryName())
                : false;
        }

        function robotsRequiredForRegistro() {
            if (isFutbolRegistro() && Cats && typeof Cats.robotsRequiredPerTeam === 'function') {
                return Cats.robotsRequiredPerTeam(resolveCategoryName());
            }
            return 1;
        }

        function checklistRenderOpts(tableKind, title, columnLabel) {
            var catLabel = Chk.categoryLabelFromSection(section);
            var opts = {
                kicker: 'Checklist · ' + catLabel,
                title: title,
                columnLabel: columnLabel,
                tableKind: tableKind
            };
            if (isFutbolRegistro()) {
                opts.robotSlot = regRobotSlot;
                opts.kicker = 'Checklist · ' + catLabel + ' · Robot ' + regRobotSlot;
            }
            return opts;
        }

        function allRuleIdsFromCache() {
            var ids = [];
            (cachedReglasCategoria || []).forEach(function (r) {
                var n = Number(r && r.id, 10);
                if (!isNaN(n) && n > 0 && ids.indexOf(n) === -1) {
                    ids.push(n);
                }
            });
            return ids;
        }

        function scrollChecklistTop() {
            if (scrollHost) {
                scrollHost.scrollTop = 0;
            }
        }

        function buildChecklistPdfRows() {
            var rows = [];
            var typeLabel = function (t) {
                return String(t || '').toLowerCase() === 'characteristic' ? 'Característica' : 'Restricción';
            };
            function addFromHost(host, rules) {
                (rules || []).forEach(function (rule) {
                    var rid = rule.id != null ? String(rule.id) : '';
                    var chk = host
                        ? host.querySelector('input[data-rule-id="' + rid + '"]')
                        : null;
                    rows.push({
                        description: rule.description || '',
                        typeLabel: typeLabel(rule.type),
                        checked: !!(chk && chk.checked)
                    });
                });
            }
            addFromHost(host1, Chk.rulesByType(cachedReglasCategoria, 'characteristic'));
            addFromHost(host2, Chk.rulesByType(cachedReglasCategoria, 'restriction'));
            return rows;
        }

        function onPdfChecklistClick() {
            if (!w.CRPdfEvento || typeof w.CRPdfEvento.checklistVerificacion !== 'function') {
                showAvisoModal('PDF', 'No se cargó el módulo de PDF.');
                return;
            }
            var teamName = String(input.value || '').trim() || 'Equipo';
            var catId = resolveChecklistCategoryId();
            var catName = '';
            if (catId != null && w.CRApiCategorias && w.CRApiCategorias.labelById) {
                catName = w.CRApiCategorias.labelById(catId) || '';
            }
            w.CRPdfEvento.checklistVerificacion({
                teamName: teamName,
                categoryName: catName,
                rows: buildChecklistPdfRows(),
                filename: 'verificacion-' + teamName.replace(/\s+/g, '-').toLowerCase() + '.pdf'
            }).catch(function (err) {
                showAvisoModal('PDF', (err && err.message) || 'No se pudo generar el PDF.');
            });
        }

        function verificacionCompleta(body) {
            var required = allRuleIdsFromCache();
            if (!required.length || !body || !Array.isArray(body.valid_rules)) {
                return false;
            }
            if (body.valid_rules.length < required.length) {
                return false;
            }
            var missing = required.filter(function (id) {
                return body.valid_rules.indexOf(id) === -1;
            });
            return missing.length === 0;
        }

        /* --- Modales (aviso, confirmar, descalificación, especificación tabla 1) --- */

        function showAvisoModal(titulo, mensaje) {
            showPostRegistroModal({
                titulo: titulo,
                mensaje: mensaje,
                irAlInicio: false
            });
        }

        function hideConfirmModal() {
            var ae = document.activeElement;
            if (ae && modalConfirm.contains(ae) && typeof ae.blur === 'function') {
                ae.blur();
            }
            modalConfirm.classList.add('hidden');
            modalConfirm.classList.remove('flex');
            modalConfirm.setAttribute('aria-hidden', 'true');
            modalConfirmOnAceptar = null;
        }

        function showConfirmModal(opts) {
            opts = opts || {};
            hideSpecModalT1();
            modalConfirmOnAceptar = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
            modalConfirmTitulo.textContent = opts.titulo || '¿Continuar?';
            modalConfirmMensaje.textContent = opts.mensaje != null ? String(opts.mensaje) : '';
            modalConfirm.classList.remove('hidden');
            modalConfirm.classList.add('flex');
            modalConfirm.setAttribute('aria-hidden', 'false');
            modalConfirmAceptar.focus();
        }

        function onModalConfirmAceptar() {
            var fn = modalConfirmOnAceptar;
            hideConfirmModal();
            if (fn) {
                fn();
            }
        }

        function onModalConfirmCancelar() {
            hideConfirmModal();
        }

        function onModalConfirmBackdrop(e) {
            if (e.target === modalConfirm) {
                onModalConfirmCancelar();
            }
        }

        function hidePostRegistroModal() {
            var ae = document.activeElement;
            if (ae && modalPost.contains(ae) && typeof ae.blur === 'function') {
                ae.blur();
            }
            modalPost.classList.add('hidden');
            modalPost.classList.remove('flex');
            modalPost.setAttribute('aria-hidden', 'true');
        }

        function hideDescalificarModal() {
            var ae = document.activeElement;
            if (ae && modalDesc.contains(ae) && typeof ae.blur === 'function') {
                ae.blur();
            }
            modalDesc.classList.add('hidden');
            modalDesc.classList.remove('flex');
            modalDesc.setAttribute('aria-hidden', 'true');
        }

        function nombreEquipoEnInput() {
            var nombreEq = String(input.value || '')
                .trim()
                .replace(/\s+/g, ' ');
            return nombreEq || '(sin nombre)';
        }

        function showDescalificarModal() {
            hideSpecModalT1();
            modalDescMensaje.textContent =
                'Se descalificó el equipo ' + nombreEquipoEnInput() + '.';
            modalDesc.classList.remove('hidden');
            modalDesc.classList.add('flex');
            modalDesc.setAttribute('aria-hidden', 'false');
            modalDescAceptar.focus();
        }

        function onModalDescAceptar() {
            hideDescalificarModal();
            w.location.hash = '#/login';
        }

        function onModalDescBackdrop(e) {
            if (e.target === modalDesc) {
                onModalDescAceptar();
            }
        }

        function showPostRegistroModal(opts) {
            opts = opts || {};
            modalPostIrAlInicio = !!opts.irAlInicio;
            modalPostRedirectEquiposCat =
                opts.redirectEquiposCategoryId != null && opts.redirectEquiposCategoryId !== ''
                    ? opts.redirectEquiposCategoryId
                    : null;
            modalPostTitulo.textContent = opts.titulo || 'Aviso';
            modalPostMensaje.textContent = opts.mensaje != null ? String(opts.mensaje) : '';
            modalPost.classList.remove('hidden');
            modalPost.classList.add('flex');
            modalPost.setAttribute('aria-hidden', 'false');
            modalPostAceptar.focus();
        }

        function onModalPostAceptar() {
            hidePostRegistroModal();
            if (modalPostContinueFutbol) {
                modalPostContinueFutbol = false;
                var rules = cachedReglasCategoria || [];
                if (rules.length) {
                    showChecklistForRules(rules);
                } else {
                    loadCategoryRulesForChecklist().then(showChecklistForRules).catch(function (err) {
                        showAvisoModal(
                            'Error al cargar',
                            (err && err.message) || 'No se pudieron cargar las reglas.'
                        );
                    });
                }
                return;
            }
            if (modalPostRedirectEquiposCat != null) {
                w.location.hash =
                    '#/categoria/' + encodeURIComponent(String(modalPostRedirectEquiposCat)) + '/equipos';
                modalPostRedirectEquiposCat = null;
                modalPostIrAlInicio = false;
                return;
            }
            if (modalPostIrAlInicio) {
                w.location.hash = '#/visitante';
            } else {
                btnReg.disabled = false;
            }
            modalPostIrAlInicio = false;
        }

        function onModalPostBackdrop(e) {
            if (e.target === modalPost) {
                onModalPostAceptar();
            }
        }

        function onModalPostKeydown(e) {
            if (e.key !== 'Escape') {
                return;
            }
            var specM = host1.querySelector('#reg-modal-spec-t1');
            if (specM && !specM.classList.contains('hidden')) {
                hideSpecModalT1();
                e.preventDefault();
                return;
            }
            if (!modalConfirm.classList.contains('hidden')) {
                onModalConfirmCancelar();
                e.preventDefault();
                return;
            }
            if (!modalDesc.classList.contains('hidden')) {
                onModalDescAceptar();
                e.preventDefault();
                return;
            }
            if (!modalPost.classList.contains('hidden')) {
                onModalPostAceptar();
            }
        }

        /** Botón que abrió el modal de especificación (para devolver foco y evitar aria-hidden + foco dentro). */
        var regSpecT1Opener = null;

        function hideSpecModalT1() {
            var m = host1.querySelector('#reg-modal-spec-t1');
            if (!m) {
                return;
            }
            var opener = regSpecT1Opener;
            regSpecT1Opener = null;
            if (opener && host1.contains(opener) && typeof opener.focus === 'function') {
                opener.focus({ preventScroll: true });
            } else {
                var ae = document.activeElement;
                if (ae && m.contains(ae) && typeof ae.blur === 'function') {
                    ae.blur();
                }
            }
            m.classList.add('hidden');
            m.classList.remove('flex');
            m.setAttribute('aria-hidden', 'true');
        }

        /** Títulos del modal tabla 1: medidas → Especificación(es); reglas → Información. */
        function tituloInfoModalTabla1(criterio) {
            var map = {
                Largo: 'Especificación del largo',
                Ancho: 'Especificación del ancho',
                Alto: 'Especificación del alto',
                'Peso máximo': 'Especificaciones del peso máximo',
                Autónomo: 'Información de la autonomía',
                'Alimentación interna': 'Información de la alimentación interna',
                'Módulo de arranque': 'Información del módulo de arranque',
                'Tipo de motor': 'Especificación del tipo de motor',
                'Sistema de control': 'Información del sistema de control'
            };
            if (criterio && map[criterio]) {
                return map[criterio];
            }
            return criterio ? 'Información de: ' + criterio : 'Información';
        }

        function showSpecModalT1(criterio, bodyText, openerBtn) {
            var m = host1.querySelector('#reg-modal-spec-t1');
            var tit = host1.querySelector('#reg-modal-spec-t1-title');
            var body = host1.querySelector('#reg-modal-spec-t1-body');
            var closeBtn = host1.querySelector('#reg-modal-spec-t1-close');
            if (!m || !tit || !body) {
                return;
            }
            regSpecT1Opener = openerBtn && host1.contains(openerBtn) ? openerBtn : null;
            tit.textContent = tituloInfoModalTabla1(criterio);
            body.textContent = bodyText != null ? String(bodyText) : '';
            m.setAttribute('aria-hidden', 'false');
            m.classList.remove('hidden');
            m.classList.add('flex');
            if (closeBtn && typeof closeBtn.focus === 'function') {
                closeBtn.focus();
            }
        }

        /** Clic en la fila (no en el propio checkbox) alterna el check — mejor puntería en móvil. */
        function onChecklistRowClick(e) {
            if (e.target.closest('[data-reg-eliminar]')) {
                onEliminarClick(e);
                return;
            }
            if (e.target.closest('[data-reg-spec-open]')) {
                var openBtn = e.target.closest('[data-reg-spec-open]');
                if (openBtn && host1.contains(openBtn)) {
                    var tid = openBtn.getAttribute('data-spec-tpl');
                    var crit = openBtn.getAttribute('data-criterio') || '';
                    var tpl = tid ? document.getElementById(tid) : null;
                    var txt = '';
                    if (tpl && tpl.content) {
                        txt = String(tpl.content.textContent || '').trim();
                    }
                    showSpecModalT1(crit, txt, openBtn);
                }
                return;
            }
            if (e.target.id === 'reg-modal-spec-t1') {
                hideSpecModalT1();
                return;
            }
            if (e.target.closest('#reg-modal-spec-t1-close')) {
                hideSpecModalT1();
                return;
            }
            if (e.target.closest('input[type="checkbox"]') || e.target.closest('.cr-reg-check-label')) {
                return;
            }
            var tr = e.target.closest('tbody tr');
            if (!tr || !scrollHost.contains(tr)) {
                return;
            }
            var chk = tr.querySelector('input[type="checkbox"]');
            if (!chk || chk.disabled) {
                return;
            }
            chk.checked = !chk.checked;
            chk.dispatchEvent(new Event('change', { bubbles: true }));
        }

        /* --- Panel detalle del equipo (columna derecha) --- */

        var prevTrim = '';
        var detalleTimer = null;
        /** True solo si el último fetch de detalle devolvió datos para el texto actual del input. */
        var detalleResuelto = false;
        /** Tras Verificar correcto: no volver a mostrar la tabla de datos aunque sync pida lo contrario. */
        var detalleOcultoTrasVerificar = false;
        var tabla1ChangeHandlers = [];
        var tabla2ChangeHandlers = [];

        function loadCategoryRulesForChecklist() {
            if (cachedReglasCategoria) {
                return Promise.resolve(cachedReglasCategoria);
            }
            var catId = resolveChecklistCategoryId();
            if (catId == null || !w.CRApi || typeof w.CRApi.getReglasByCategory !== 'function') {
                return Promise.resolve([]);
            }
            return w.CRApi.getReglasByCategory(catId).then(function (rules) {
                cachedReglasCategoria = rules || [];
                return cachedReglasCategoria;
            });
        }

        function resetChecklistUi() {
            cachedReglasCategoria = null;
            cachedRestrictionRules = [];
            regRobotSlot = 1;
            modalPostContinueFutbol = false;
            hidePostRegistroModal();
            hideConfirmModal();
            hideDescalificarModal();
            hideSpecModalT1();
            shell.classList.add('hidden');
            host1.innerHTML = '';
            host2.innerHTML = '';
            host1.classList.remove('hidden');
            host2.classList.add('hidden');
            if (filaSig) {
                filaSig.classList.remove('hidden');
            }
            filaReg.classList.add('hidden');
            btnSig.disabled = true;
            btnReg.disabled = true;
            tabla1ChangeHandlers.forEach(function (h) {
                h.el.removeEventListener('change', h.fn, false);
            });
            tabla1ChangeHandlers = [];
            tabla2ChangeHandlers.forEach(function (h) {
                h.el.removeEventListener('change', h.fn, false);
            });
            tabla2ChangeHandlers = [];
        }

        function syncDetallePanel() {
            var t = input.value.trim();
            if (!t) {
                detalleResuelto = false;
                detalleOcultoTrasVerificar = false;
                input.disabled = false;
                panel.classList.add('hidden');
                resetChecklistUi();
                return;
            }
            if (detalleOcultoTrasVerificar) {
                panel.classList.add('hidden');
                return;
            }
            if (detalleResuelto) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
                resetChecklistUi();
            }
        }

        function scheduleDetalleFetch() {
            window.clearTimeout(detalleTimer);
            detalleTimer = window.setTimeout(function () {
                var v = input.value.trim();
                if (!v) {
                    limpiarDetalleEquipo(section);
                    detalleResuelto = false;
                    syncDetallePanel();
                    return;
                }
                var gen = U.getDetalleFetchGen();
                U.setRegDetalleLoading(section, true);
                U.withRegistroMinLoading(fetchDetalleEquipoPorNombre(v, section))
                    .then(function (d) {
                        if (input.value.trim() !== v) {
                            return;
                        }
                        if (d) {
                            aplicarDetalleEquipo(section, d);
                        } else {
                            limpiarDetalleEquipo(section);
                        }
                        detalleResuelto = !!d;
                        syncDetallePanel();
                    })
                    .catch(function () {
                        if (input.value.trim() !== v) {
                            return;
                        }
                        limpiarDetalleEquipo(section);
                        detalleResuelto = false;
                        syncDetallePanel();
                    })
                    .finally(function () {
                        if (gen === U.getDetalleFetchGen()) {
                            U.setRegDetalleLoading(section, false);
                        }
                    });
            }, 400);
        }

        function onInputNombre() {
            var t = input.value.trim();
            if (t === '') {
                U.bumpDetalleFetchGen();
                U.setRegDetalleLoading(section, false);
            } else {
                U.bumpDetalleFetchGen();
            }
            if (t !== prevTrim) {
                prevTrim = t;
                resetChecklistUi();
            }
            detalleResuelto = false;
            syncDetallePanel();
            scheduleDetalleFetch();
        }

        function onDetalleChange(d) {
            prevTrim = input.value.trim();
            detalleResuelto = !!d;
            syncDetallePanel();
        }

        function bindTabla1Checks() {
            tabla1ChangeHandlers.forEach(function (h) {
                h.el.removeEventListener('change', h.fn, false);
            });
            tabla1ChangeHandlers = [];
            var checks = host1.querySelectorAll('input[type="checkbox"][data-reg-chk]');
            function syncSiguiente() {
                if (btnSig) {
                    btnSig.disabled = false;
                }
            }
            checks.forEach(function (c) {
                var fn = syncSiguiente;
                c.addEventListener('change', fn, false);
                tabla1ChangeHandlers.push({ el: c, fn: fn });
            });
            syncSiguiente();
        }

        function bindTabla2Checks() {
            tabla2ChangeHandlers.forEach(function (h) {
                h.el.removeEventListener('change', h.fn, false);
            });
            tabla2ChangeHandlers = [];
            var checks = host2.querySelectorAll('input[type="checkbox"][data-reg-chk]');
            function syncRegistrar() {
                if (btnReg) {
                    btnReg.disabled = false;
                }
            }
            checks.forEach(function (c) {
                var fn = syncRegistrar;
                c.addEventListener('change', fn, false);
                tabla2ChangeHandlers.push({ el: c, fn: fn });
            });
            syncRegistrar();
        }

        /* --- Checklists: verificar, tabla 2, enviar POST --- */

        function collectCheckedRuleIdsFromHosts() {
            var ids = [];
            [host1, host2].forEach(function (host) {
                if (!host) {
                    return;
                }
                host.querySelectorAll('input[type="checkbox"][data-reg-chk]:checked').forEach(function (chk) {
                    var rid = chk.getAttribute('data-rule-id');
                    if (rid == null || rid === '') {
                        return;
                    }
                    var n = Number(rid, 10);
                    if (!isNaN(n) && n > 0 && ids.indexOf(n) === -1) {
                        ids.push(n);
                    }
                });
            });
            return ids;
        }

        function resolveValidRules(pass) {
            if (!pass) {
                return Promise.resolve([]);
            }
            return loadCategoryRulesForChecklist().then(function () {
                var required = allRuleIdsFromCache();
                var fromChecks = collectCheckedRuleIdsFromHosts();
                if (!fromChecks.length) {
                    return Promise.reject(
                        new Error('Marca las reglas que el robot cumple, o usa «Eliminar» si no pasa.')
                    );
                }
                if (!required.length) {
                    return Promise.resolve(fromChecks);
                }
                var missing = required.filter(function (id) {
                    return fromChecks.indexOf(id) === -1;
                });
                if (missing.length) {
                    var needBoth =
                        Chk.rulesByType(cachedReglasCategoria, 'characteristic').length > 0 &&
                        Chk.rulesByType(cachedReglasCategoria, 'restriction').length > 0;
                    var msg =
                        needBoth && host2 && host2.classList.contains('hidden')
                            ? 'Marca todas las características y pulsa «Siguiente» para las restricciones.'
                            : 'Marca todas las reglas del checklist antes de registrar.';
                    return Promise.reject(new Error(msg));
                }
                return fromChecks;
            });
        }

        function buildPayloadRegistroVerificacion(teamId, validRules) {
            return {
                team_id: teamId,
                valid_rules: validRules || []
            };
        }

        function enviarVerificacion(pass, opts) {
            opts = opts || {};
            var teamId = getRegEquipoId(section);
            if (teamId == null) {
                showAvisoModal(
                    'Equipo no identificado',
                    'No se identificó el equipo (id). Elige un equipo de la lista de sugerencias o uno que exista en el registro.'
                );
                return;
            }
            var triggerBtn = opts.triggerBtn;
            if (triggerBtn) {
                triggerBtn.disabled = true;
            }
            if (pass && btnReg) {
                btnReg.disabled = true;
            }
            var api = w.CRApi;
            if (!api || typeof api.postRegistro !== 'function') {
                if (typeof opts.onSinApi === 'function') {
                    opts.onSinApi();
                } else {
                    showPostRegistroModal({
                        titulo: 'Sin conexión',
                        mensaje: 'No hay conexión con el servidor. Inténtalo más tarde.',
                        irAlInicio: false
                    });
                }
                if (triggerBtn) {
                    triggerBtn.disabled = false;
                }
                if (pass && btnReg) {
                    btnReg.disabled = false;
                }
                return;
            }
            resolveValidRules(pass)
                .then(function (validRules) {
                    var body = buildPayloadRegistroVerificacion(teamId, validRules);
                    return api.postRegistro(body).then(function (res) {
                        return { res: res, body: body };
                    });
                })
                .then(function (payload) {
                    if (w.CRApi && typeof w.CRApi.clearRegistroCache === 'function') {
                        w.CRApi.clearRegistroCache();
                    }
                    if (typeof opts.onOk === 'function') {
                        opts.onOk(payload.res, payload.body);
                    }
                })
                .catch(function (err) {
                    if (typeof opts.onErr === 'function') {
                        opts.onErr(err);
                    }
                    if (triggerBtn) {
                        triggerBtn.disabled = false;
                    }
                    if (pass && btnReg) {
                        btnReg.disabled = false;
                    }
                });
        }

        function onEliminarClick(e) {
            e.preventDefault();
            var nombreEq = nombreEquipoEnInput();
            var btn = e.target.closest('[data-reg-eliminar]');
            showConfirmModal({
                titulo: 'Descalificar equipo',
                mensaje:
                    '¿Descalificar al equipo ' +
                    nombreEq +
                    '?\n\nEl equipo quedará registrado como no aprobado.',
                onConfirm: function () {
                    enviarVerificacion(false, {
                        triggerBtn: btn,
                        onOk: function () {
                            showDescalificarModal();
                        },
                        onErr: function (err) {
                            showAvisoModal(
                                'No se pudo descalificar',
                                (err && err.message) || 'No se pudo descalificar al equipo.'
                            );
                        },
                        onSinApi: function () {
                            showAvisoModal(
                                'Sin conexión',
                                'No hay conexión con el servidor. Inténtalo más tarde.'
                            );
                        }
                    });
                }
            });
        }

        function onRegistrarClick() {
            if (btnReg.disabled) {
                return;
            }
            enviarVerificacion(true, {
                onOk: function (res, body) {
                    var nombreEq = String(input.value || '')
                        .trim()
                        .replace(/\s+/g, ' ');
                    if (!nombreEq) {
                        nombreEq = 'equipo #' + body.team_id;
                    }
                    var valido =
                        (res && (res.is_valid === true || res.is_valid === 1)) || verificacionCompleta(body);
                    var futbol = isFutbolRegistro();
                    var needTwo = futbol && robotsRequiredForRegistro() > 1;
                    var catId = resolveChecklistCategoryId();
                    var titulo;
                    var mensaje;
                    var redirectCat = catId;

                    if (!valido) {
                        titulo = 'Registro guardado';
                        mensaje =
                            nombreEq +
                            ': revisión registrada. El robot no quedó validado (faltan reglas por cumplir).';
                    } else if (needTwo && regRobotSlot < 2) {
                        titulo = 'Robot 1 validado';
                        mensaje = nombreEq + ': robot 1 validado. Marca el checklist del robot 2.';
                        redirectCat = null;
                        modalPostContinueFutbol = true;
                        regRobotSlot = 2;
                    } else if (needTwo) {
                        titulo = 'Equipo validado';
                        mensaje = nombreEq + ': los 2 robots quedaron validados.';
                    } else {
                        titulo = 'Robot validado';
                        mensaje = nombreEq + ' quedó validado.';
                    }

                    showPostRegistroModal({
                        titulo: titulo,
                        mensaje: mensaje,
                        irAlInicio: false,
                        redirectEquiposCategoryId: redirectCat
                    });
                },
                onErr: function (err) {
                    showPostRegistroModal({
                        titulo: 'No se pudo registrar',
                        mensaje: (err && err.message) || 'Intenta de nuevo más tarde.',
                        irAlInicio: false
                    });
                }
            });
        }

        function showChecklistForRules(rules) {
            var chars = Chk.rulesByType(rules, 'characteristic');
            var rests = Chk.rulesByType(rules, 'restriction');
            cachedRestrictionRules = rests;

            if (!chars.length && !rests.length) {
                showAvisoModal('Sin reglas', 'No hay reglas de verificación para esta categoría.');
                return;
            }

            detalleOcultoTrasVerificar = true;
            input.disabled = true;
            panel.classList.add('hidden');
            shell.classList.remove('hidden');
            host1.innerHTML = '';
            host2.innerHTML = '';
            host1.classList.add('hidden');
            host2.classList.add('hidden');
            if (filaSig) {
                filaSig.classList.remove('hidden');
            }
            filaReg.classList.add('hidden');
            btnSig.disabled = true;
            btnReg.disabled = true;

            if (btnReg) {
                btnReg.textContent =
                    isFutbolRegistro() && robotsRequiredForRegistro() > 1
                        ? 'Registrar robot ' + regRobotSlot
                        : 'Registrar';
            }

            if (chars.length) {
                host1.innerHTML = Chk.renderTable(
                    chars,
                    checklistRenderOpts('characteristic', 'Características', 'Característica')
                );
                host1.classList.remove('hidden');
                if (rests.length) {
                    if (filaSig) {
                        filaSig.classList.remove('hidden');
                    }
                    filaReg.classList.add('hidden');
                    btnSig.disabled = false;
                } else {
                    if (filaSig) {
                        filaSig.classList.add('hidden');
                    }
                    filaReg.classList.remove('hidden');
                    btnReg.disabled = false;
                }
                bindTabla1Checks();
                scrollChecklistTop();
                return;
            }

            host2.innerHTML = Chk.renderTable(
                rests,
                checklistRenderOpts('restriction', 'Restricciones', 'Restricción')
            );
            host2.classList.remove('hidden');
            if (filaSig) {
                filaSig.classList.add('hidden');
            }
            filaReg.classList.remove('hidden');
            btnReg.disabled = false;
            bindTabla2Checks();
            scrollChecklistTop();
        }

        function onVerificarClick() {
            if (resolveChecklistCategoryId() == null) {
                showAvisoModal(
                    'Sin categoría',
                    'Elige una categoría y un equipo antes de verificar.'
                );
                return;
            }
            resetChecklistUi();
            loadCategoryRulesForChecklist()
                .then(function (rules) {
                    showChecklistForRules(rules);
                })
                .catch(function (err) {
                    showAvisoModal(
                        'Error al cargar',
                        (err && err.message) || 'No se pudieron cargar las reglas de la categoría.'
                    );
                });
        }

        function showRegistrarTrasChecklist() {
            host1.classList.add('hidden');
            host2.innerHTML = '';
            host2.classList.add('hidden');
            if (filaSig) {
                filaSig.classList.add('hidden');
            }
            filaReg.classList.remove('hidden');
            btnReg.disabled = false;
        }

        function onSiguienteClick() {
            hideSpecModalT1();
            if (!cachedRestrictionRules.length) {
                showRegistrarTrasChecklist();
                scrollChecklistTop();
                return;
            }
            host1.classList.add('hidden');
            host2.innerHTML = Chk.renderTable(
                cachedRestrictionRules,
                checklistRenderOpts('restriction', 'Restricciones', 'Restricción')
            );
            host2.classList.remove('hidden');
            if (filaSig) {
                filaSig.classList.add('hidden');
            }
            filaReg.classList.remove('hidden');
            btnReg.disabled = false;
            bindTabla2Checks();
            scrollChecklistTop();
        }

        syncDetallePanel();
        shell.addEventListener('click', onChecklistRowClick, false);
        modalPost.addEventListener('click', onModalPostBackdrop, false);
        modalPostAceptar.addEventListener('click', onModalPostAceptar, false);
        modalConfirm.addEventListener('click', onModalConfirmBackdrop, false);
        modalConfirmAceptar.addEventListener('click', onModalConfirmAceptar, false);
        modalConfirmCancelar.addEventListener('click', onModalConfirmCancelar, false);
        modalDesc.addEventListener('click', onModalDescBackdrop, false);
        modalDescAceptar.addEventListener('click', onModalDescAceptar, false);
        document.addEventListener('keydown', onModalPostKeydown, true);
        input.addEventListener('input', onInputNombre, false);
        btnVer.addEventListener('click', onVerificarClick, false);
        btnSig.addEventListener('click', onSiguienteClick, false);
        btnReg.addEventListener('click', onRegistrarClick, false);
        if (btnPdf) {
            btnPdf.addEventListener('click', onPdfChecklistClick, false);
        }

        return {
            cleanup: function () {
                window.clearTimeout(detalleTimer);
                U.bumpDetalleFetchGen();
                U.setRegDetalleLoading(section, false);
                document.removeEventListener('keydown', onModalPostKeydown, true);
                modalPost.removeEventListener('click', onModalPostBackdrop, false);
                modalPostAceptar.removeEventListener('click', onModalPostAceptar, false);
                modalConfirm.removeEventListener('click', onModalConfirmBackdrop, false);
                modalConfirmAceptar.removeEventListener('click', onModalConfirmAceptar, false);
                modalConfirmCancelar.removeEventListener('click', onModalConfirmCancelar, false);
                modalDesc.removeEventListener('click', onModalDescBackdrop, false);
                modalDescAceptar.removeEventListener('click', onModalDescAceptar, false);
                shell.removeEventListener('click', onChecklistRowClick, false);
                input.removeEventListener('input', onInputNombre, false);
                btnVer.removeEventListener('click', onVerificarClick, false);
                btnSig.removeEventListener('click', onSiguienteClick, false);
                btnReg.removeEventListener('click', onRegistrarClick, false);
                if (btnPdf) {
                    btnPdf.removeEventListener('click', onPdfChecklistClick, false);
                }
                resetChecklistUi();
            },
            onDetalleChange: onDetalleChange,
            cancelPendingDetalle: function () {
                window.clearTimeout(detalleTimer);
            }
        };
    }

    w.CRRegistroPantalla = { init: initRegistrarFlow };
})(window);
