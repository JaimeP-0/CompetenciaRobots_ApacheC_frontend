/**
 * Lista desplegable de nombres de equipo (#nombre-equipo).
 */
(function (w) {
    'use strict';

    var U = w.CRUtil;
    var Equipos = w.CRRegistroEquipos;
    if (!U || !Equipos) {
        throw new Error("Carga registro/equipo-datos.js antes");
    }
    var fetchDetalleEquipoPorNombre = Equipos.fetchDetallePorNombre;
    var aplicarDetalleEquipo = Equipos.aplicarDetalle;
    var limpiarDetalleEquipo = Equipos.limpiarDetalle;

    function initEquipoAutocomplete(root, hooks) {
        hooks = hooks || {};
        var input = root.querySelector('#nombre-equipo');
        var list = root.querySelector('#equipo-sugerencias');
        if (!input || !list) {
            return function () {};
        }
        limpiarDetalleEquipo(root);
        var debTimer = null;
        var seq = 0;

        function setExpanded(on) {
            input.setAttribute('aria-expanded', on ? 'true' : 'false');
        }

        function hideList() {
            list.classList.add('hidden');
            list.innerHTML = '';
            list.style.position = '';
            list.style.left = '';
            list.style.top = '';
            list.style.width = '';
            list.style.maxHeight = '';
            list.style.zIndex = '';
            setExpanded(false);
        }

        function syncSugerenciasLayer() {
            if (list.classList.contains('hidden')) {
                return;
            }
            var r = input.getBoundingClientRect();
            var gap = 4;
            var pad = 8;
            var vw = w.innerWidth || 0;
            var vh = w.visualViewport && w.visualViewport.height ? w.visualViewport.height : w.innerHeight || 0;
            var availBelow = vh - r.bottom - gap - pad;
            var maxList = Math.min(240, Math.max(96, availBelow));
            var wList = Math.min(r.width, vw - 2 * pad);
            var left = Math.max(pad, Math.min(r.left, vw - pad - wList));
            list.style.position = 'fixed';
            list.style.left = left + 'px';
            list.style.top = r.bottom + gap + 'px';
            list.style.width = wList + 'px';
            list.style.maxHeight = maxList + 'px';
            list.style.zIndex = '200';
        }

        function scheduleSyncLayer() {
            syncSugerenciasLayer();
            w.requestAnimationFrame(syncSugerenciasLayer);
        }

        function onWinResizeOrScroll() {
            syncSugerenciasLayer();
        }

        function showList() {
            list.classList.remove('hidden');
            setExpanded(true);
            scheduleSyncLayer();
        }

        function renderItems(labels) {
            list.innerHTML = '';
            labels.forEach(function (text) {
                var li = document.createElement('li');
                li.setAttribute('role', 'option');
                li.className =
                    'cursor-pointer px-2 py-1.5 text-[15px] text-graphite hover:bg-mist active:bg-mist/80';
                li.textContent = text;
                li.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    if (typeof hooks.cancelPendingDetalle === 'function') {
                        hooks.cancelPendingDetalle();
                    }
                    U.bumpDetalleFetchGen();
                    var gen = U.getDetalleFetchGen();
                    input.value = text;
                    hideList();
                    input.blur();
                    U.setRegDetalleLoading(root, true);
                    U.withRegistroMinLoading(fetchDetalleEquipoPorNombre(text, root))
                        .then(function (d) {
                            if (d) {
                                aplicarDetalleEquipo(root, d);
                            } else {
                                limpiarDetalleEquipo(root);
                            }
                            if (typeof hooks.onDetalleChange === 'function') {
                                hooks.onDetalleChange(d);
                            }
                        })
                        .catch(function () {
                            limpiarDetalleEquipo(root);
                            if (typeof hooks.onDetalleChange === 'function') {
                                hooks.onDetalleChange(null);
                            }
                        })
                        .finally(function () {
                            if (gen === U.getDetalleFetchGen()) {
                                U.setRegDetalleLoading(root, false);
                            }
                        });
                });
                list.appendChild(li);
            });
            if (labels.length) {
                showList();
            } else {
                hideList();
            }
        }

        function isInputFocused() {
            return document.activeElement === input;
        }

        function runSearch() {
            if (!isInputFocused()) {
                hideList();
                return;
            }
            var q = input.value.trim();
            if (!q) {
                hideList();
                return;
            }
            var mySeq = ++seq;
            Equipos.fetchSugerencias(q, root)
                .then(function (items) {
                    if (mySeq !== seq) {
                        return;
                    }
                    if (!isInputFocused()) {
                        hideList();
                        return;
                    }
                    renderItems(items);
                })
                .catch(hideList);
        }

        function onInput() {
            if (!isInputFocused()) {
                return;
            }
            window.clearTimeout(debTimer);
            debTimer = window.setTimeout(runSearch, 280);
        }

        function onFocus() {
            if (input.value.trim()) {
                runSearch();
            } else {
                hideList();
            }
        }

        function onBlur() {
            window.clearTimeout(debTimer);
            hideList();
        }

        function onDocClick(e) {
            if (!root.contains(e.target)) {
                hideList();
            }
        }

        input.addEventListener('input', onInput, false);
        input.addEventListener('focus', onFocus, false);
        input.addEventListener('blur', onBlur, false);
        document.addEventListener('click', onDocClick, false);
        w.addEventListener('resize', onWinResizeOrScroll, false);
        w.addEventListener('scroll', onWinResizeOrScroll, true);
        if (w.visualViewport) {
            w.visualViewport.addEventListener('resize', onWinResizeOrScroll, false);
            w.visualViewport.addEventListener('scroll', onWinResizeOrScroll, false);
        }
        var outletScroll = document.getElementById('cr-outlet');
        if (outletScroll) {
            outletScroll.addEventListener('scroll', onWinResizeOrScroll, false);
        }
        var checklistScrollHost = root.querySelector('#reg-checklist-scroll');
        if (checklistScrollHost) {
            checklistScrollHost.addEventListener('scroll', onWinResizeOrScroll, false);
        }

        return function cleanup() {
            window.clearTimeout(debTimer);
            input.removeEventListener('input', onInput, false);
            input.removeEventListener('focus', onFocus, false);
            input.removeEventListener('blur', onBlur, false);
            document.removeEventListener('click', onDocClick, false);
            w.removeEventListener('resize', onWinResizeOrScroll, false);
            w.removeEventListener('scroll', onWinResizeOrScroll, true);
            if (w.visualViewport) {
                w.visualViewport.removeEventListener('resize', onWinResizeOrScroll, false);
                w.visualViewport.removeEventListener('scroll', onWinResizeOrScroll, false);
            }
            if (outletScroll) {
                outletScroll.removeEventListener('scroll', onWinResizeOrScroll, false);
            }
            if (checklistScrollHost) {
                checklistScrollHost.removeEventListener('scroll', onWinResizeOrScroll, false);
            }
            hideList();
        };
    }

    w.CRRegistroAutocomplete = { init: initEquipoAutocomplete };
})(window);
