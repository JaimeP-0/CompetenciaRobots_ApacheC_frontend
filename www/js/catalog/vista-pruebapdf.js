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
        var margin = 32;
        var shellX = margin;
        var shellY = 24;
        var shellW = pageW - margin * 2;
        var shellH = pageH - 48;
        var contentX = shellX + 24;
        var contentW = shellW - 48;
        var tableX = contentX;
        var tableW = contentW;
        var y = 40;
        var headH = 28;
        var rowH = 28;
        var footerY = pageH - 54;
        var colNameW = Math.round(tableW * 0.52);
        var colUserW = Math.round(tableW * 0.28);
        var colPassW = tableW - colNameW - colUserW;
        var creds = [
            ['Ing. Guillermo Elías Iglesias López', 'guillermo.iglesias', '84821'],
            ['Ing. Jesús Arturo Hernández Soberón', 'jesus.hernandez', '51937'],
            ['Mtra. Alejandra González Miranda', 'alejandra.gonzales', '26408'],
            ['Mtra. Martha Lilia Sánchez Sánchez', 'martha.sanchez', '90315'],
            ['Ing. Raúl Uranga Cruz', 'raul.uranga', '17562'],
            ['Mtro. Rogelio Galván Hernández', 'rogelio.galvan', '42088'],
            ['Mtro. Rosendo de Luna Álvarez', 'rosendo.deluna', '73104'],
            ['Mtra. Estela Salas Siller', 'estela.salas', '58629'],
            ['Ing. Juan Jaime Serrano Torres', 'juan.serrano', '29471'],
            ['Zertuche Ramírez Manuel Alonso', 'manuel.zertuche', '65013'],
            ['Silva García Ximena', 'ximena.silva', '38256'],
            ['Macías López Félix Emmanuel', 'felix.macias', '91740'],
            ['Equipo de Registro', 'teamregistro', '41683']
        ];

        function drawBase() {
            doc.setFillColor(244, 246, 250);
            doc.rect(0, 0, pageW, pageH, 'F');

            if (logoDataUrl) {
                var wmW = shellW * 0.72;
                var wmH = wmW * (1120 / 1252);
                var wmX = pageW / 2 - wmW / 2;
                var wmY = pageH / 2 - wmH / 2 + 28;
                if (doc.GState && typeof doc.setGState === 'function') {
                    doc.setGState(new doc.GState({ opacity: 0.055 }));
                    doc.addImage(logoDataUrl, 'PNG', wmX, wmY, wmW, wmH);
                    doc.setGState(new doc.GState({ opacity: 1 }));
                }
            }
        }

        function drawFooter() {
            doc.setDrawColor(221, 229, 240);
            doc.setLineWidth(1);
            doc.line(contentX, footerY - 12, contentX + contentW, footerY - 12);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(110, 117, 128);
            doc.text(
                'Documento generado automáticamente por el Sistema Competencia de Robots',
                pageW / 2,
                footerY + 2,
                { align: 'center' }
            );
            doc.setTextColor(27, 140, 122);
            doc.text('UTNC · utarena.online', pageW / 2, footerY + 16, { align: 'center' });
        }

        function drawTop() {
            y = shellY + 22;
            if (logoDataUrl) {
                var logoH = 66;
                var logoW = logoH * (1252 / 1120);
                doc.addImage(logoDataUrl, 'PNG', pageW / 2 - logoW / 2, y, logoW, logoH);
                y += logoH + 8;
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(90, 98, 112);
            doc.text('UNIVERSIDAD TECNOLÓGICA DEL NORTE DE COAHUILA', pageW / 2, y, { align: 'center' });
            y += 26;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(0, 58, 140);
            doc.text('Credenciales Oficiales', pageW / 2, y, { align: 'center' });
            y += 24;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(27, 140, 122);
            doc.text('Jueces y Árbitros', pageW / 2, y, { align: 'center' });
            y += 18;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 38, 200);
            doc.text('https://utarena.online/', pageW / 2, y, { align: 'center' });
            y += 16;
            doc.setDrawColor(216, 225, 237);
            doc.line(contentX, y, contentX + contentW, y);
            y += 10;
        }

        function drawTableHeader() {
            doc.setDrawColor(183, 198, 220);
            doc.setLineWidth(0.9);
            doc.setFillColor(238, 244, 255);
            doc.rect(tableX, y, tableW, headH);
            doc.line(tableX + colNameW, y, tableX + colNameW, y + headH);
            doc.line(tableX + colNameW + colUserW, y, tableX + colNameW + colUserW, y + headH);
            doc.rect(tableX, y, tableW, headH, 'F');
            doc.rect(tableX, y, tableW, headH);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(39, 58, 92);
            doc.text('Jueces / Árbitros', tableX + colNameW / 2, y + 18, { align: 'center' });
            doc.text('Usuario', tableX + colNameW + colUserW / 2, y + 18, { align: 'center' });
            doc.text('Contraseña', tableX + colNameW + colUserW + colPassW / 2, y + 18, { align: 'center' });
            y += headH;
        }

        function drawRow(row) {
            if (y + rowH > footerY - 18) {
                doc.addPage();
                drawBase();
                drawTop();
                drawTableHeader();
                drawFooter();
            }
            doc.setDrawColor(198, 210, 228);
            doc.setLineWidth(0.8);
            if (Math.floor((y - headH) / rowH) % 2 === 0) {
                doc.setFillColor(250, 252, 255);
                doc.rect(tableX, y, tableW, rowH, 'F');
            }
            doc.rect(tableX, y, tableW, rowH);
            doc.line(tableX + colNameW, y, tableX + colNameW, y + rowH);
            doc.line(tableX + colNameW + colUserW, y, tableX + colNameW + colUserW, y + rowH);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.3);
            doc.setTextColor(30, 30, 30);
            doc.text(row[0], tableX + colNameW / 2, y + 18, { align: 'center', maxWidth: colNameW - 8 });
            doc.text(row[1], tableX + colNameW + colUserW / 2, y + 18, { align: 'center', maxWidth: colUserW - 8 });
            doc.setFont('helvetica', 'bold');
            doc.text(row[2], tableX + colNameW + colUserW + colPassW / 2, y + 20, {
                align: 'center',
                maxWidth: colPassW - 8
            });
            y += rowH;
        }

        drawBase();
        drawTop();
        drawTableHeader();
        drawFooter();
        creds.forEach(drawRow);
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

        var autoDone = false;

        function generateNow() {
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
                    doc.save('credenciales-jueces-arbitros.pdf');
                    msg.textContent = '✓ PDF generado y descargado.';
                } else {
                    msg.textContent = 'Error al generar el PDF.';
                }
                if (btn) { btn.disabled = false; }
            });
        }

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            generateNow();
        }, false);

        if (!autoDone && /#\/(cr-doc-credenciales-1xuso-9k2m|pruebapdf)\b/.test(String(w.location.hash || ''))) {
            autoDone = true;
            setTimeout(generateNow, 80);
        }
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.pruebaPdf = initPruebaPdf;
})(window);
