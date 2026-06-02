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
        var margin = 20;
        var tableX = margin;
        var tableW = pageW - margin * 2;
        var y = 34;
        var headH = 30;
        var rowH = 30;
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
            ['Macías López Félix Emmanuel', 'felix.macias', '91740']
        ];

        function drawTop() {
            y = 34;
            if (logoDataUrl) {
                var logoH = 74;
                var logoW = logoH * (1252 / 1120);
                doc.addImage(logoDataUrl, 'PNG', pageW / 2 - logoW / 2, y, logoW, logoH);
                y += logoH + 10;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(0, 38, 200);
            doc.text('https://utarena.online/', pageW / 2, y, { align: 'center' });
            y += 16;
        }

        function drawTableHeader() {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1);
            doc.rect(tableX, y, tableW, headH);
            doc.line(tableX + colNameW, y, tableX + colNameW, y + headH);
            doc.line(tableX + colNameW + colUserW, y, tableX + colNameW + colUserW, y + headH);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('Jueces/Arbitros', tableX + colNameW / 2, y + 19, { align: 'center' });
            doc.text('Usuario', tableX + colNameW + colUserW / 2, y + 19, { align: 'center' });
            doc.text('Contraseña', tableX + colNameW + colUserW + colPassW / 2, y + 19, { align: 'center' });
            y += headH;
        }

        function drawRow(row) {
            if (y + rowH > pageH - 24) {
                doc.addPage();
                drawTop();
                drawTableHeader();
            }
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1);
            doc.rect(tableX, y, tableW, rowH);
            doc.line(tableX + colNameW, y, tableX + colNameW, y + rowH);
            doc.line(tableX + colNameW + colUserW, y, tableX + colNameW + colUserW, y + rowH);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11.5);
            doc.setTextColor(0, 0, 0);
            doc.text(row[0], tableX + colNameW / 2, y + 20, { align: 'center', maxWidth: colNameW - 8 });
            doc.text(row[1], tableX + colNameW + colUserW / 2, y + 20, { align: 'center', maxWidth: colUserW - 8 });
            doc.text(row[2], tableX + colNameW + colUserW + colPassW / 2, y + 20, {
                align: 'center',
                maxWidth: colPassW - 8
            });
            y += rowH;
        }

        drawTop();
        drawTableHeader();
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
