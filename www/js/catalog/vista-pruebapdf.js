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
        var doc = new jsPDF({ unit: 'pt', format: 'letter' });
        var pageW = 612;
        var pageH = 792;
        var margin = 34;
        var cardX = margin;
        var cardY = 24;
        var cardW = pageW - margin * 2;
        var cardH = pageH - 48;
        var contentX = cardX + 26;
        var contentW = cardW - 52;
        var y = 0;
        var footerTop = pageH - 58;
        var now = new Date();
        var year = now.getFullYear();
        var seq = String(Math.max(1, Math.floor(now.getTime() / 1000) % 1000000)).padStart(6, '0');
        var folio = 'CR-' + year + '-' + seq;
        var results = (campos || []).map(function (c, idx) {
            return {
                label: String(c && c.label ? c.label : 'Resultado ' + (idx + 1)),
                value: String(c && c.value ? c.value : 'Sin captura')
            };
        });
        var podium = [
            { title: 'Primer Lugar', fill: [255, 243, 205], stroke: [245, 185, 52], value: results[0] ? results[0].value : 'Por definir' },
            { title: 'Segundo Lugar', fill: [238, 242, 247], stroke: [160, 170, 182], value: results[1] ? results[1].value : 'Por definir' },
            { title: 'Tercer Lugar', fill: [250, 233, 218], stroke: [201, 139, 82], value: results[2] ? results[2].value : 'Por definir' }
        ];

        function footer() {
            doc.setDrawColor(220, 226, 236);
            doc.setLineWidth(1);
            doc.line(contentX, footerTop - 10, contentX + contentW, footerTop - 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(111, 116, 128);
            doc.text(
                'Documento generado automáticamente por el Sistema Competencia de Robots',
                pageW / 2,
                footerTop + 6,
                { align: 'center' }
            );
            doc.setTextColor(27, 140, 122);
            doc.text('UTNC · utarena.online', pageW / 2, footerTop + 20, { align: 'center' });
        }

        function baseSheet() {
            doc.setFillColor(244, 246, 250);
            doc.rect(0, 0, pageW, pageH, 'F');

            doc.setFillColor(224, 231, 241);
            doc.rect(cardX + 5, cardY + 7, cardW, cardH, 'F');
            doc.setFillColor(255, 255, 255);
            doc.rect(cardX, cardY, cardW, cardH, 'F');

            if (logoDataUrl) {
                var wmW = cardW * 0.74;
                var wmH = wmW * (1120 / 1252);
                var wmX = pageW / 2 - wmW / 2;
                var wmY = pageH / 2 - wmH / 2 + 8;
                if (doc.GState && typeof doc.setGState === 'function') {
                    doc.setGState(new doc.GState({ opacity: 0.06 }));
                    doc.addImage(logoDataUrl, 'PNG', wmX, wmY, wmW, wmH);
                    doc.setGState(new doc.GState({ opacity: 1 }));
                } else {
                    doc.addImage(logoDataUrl, 'PNG', wmX, wmY, wmW, wmH);
                }
            }
            footer();
        }

        function simpleHeader() {
            y = cardY + 34;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 58, 140);
            doc.text('Resultados Oficiales · Competencia de Robots', contentX, y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(95, 101, 116);
            doc.text('UTNC · Folio ' + folio, contentX + contentW, y, { align: 'right' });
            y += 16;
            doc.setDrawColor(225, 232, 241);
            doc.line(contentX, y, contentX + contentW, y);
            y += 18;
        }

        function fullHeader() {
            y = cardY + 28;
            if (logoDataUrl) {
                var logoH = 76;
                var logoW = logoH * (1252 / 1120);
                doc.addImage(logoDataUrl, 'PNG', pageW / 2 - logoW / 2, y, logoW, logoH);
                y += logoH + 12;
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(95, 101, 116);
            doc.text('UNIVERSIDAD TECNOLÓGICA DEL NORTE DE COAHUILA', pageW / 2, y, { align: 'center' });
            y += 30;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(25);
            doc.setTextColor(0, 58, 140);
            doc.text('Resultados Oficiales', pageW / 2, y, { align: 'center' });
            y += 24;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(27, 140, 122);
            doc.text('Competencia de Robots', pageW / 2, y, { align: 'center' });
            y += 18;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(95, 101, 116);
            doc.text('Registro, consulta y competencia en un solo lugar.', pageW / 2, y, { align: 'center' });
            y += 22;

            var infoY = y;
            var gap = 14;
            var boxW = (contentW - gap) / 2;
            var boxH = 62;

            doc.setFillColor(246, 249, 255);
            doc.setDrawColor(222, 230, 240);
            doc.roundedRect(contentX, infoY, boxW, boxH, 10, 10, 'FD');
            doc.roundedRect(contentX + boxW + gap, infoY, boxW, boxH, 10, 10, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(118, 124, 138);
            doc.text('FECHA OFICIAL', contentX + 12, infoY + 17);
            doc.text('FOLIO', contentX + boxW + gap + 12, infoY + 17);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 30, 30);
            doc.text(fechaLarga(), contentX + 12, infoY + 38);
            doc.setTextColor(0, 58, 140);
            doc.text(folio, contentX + boxW + gap + 12, infoY + 38);
            y = infoY + boxH + 20;
        }

        function ensureSpace(h) {
            if (y + h <= footerTop - 14) {
                return;
            }
            doc.addPage();
            baseSheet();
            simpleHeader();
        }

        function resultCard(entry, idx) {
            var valueW = contentW - 4;
            var valueLines = doc.splitTextToSize(entry.value, valueW);
            var blockH = Math.max(24, valueLines.length * 17);
            ensureSpace(blockH + 10);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(30, 30, 30);
            doc.text(valueLines, contentX, y + 16, { maxWidth: valueW });
            y += blockH + 10;
        }

        function podiumSection() {
            ensureSpace(184);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(0, 58, 140);
            doc.text('Podio oficial por categoría', contentX, y);
            y += 12;
            doc.setDrawColor(27, 140, 122);
            doc.setLineWidth(1);
            doc.line(contentX, y, contentX + 210, y);
            y += 14;

            var gap = 10;
            var boxW = (contentW - gap * 2) / 3;
            var boxH = 130;
            ensureSpace(boxH + 8);
            podium.forEach(function (p, i) {
                var bx = contentX + (boxW + gap) * i;
                doc.setFillColor(p.fill[0], p.fill[1], p.fill[2]);
                doc.setDrawColor(p.stroke[0], p.stroke[1], p.stroke[2]);
                doc.roundedRect(bx, y, boxW, boxH, 12, 12, 'FD');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(75, 75, 75);
                doc.text(p.title.toUpperCase(), bx + boxW / 2, y + 30, { align: 'center' });

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(30, 30, 30);
                var podiumLines = doc.splitTextToSize(p.value, boxW - 18);
                doc.text(podiumLines, bx + boxW / 2, y + 56, { align: 'center', maxWidth: boxW - 18 });
            });
            y += boxH + 14;
        }

        baseSheet();
        fullHeader();
        podiumSection();

        y += 4;

        results.forEach(function (entry, idx) {
            resultCard(entry, idx);
        });

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
