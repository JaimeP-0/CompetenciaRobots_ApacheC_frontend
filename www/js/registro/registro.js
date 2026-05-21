/**
 * Punto de entrada del flujo Registrar (reexporta submódulos).
 */
(function (w) {
    'use strict';

    var Equipos = w.CRRegistroEquipos;
    var Auto = w.CRRegistroAutocomplete;
    var Pantalla = w.CRRegistroPantalla;
    if (!Equipos || !Auto || !Pantalla) {
        throw new Error('Faltan scripts en registro/');
    }

    w.CRRegistro = {
        initEquipoAutocomplete: Auto.init,
        initFlow: Pantalla.init,
        fetchSugerenciasEquipo: Equipos.fetchSugerencias,
        fetchDetalleEquipoPorNombre: Equipos.fetchDetallePorNombre,
        aplicarDetalleEquipo: Equipos.aplicarDetalle,
        limpiarDetalleEquipo: Equipos.limpiarDetalle,
        getRegEquipoId: Equipos.getEquipoId
    };
})(window);
