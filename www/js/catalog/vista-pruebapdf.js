/**
 * Vista #/pruebapdf — prueba simple para generar PDF con 3 campos.
 */
(function (w) {
    'use strict';

    function initPruebaPdf(outlet) {
        var root = (outlet && outlet.querySelector('#cr-pruebapdf-root')) || outlet;
        if (!root) {
            return;
        }

        var form = root.querySelector('#cr-pruebapdf-form');
        var c1 = root.querySelector('#cr-pdf-campo-1');
        var c2 = root.querySelector('#cr-pdf-campo-2');
        var c3 = root.querySelector('#cr-pdf-campo-3');
        var msg = root.querySelector('#cr-pruebapdf-msg');
        if (!form || !c1 || !c2 || !c3 || !msg) {
            return;
        }

        form.addEventListener(
            'submit',
            function (ev) {
                ev.preventDefault();

                if (!w.jspdf || typeof w.jspdf.jsPDF !== 'function') {
                    msg.textContent = 'No se pudo cargar la librería para PDF.';
                    return;
                }

                var jsPDF = w.jspdf.jsPDF;
                var doc = new jsPDF({ unit: 'pt', format: 'letter' });
                var y = 56;
                var line = 22;
                var mLeft = 48;
                var maxWidth = 510;
                var now = new Date();
                var pad = function (n) {
                    return n < 10 ? '0' + n : String(n);
                };
                var fecha =
                    now.getFullYear() +
                    '-' +
                    pad(now.getMonth() + 1) +
                    '-' +
                    pad(now.getDate()) +
                    ' ' +
                    pad(now.getHours()) +
                    ':' +
                    pad(now.getMinutes());

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.text('PDF de prueba - Competencia de Robots', mLeft, y);
                y += line + 4;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Fecha: ' + fecha, mLeft, y);
                y += line + 8;

                doc.setFont('helvetica', 'bold');
                doc.text('Campo 1:', mLeft, y);
                doc.setFont('helvetica', 'normal');
                doc.text(String(c1.value || '-'), mLeft + 62, y, { maxWidth: maxWidth - 62 });
                y += line;

                doc.setFont('helvetica', 'bold');
                doc.text('Campo 2:', mLeft, y);
                doc.setFont('helvetica', 'normal');
                doc.text(String(c2.value || '-'), mLeft + 62, y, { maxWidth: maxWidth - 62 });
                y += line;

                doc.setFont('helvetica', 'bold');
                doc.text('Campo 3:', mLeft, y);
                y += 16;
                doc.setFont('helvetica', 'normal');
                var text3 = String(c3.value || '-');
                var lines = doc.splitTextToSize(text3, maxWidth);
                doc.text(lines, mLeft, y);

                doc.save('prueba.pdf');
                msg.textContent = 'PDF generado y descargado como prueba.pdf';
            },
            false
        );
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.pruebaPdf = initPruebaPdf;
})(window);
