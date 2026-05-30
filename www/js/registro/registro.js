/**
 * Punto de entrada del flujo Registrar (reexporta submódulos).
 */
(function (w) {
    'use strict';

    var Equipos = w.CRRegistroEquipos;
    var Auto = w.CRRegistroAutocomplete;
    var Pantalla = w.CRRegistroPantalla;
    var Categoria = w.CRRegistroCategoria;
    if (!Equipos || !Auto || !Pantalla || !Categoria) {
        throw new Error('Faltan scripts en registro/');
    }

    w.CRRegistro = {
        initEquipoAutocomplete: Auto.init,
        initCategoriaRegistro: Categoria.init,
        initFlow: Pantalla.init,
        fetchSugerenciasEquipo: Equipos.fetchSugerencias,
        fetchDetalleEquipoPorNombre: Equipos.fetchDetallePorNombre,
        aplicarDetalleEquipo: Equipos.aplicarDetalle,
        limpiarDetalleEquipo: Equipos.limpiarDetalle,
        getRegEquipoId: Equipos.getEquipoId
    };
})(window);
