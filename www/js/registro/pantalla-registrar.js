/**
 * Pantalla #registrar: verificar, tablas checklist, POST validar.
 */
(function (w) {
    'use strict';

    var U = w.CRUtil;
    var Equipos = w.CRRegistroEquipos;
    var Chk = w.CRRegistroChecklists;
    if (!U || !Equipos || !Chk || !w.CRViews) {
        throw new Error("Carga registro/* y core/views antes");
    }
    var REG_CHECKLIST_SLUGS = Chk.SLUGS;
    var regChecklistTableCount = Chk.tableCount;
    var slugCategoriaChecklist = Chk.slugFromSection;
    var getRegEquipoId = Equipos.getEquipoId;
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

        /** Tras cerrar el modal: inicio, o solo re-habilitar Registrar. */
        var modalPostIrAlInicio = false;
        var modalConfirmOnAceptar = null;

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
            w.location.hash = '#/';
        }

        function onModalDescBackdrop(e) {
            if (e.target === modalDesc) {
                onModalDescAceptar();
            }
        }

        function showPostRegistroModal(opts) {
            opts = opts || {};
            modalPostIrAlInicio = !!opts.irAlInicio;
            modalPostTitulo.textContent = opts.titulo || 'Aviso';
            modalPostMensaje.textContent = opts.mensaje != null ? String(opts.mensaje) : '';
            modalPost.classList.remove('hidden');
            modalPost.classList.add('flex');
            modalPost.setAttribute('aria-hidden', 'false');
            modalPostAceptar.focus();
        }

        function onModalPostAceptar() {
            hidePostRegistroModal();
            if (modalPostIrAlInicio) {
                w.location.hash = '#/';
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

        function resetChecklistUi() {
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
                U.withRegistroMinLoading(fetchDetalleEquipoPorNombre(v))
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
                var all = true;
                checks.forEach(function (c) {
                    if (!c.checked) {
                        all = false;
                    }
                });
                btnSig.disabled = !all;
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
                var all = true;
                checks.forEach(function (c) {
                    if (!c.checked) {
                        all = false;
                    }
                });
                btnReg.disabled = !all;
            }
            checks.forEach(function (c) {
                var fn = syncRegistrar;
                c.addEventListener('change', fn, false);
                tabla2ChangeHandlers.push({ el: c, fn: fn });
            });
            syncRegistrar();
        }

        /* --- Checklists: verificar, tabla 2, enviar POST --- */

        function buildPayloadRegistroVerificacion(pass) {
            return {
                team_id: getRegEquipoId(section),
                pass: !!pass
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
            var body = buildPayloadRegistroVerificacion(pass);
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
            api
                .postRegistro(body)
                .then(function (res) {
                    if (w.CRApi && typeof w.CRApi.clearRegistroCache === 'function') {
                        w.CRApi.clearRegistroCache();
                    }
                    if (typeof opts.onOk === 'function') {
                        opts.onOk(res, body);
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
                    var soloLocal = res && res.local;
                    showPostRegistroModal({
                        titulo: soloLocal ? 'Verificación completada' : 'Registro completado',
                        mensaje: soloLocal
                            ? 'Se validó el equipo ' + nombreEq + ' en este dispositivo.'
                            : 'Se registró la verificación de ' + nombreEq + ' correctamente.',
                        irAlInicio: true
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

        function onVerificarClick() {
            var slug = slugCategoriaChecklist(section);
            if (!slug) {
                showAvisoModal(
                    'Sin categoría',
                    'No hay categoría en los datos del equipo. Completa o elige un equipo con categoría.'
                );
                return;
            }
            if (REG_CHECKLIST_SLUGS.indexOf(slug) === -1) {
                showAvisoModal(
                    'Checklist no disponible',
                    'No hay checklist de verificación para esta categoría. Disponibles: ' +
                        REG_CHECKLIST_SLUGS.join(', ') +
                        '.'
                );
                return;
            }
            resetChecklistUi();
            w.CRViews.fetchChecklistFragment(slug, 1)
                .then(function (html) {
                    detalleOcultoTrasVerificar = true;
                    input.disabled = true;
                    panel.classList.add('hidden');
                    host1.innerHTML = html;
                    shell.classList.remove('hidden');
                    bindTabla1Checks();
                })
                .catch(function (err) {
                    showAvisoModal(
                        'Error al cargar',
                        (err && err.message) || 'No se pudo cargar el checklist.'
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
            var slug = slugCategoriaChecklist(section);
            if (REG_CHECKLIST_SLUGS.indexOf(slug) === -1) {
                return;
            }
            hideSpecModalT1();
            if (regChecklistTableCount(slug) < 2) {
                showRegistrarTrasChecklist();
                return;
            }
            w.CRViews.fetchChecklistFragment(slug, 2)
                .then(function (html) {
                    host1.classList.add('hidden');
                    host2.innerHTML = html;
                    host2.classList.remove('hidden');
                    if (filaSig) {
                        filaSig.classList.add('hidden');
                    }
                    filaReg.classList.remove('hidden');
                    btnReg.disabled = true;
                    bindTabla2Checks();
                })
                .catch(function (err) {
                    showAvisoModal(
                        'Error al cargar',
                        (err && err.message) || 'No se pudo cargar la segunda tabla.'
                    );
                });
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
