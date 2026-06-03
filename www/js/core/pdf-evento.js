/**
 * PDFs del evento (misma línea visual que pruebapdf / credenciales).
 */
(function (w) {
    'use strict';

    var MESES = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    function fechaLarga() {
        var d = new Date();
        var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return (
            dias[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' del ' + d.getFullYear()
        );
    }

    function logoBase64() {
        return fetch('img/logo_utnc.png')
            .then(function (r) {
                return r.blob();
            })
            .then(function (blob) {
                return new Promise(function (resolve) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        resolve(reader.result);
                    };
                    reader.onerror = function () {
                        resolve(null);
                    };
                    reader.readAsDataURL(blob);
                });
            })
            .catch(function () {
                return null;
            });
    }

    function newDoc() {
        if (!w.jspdf || typeof w.jspdf.jsPDF !== 'function') {
            return null;
        }
        return new w.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    }

    function drawLetterhead(doc, logoDataUrl, title, subtitle) {
        var pageW = 612;
        var margin = 32;
        var y = 36;
        doc.setFillColor(244, 246, 250);
        doc.rect(0, 0, pageW, 792, 'F');
        if (logoDataUrl) {
            var logoH = 52;
            var logoW = logoH * (1252 / 1120);
            doc.addImage(logoDataUrl, 'PNG', pageW / 2 - logoW / 2, y, logoW, logoH);
            y += logoH + 10;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90, 98, 112);
        doc.text('UNIVERSIDAD TECNOLÓGICA DEL NORTE DE COAHUILA', pageW / 2, y, { align: 'center' });
        y += 22;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 58, 140);
        doc.text(title || 'Competencia de Robots', pageW / 2, y, { align: 'center' });
        y += 20;
        if (subtitle) {
            doc.setFontSize(11);
            doc.setTextColor(27, 140, 122);
            doc.text(subtitle, pageW / 2, y, { align: 'center' });
            y += 16;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(110, 117, 128);
        doc.text(fechaLarga(), pageW / 2, y, { align: 'center' });
        return { doc: doc, y: y + 18, margin: margin, pageW: pageW, contentW: pageW - margin * 2 };
    }

    function drawCheckTable(ctx, rows) {
        var doc = ctx.doc;
        var tableX = ctx.margin;
        var tableW = ctx.contentW;
        var y = ctx.y;
        var headH = 24;
        var rowH = 22;
        var colCheckW = 56;
        var colDescW = tableW - colCheckW;

        doc.setFillColor(238, 244, 255);
        doc.rect(tableX, y, tableW, headH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(39, 58, 92);
        doc.text('✓', tableX + colCheckW / 2, y + 16, { align: 'center' });
        doc.text('Regla / criterio', tableX + colCheckW + colDescW / 2, y + 16, { align: 'center' });
        y += headH;

        rows.forEach(function (row) {
            if (y + rowH > 720) {
                doc.addPage();
                y = 48;
            }
            doc.setDrawColor(198, 210, 228);
            doc.rect(tableX, y, tableW, rowH);
            doc.line(tableX + colCheckW, y, tableX + colCheckW, y + rowH);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(row.checked ? 22 : 160, row.checked ? 120 : 40, row.checked ? 90 : 40);
            doc.text(row.checked ? 'Sí' : 'No', tableX + colCheckW / 2, y + 15, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(30, 30, 30);
            var desc = (row.typeLabel ? row.typeLabel + ': ' : '') + (row.description || '');
            doc.text(desc, tableX + colCheckW + 6, y + 14, { maxWidth: colDescW - 12 });
            y += rowH;
        });
        ctx.y = y + 12;
    }

    function checklistVerificacion(opts) {
        opts = opts || {};
        return logoBase64().then(function (logo) {
            var doc = newDoc();
            if (!doc) {
                throw new Error('No se pudo cargar jsPDF.');
            }
            var ctx = drawLetterhead(
                doc,
                logo,
                'Verificación de robot',
                (opts.teamName || 'Equipo') + (opts.categoryName ? ' · ' + opts.categoryName : '')
            );
            if (opts.validated === false) {
                doc.setFontSize(10);
                doc.setTextColor(180, 40, 40);
                doc.text('Estado: no validado (registro en revisión)', ctx.margin, ctx.y);
                ctx.y += 16;
            } else if (opts.validated === true) {
                doc.setTextColor(22, 120, 90);
                doc.text('Estado: validado', ctx.margin, ctx.y);
                ctx.y += 16;
            }
            drawCheckTable(ctx, opts.rows || []);
            doc.save(opts.filename || 'verificacion-equipo.pdf');
        });
    }

    function partidasTabla(opts) {
        opts = opts || {};
        return logoBase64().then(function (logo) {
            var doc = newDoc();
            if (!doc) {
                throw new Error('No se pudo cargar jsPDF.');
            }
            var ctx = drawLetterhead(doc, logo, opts.title || 'Encuentros', opts.subtitle || '');
            var rows = opts.rows || [];
            var y = ctx.y;
            var margin = ctx.margin;
            var w = ctx.contentW;
            rows.forEach(function (row, idx) {
                if (y > 700) {
                    doc.addPage();
                    y = 48;
                }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(0, 58, 140);
                doc.text(String(idx + 1) + '. ' + (row.label || 'Partida'), margin, y);
                y += 14;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                doc.setTextColor(40, 40, 40);
                var lines = row.lines || [];
                lines.forEach(function (line) {
                    doc.text(line, margin + 8, y, { maxWidth: w - 16 });
                    y += 13;
                });
                if (row.winnerManual) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(22, 120, 90);
                    doc.text('Ganador (manual): ' + row.winnerManual, margin + 8, y);
                    y += 14;
                }
                y += 6;
            });
            doc.save(opts.filename || 'partidas.pdf');
        });
    }

    function campeonCategoria(opts) {
        opts = opts || {};
        return logoBase64().then(function (logo) {
            var doc = newDoc();
            if (!doc) {
                throw new Error('No se pudo cargar jsPDF.');
            }
            drawLetterhead(doc, logo, 'Ganador de categoría', opts.categoryName || '');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(0, 58, 140);
            doc.text(opts.championName || 'Por definir', 306, 280, { align: 'center' });
            doc.save(opts.filename || 'ganador-categoria.pdf');
        });
    }

    w.CRPdfEvento = {
        checklistVerificacion: checklistVerificacion,
        partidasTabla: partidasTabla,
        campeonCategoria: campeonCategoria
    };
})(window);
