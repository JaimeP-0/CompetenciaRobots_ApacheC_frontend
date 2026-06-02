/**
 * Vista #/pruebapdf — genera PDF con logo UTNC, fecha formateada y 3 campos.
 */
(function (w) {
    'use strict';

    var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    var MESES = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    function fechaLarga() {
        var d = new Date();
        return (
            DIAS[d.getDay()] + ', ' +
            d.getDate() + ' de ' +
            MESES[d.getMonth()] + ' del ' +
            d.getFullYear()
        );
    }

    function logoBase64() {
        return fetch('img/logo_utnc.png')
            .then(function (r) { return r.blob(); })
            .then(function (blob) {
                return new Promise(function (resolve) {
                    var reader = new FileReader();
                    reader.onloadend = function () { resolve(reader.result); };
                    reader.onerror = function () { resolve(null); };
                    reader.readAsDataURL(blob);
                });
            })
            .catch(function () { return null; });
    }

    function generarPDF(campos, logoDataUrl) {
        if (!w.jspdf || typeof w.jspdf.jsPDF !== 'function') {
            return null;
        }

        var jsPDF = w.jspdf.jsPDF;
        var pageW = 612;   /* letter pts */
        var pageH = 792;
        var doc = new jsPDF({ unit: 'pt', format: 'letter' });
        var cx = pageW / 2;
        var y = 40;

        /* ── Logo ── (proporción original 1252×1120 ≈ 1.12:1) */
        if (logoDataUrl) {
            var logoH = 72;
            var logoW = Math.round(logoH * (1252 / 1120));
            doc.addImage(logoDataUrl, 'PNG', cx - logoW / 2, y, logoW, logoH);
            y += logoH + 12;
        }

        /* ── Línea separadora ── */
        doc.setDrawColor(27, 140, 122);
        doc.setLineWidth(1.5);
        doc.line(48, y, pageW - 48, y);
        y += 14;

        /* ── Título ── */
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 25, 50);
        doc.text('Competencia de Robots', cx, y, { align: 'center' });
        y += 22;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('Universidad Tecnológica del Norte de Coahuila', cx, y, { align: 'center' });
        y += 28;

        /* ── Fecha ── */
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(27, 140, 122);
        doc.text(fechaLarga(), cx, y, { align: 'center' });
        y += 28;

        /* ── Segunda línea separadora ── */
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(48, y, pageW - 48, y);
        y += 22;

        /* ── Campos ── */
        var fieldPad = 16;
        var fieldW = pageW - 96;

        campos.forEach(function (campo) {
            /* Etiqueta */
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(campo.label.toUpperCase(), cx, y, { align: 'center' });
            y += 14;

            /* Caja */
            doc.setFillColor(247, 248, 251);
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);

            var valor = String(campo.value || '—');
            var maxW = fieldW - fieldPad * 2;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20);
            var lines = doc.splitTextToSize(valor, maxW);
            var boxH = Math.max(32, lines.length * 16 + fieldPad * 1.5);

            doc.roundedRect(48, y, fieldW, boxH, 4, 4, 'FD');
            doc.text(lines, cx, y + fieldPad + 2, { align: 'center' });
            y += boxH + 14;
        });

        /* ── Pie ── */
        y = pageH - 36;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(48, y, pageW - 48, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text('Generado por el sistema de Competencia de Robots · utarena.online', cx, y, { align: 'center' });

        return doc;
    }

    function initPruebaPdf(outlet) {
        var root = (outlet && outlet.querySelector('#cr-pruebapdf-root')) || outlet;
        if (!root) { return; }

        var form = root.querySelector('#cr-pruebapdf-form');
        var c1   = root.querySelector('#cr-pdf-campo-1');
        var c2   = root.querySelector('#cr-pdf-campo-2');
        var c3   = root.querySelector('#cr-pdf-campo-3');
        var msg  = root.querySelector('#cr-pruebapdf-msg');
        var btn  = root.querySelector('button[type="submit"]');
        if (!form || !c1 || !c2 || !c3 || !msg) { return; }

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();

            if (!w.jspdf || typeof w.jspdf.jsPDF !== 'function') {
                msg.textContent = 'No se pudo cargar la librería para PDF.';
                return;
            }

            msg.textContent = 'Generando…';
            if (btn) { btn.disabled = true; }

            logoBase64().then(function (logoDataUrl) {
                var campos = [
                    { label: 'Campo 1', value: c1.value },
                    { label: 'Campo 2', value: c2.value },
                    { label: 'Campo 3', value: c3.value }
                ];
                var doc = generarPDF(campos, logoDataUrl);
                if (doc) {
                    doc.save('prueba.pdf');
                    msg.textContent = '✓ PDF generado y descargado.';
                } else {
                    msg.textContent = 'Error al generar el PDF.';
                }
                if (btn) { btn.disabled = false; }
            });
        }, false);
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.pruebaPdf = initPruebaPdf;
})(window);
