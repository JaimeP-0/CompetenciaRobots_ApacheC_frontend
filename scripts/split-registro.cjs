'use strict';
const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, '..', 'www', 'js', 'app.js');
const outPath = path.join(__dirname, '..', 'www', 'js', 'registro.js');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);
let body = lines.slice(139, 1107).join('\n');
body = body.replace(/\bcrDetalleFetchGen\b/g, 'U.getDetalleFetchGen()');
body = body.replace(/\bbumpDetalleFetchGen\(\)/g, 'U.bumpDetalleFetchGen()');
body = body.replace(/\bwithRegistroMinLoading\(/g, 'U.withRegistroMinLoading(');
body = body.replace(/\bsetRegDetalleLoading\(/g, 'U.setRegDetalleLoading(');
body = body.replace(/\bfetchChecklistFragment\(/g, 'w.CRViews.fetchChecklistFragment(');
const head = `/**
 * Flujo Registrar: autocompletado, detalle, checklists, POST validar.
 */
(function (w) {
    'use strict';

    var U = w.CRUtil;
    if (!U || !w.CRViews) {
        throw new Error('Carga core/util.js y core/views.js antes de registro.js');
    }

`;
const foot = `
    w.CRRegistro = {
        initEquipoAutocomplete: initEquipoAutocomplete,
        initFlow: initRegistrarFlow,
        fetchSugerenciasEquipo: fetchSugerenciasEquipo,
        fetchDetalleEquipoPorNombre: fetchDetalleEquipoPorNombre,
        aplicarDetalleEquipo: aplicarDetalleEquipo,
        limpiarDetalleEquipo: limpiarDetalleEquipo,
        getRegEquipoId: getRegEquipoId
    };
})(window);
`;
fs.writeFileSync(outPath, head + body + foot);
console.log('Wrote', outPath);
