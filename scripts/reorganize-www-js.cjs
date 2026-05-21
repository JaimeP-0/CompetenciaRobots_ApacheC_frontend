'use strict';
/**
 * Divide api.js, registro.js y catalog.js en módulos con namespace explícito en window.
 */
const fs = require('fs');
const path = require('path');

const JS = path.join(__dirname, '..', 'www', 'js');

function readLines(file) {
    return fs.readFileSync(path.join(JS, file), 'utf8').split(/\r?\n/);
}

function slice(lines, start, end) {
    return lines.slice(start - 1, end).join('\n');
}

function writeModule(relPath, comment, body, assign) {
    const full = path.join(JS, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const content =
        '/**\n * ' +
        comment +
        '\n */\n(function (w) {\n    \'use strict\';\n\n' +
        body +
        '\n\n' +
        assign +
        '\n})(window);\n';
    fs.writeFileSync(full, content);
    console.log('  ', relPath);
}

// --- core/dom ---
writeModule(
    'core/escape-html.js',
    'Escapar texto para insertar en HTML.',
    `    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }`,
    '    w.CRDom = { escapeHtml: escapeHtml };'
);

writeModule(
    'core/skeleton-html.js',
    'Placeholders de carga (skeleton) del catálogo.',
    `    function skeletonCards(n) {
        var i;
        var out = '';
        for (i = 0; i < n; i++) {
            out += '<div class="cr-catalog-skel h-[4.5rem] w-full rounded-2xl"></div>';
        }
        return out;
    }`,
    '    w.CRDom = w.CRDom || {};\n    w.CRDom.skeletonCards = skeletonCards;'
);

// --- api split ---
const apiLines = readLines('api.js');
const apiInner = apiLines.slice(10, 917).join('\n'); // inside IIFE after app check

// We'll build api files manually from slices with deps
const apiSlices = {
    'api/http-build-url.js': [12, 36],
    'api/categorias-cache.js': [46, 149],
    'api/equipos-registro-cache.js': [151, 318],
    'api/catalog-remoto-get.js': [320, 388],
    'api/mock-datos.js': [390, 454],
    'api/mock-handlers.js': [456, 740],
    'api/request.js': [742, 776]
};

const apiComments = {
    'api/http-build-url.js': 'URLs de la API (base + query).',
    'api/categorias-cache.js': 'GET /categorias: caché y normalización.',
    'api/equipos-registro-cache.js': 'GET /registro: equipos, búsqueda y detalle para Registrar.',
    'api/catalog-remoto-get.js': 'Catálogo en modo remoto (mapea /cr-catalog/* al listado de equipos).',
    'api/mock-datos.js': 'Datos estáticos del mock (categorías, equipos de prueba).',
    'api/mock-handlers.js': 'Respuestas mock por ruta HTTP.',
    'api/request.js': 'fetch o mock según config (useMockApi).'
};

const apiAssign = {
    'api/http-build-url.js':
        '    w.CRApiHttp = { buildUrl: buildUrl, isCategoria: isCategoria, assertCategoria: assertCategoria };',
    'api/categorias-cache.js':
        '    w.CRApiCategorias = {\n' +
        '        labelById: categoryLabelById,\n' +
        '        fetch: fetchCategorias,\n' +
        '        clearCache: function () {\n' +
        '            categoriasCache = null;\n' +
        '            categoriasById = {};\n' +
        '        }\n' +
        '    };',
    'api/equipos-registro-cache.js':
        '    w.CRApiEquiposRegistro = {\n' +
        '        fetchTeams: fetchRegistroTeams,\n' +
        '        clearCache: function () {\n' +
        '            registroTeamsCache = null;\n' +
        '        },\n' +
        '        filterByQuery: filterTeamsByQuery,\n' +
        '        findByName: findRegistroTeamByName,\n' +
        '        toDetallePanel: teamToRegistroDetalle,\n' +
        '        sugerencias: function (q) {\n' +
        '            return fetchRegistroTeams().then(function (teams) {\n' +
        '                var needle = String(q || "").trim().toLowerCase();\n' +
        '                if (!needle) return [];\n' +
        '                return teams\n' +
        '                    .filter(function (t) {\n' +
        '                        return t.name.toLowerCase().indexOf(needle) !== -1;\n' +
        '                    })\n' +
        '                    .map(function (t) { return t.name; })\n' +
        '                    .slice(0, 12);\n' +
        '            });\n' +
        '        }\n' +
        '    };',
    'api/catalog-remoto-get.js':
        '    w.CRApiCatalogRemoto = { handleGet: handleRegistroRemoteApi };',
    'api/mock-datos.js':
        '    w.CRApiMockDatos = {\n' +
        '        delay: mockDelay,\n' +
        '        labelCategoria: labelCategoria,\n' +
        '        catalogCategoryName: catalogCategoryName,\n' +
        '        catalogCaptainName: catalogCaptainName,\n' +
        '        CATALOG_CATEGORIES: CATALOG_CATEGORIES,\n' +
        '        CATALOG_RULES: CATALOG_RULES,\n' +
        '        CATALOG_TEAMS: CATALOG_TEAMS,\n' +
        '        CATALOG_MEMBERS: CATALOG_MEMBERS\n' +
        '    };',
    'api/mock-handlers.js':
        '    w.CRApiMockHandlers = { handle: mockHandle, catalog: mockCatalog };',
    'api/request.js': '    w.CRApiRequest = { request: request };'
};

for (const [rel, range] of Object.entries(apiSlices)) {
    let body = slice(apiLines, range[0], range[1]);
    if (rel === 'api/categorias-cache.js' || rel === 'api/equipos-registro-cache.js' || rel === 'api/catalog-remoto-get.js') {
        body = '    var app = w.CR_APP || w.CR_CONFIG;\n    var Http = w.CRApiHttp;\n    if (!app || !Http) {\n        throw new Error("Carga api/http-build-url.js y config.js antes");\n    }\n    var buildUrl = Http.buildUrl;\n\n' + body;
    }
    if (rel === 'api/equipos-registro-cache.js') {
        body = body.replace(/fetchCategorias\(/g, 'Cats.fetch(');
        body = body.replace(/categoryLabelById\(/g, 'Cats.labelById(');
        body =
            '    var Cats = w.CRApiCategorias;\n    if (!Cats) throw new Error("Carga api/categorias-cache.js antes");\n' +
            body;
    }
    if (rel === 'api/catalog-remoto-get.js') {
        body = body
            .replace(/fetchCategorias\(/g, 'Cats.fetch(')
            .replace(/fetchRegistroTeams\(/g, 'Equipos.fetchTeams(')
            .replace(/categoryLabelById\(/g, 'Cats.labelById(')
            .replace(/filterTeamsByQuery\(/g, 'Equipos.filterByQuery(');
        body =
            '    var Cats = w.CRApiCategorias;\n    var Equipos = w.CRApiEquiposRegistro;\n    if (!Cats || !Equipos) throw new Error("Carga api/categorias y equipos-registro antes");\n' +
            body;
    }
    if (rel === 'api/mock-handlers.js') {
        body =
            '    var app = w.CR_APP || w.CR_CONFIG;\n    var Http = w.CRApiHttp;\n    var Mock = w.CRApiMockDatos;\n    if (!app || !Http || !Mock) throw new Error("Carga mock-datos y http antes");\n    var mockDelay = Mock.delay;\n    var labelCategoria = Mock.labelCategoria;\n    var catalogCategoryName = Mock.catalogCategoryName;\n    var catalogCaptainName = Mock.catalogCaptainName;\n    var CATALOG_CATEGORIES = Mock.CATALOG_CATEGORIES;\n    var CATALOG_RULES = Mock.CATALOG_RULES;\n    var CATALOG_TEAMS = Mock.CATALOG_TEAMS;\n    var CATALOG_MEMBERS = Mock.CATALOG_MEMBERS;\n    var assertCategoria = Http.assertCategoria;\n    var isCategoria = Http.isCategoria;\n\n' +
            body;
    }
    if (rel === 'api/request.js') {
        body =
            '    var app = w.CR_APP || w.CR_CONFIG;\n    var Http = w.CRApiHttp;\n    var Remoto = w.CRApiCatalogRemoto;\n    var MockH = w.CRApiMockHandlers;\n    if (!app || !Http || !Remoto || !MockH) throw new Error("Carga módulos api/* antes de request.js");\n    var buildUrl = Http.buildUrl;\n    var handleRegistroRemoteApi = Remoto.handleGet;\n    var mockHandle = MockH.handle;\n\n' +
            body;
    }
    if (rel === 'api/http-build-url.js') {
        body = '    var app = w.CR_APP || w.CR_CONFIG;\n    if (!app || typeof app.listaCategorias !== "function") {\n        throw new Error("CR_CONFIG no definido (config.js)");\n    }\n\n' + body;
    }
    if (rel === 'api/mock-datos.js') {
        body = '    var app = w.CR_APP || w.CR_CONFIG;\n\n' + body;
    }
    writeModule(rel, apiComments[rel], body, apiAssign[rel]);
}

// api/public.js - hand written from tail
const publicApi = fs.readFileSync(path.join(__dirname, 'reorganize-api-public-snippet.js'), 'utf8');
writeModule('api/public.js', 'Fachada pública: window.CRApi (login, registro, catálogo, encuentros).', publicApi.trim(), '    /* w.CRApi definido arriba */');

// --- registro split ---
const regLines = readLines('registro.js');
const regInnerStart = 11; // after deps check

writeModule(
    'registro/equipo-datos.js',
    'Datos del equipo en pantalla Registrar (DOM + fetch detalle/sugerencias).',
    slice(regLines, 12, 136),
    `    w.CRRegistroEquipos = {
        fetchSugerencias: fetchSugerenciasEquipo,
        fetchDetallePorNombre: fetchDetalleEquipoPorNombre,
        aplicarDetalle: aplicarDetalleEquipo,
        limpiarDetalle: limpiarDetalleEquipo,
        getEquipoId: getRegEquipoId,
        sectionRoot: registroSectionRoot
    };`
);

writeModule(
    'registro/autocomplete-equipo.js',
    'Lista desplegable de nombres de equipo (#nombre-equipo).',
    '    var U = w.CRUtil;\n    var Equipos = w.CRRegistroEquipos;\n    if (!U || !Equipos) {\n        throw new Error("Carga registro/equipo-datos.js antes");\n    }\n    var fetchDetalleEquipoPorNombre = Equipos.fetchDetallePorNombre;\n    var aplicarDetalleEquipo = Equipos.aplicarDetalle;\n    var limpiarDetalleEquipo = Equipos.limpiarDetalle;\n\n' +
        slice(regLines, 138, 347).replace(/fetchSugerenciasEquipo/g, 'Equipos.fetchSugerencias'),
    '    w.CRRegistroAutocomplete = { init: initEquipoAutocomplete };'
);

writeModule(
    'registro/checklists-config.js',
    'Qué categorías tienen checklist y cómo resolver el slug del HTML.',
    slice(regLines, 349, 403),
    `    w.CRRegistroChecklists = {
        SLUGS: REG_CHECKLIST_SLUGS,
        tableCount: regChecklistTableCount,
        slugFromSection: slugCategoriaChecklist,
        checkboxPrefix: checklistPrefixFromHost,
        normalizeCategoriaText: normalizeCategoriaText
    };`
);

writeModule(
    'registro/pantalla-registrar.js',
    'Pantalla #registrar: verificar, tablas checklist, POST validar.',
    '    var U = w.CRUtil;\n    var Equipos = w.CRRegistroEquipos;\n    var Chk = w.CRRegistroChecklists;\n    if (!U || !Equipos || !Chk || !w.CRViews) {\n        throw new Error("Carga registro/* y core/views antes");\n    }\n    var REG_CHECKLIST_SLUGS = Chk.SLUGS;\n    var regChecklistTableCount = Chk.tableCount;\n    var slugCategoriaChecklist = Chk.slugFromSection;\n    var getRegEquipoId = Equipos.getEquipoId;\n    var limpiarDetalleEquipo = Equipos.limpiarDetalle;\n    var aplicarDetalleEquipo = Equipos.aplicarDetalle;\n    var fetchDetalleEquipoPorNombre = Equipos.fetchDetallePorNombre;\n\n' +
        slice(regLines, 409, 979),
    '    w.CRRegistroPantalla = { init: initRegistrarFlow };'
);

writeModule(
    'registro/registro.js',
    'Punto de entrada del flujo Registrar (reexporta submódulos).',
    `    var Equipos = w.CRRegistroEquipos;
    var Auto = w.CRRegistroAutocomplete;
    var Pantalla = w.CRRegistroPantalla;
    if (!Equipos || !Auto || !Pantalla) {
        throw new Error('Faltan scripts en registro/');
    }`,
    `    w.CRRegistro = {
        initEquipoAutocomplete: Auto.init,
        initFlow: Pantalla.init,
        fetchSugerenciasEquipo: Equipos.fetchSugerencias,
        fetchDetalleEquipoPorNombre: Equipos.fetchDetallePorNombre,
        aplicarDetalleEquipo: Equipos.aplicarDetalle,
        limpiarDetalleEquipo: Equipos.limpiarDetalle,
        getRegEquipoId: Equipos.getEquipoId
    };`
);

// --- catalog split ---
const catLines = readLines('catalog.js');
const esc = slice(catLines, 7, 22)
    .replace(/function esc/g, 'function escapeHtml')
    .replace(/\besc\(/g, 'CRDom.escapeHtml(')
    .replace(/skelCards/g, 'CRDom.skeletonCards');

function catalogView(rel, comment, start, end, exportName, method) {
    let body = slice(catLines, start, end);
    body = body.replace(/\besc\(/g, 'CRDom.escapeHtml(').replace(/skelCards\(/g, 'CRDom.skeletonCards(');
    writeModule(
        rel,
        comment,
        '    var CRDom = w.CRDom;\n    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");\n\n' + body,
        '    w.CRCatalogViews = w.CRCatalogViews || {};\n    w.CRCatalogViews.' + exportName + ' = ' + method + ';'
    );
}

catalogView('catalog/vista-categorias.js', 'Lista de categorías (#/categorias).', 24, 55, 'categorias', 'initCategorias');
catalogView('catalog/vista-categoria-detalle.js', 'Reglamento de una categoría.', 57, 108, 'categoriaDetalle', 'initCategoriaDetalle');
catalogView('catalog/vista-equipos-lista.js', 'Listado de equipos por categoría o todos.', 110, 193, 'equiposLista', 'initEquipos');
catalogView('catalog/vista-equipo-detalle.js', 'Ficha de un equipo e integrantes.', 195, 295, 'equipoDetalle', 'initEquipoDetalle');
catalogView('catalog/vista-buscar.js', 'Búsqueda de equipos.', 297, 357, 'buscar', 'initBuscar');

writeModule(
    'catalog/catalog.js',
    'Enlaza vistas del catálogo con routes.js (catalogInit).',
    `    var V = w.CRCatalogViews;
    if (!V) throw new Error('Carga catalog/vista-*.js antes');`,
    `    w.CRCatalog = {
        initCategorias: V.categorias,
        initCategoriaDetalle: V.categoriaDetalle,
        initEquipos: V.equiposLista,
        initEquipoDetalle: V.equipoDetalle,
        initBuscar: V.buscar
    };`
);

console.log('Done. Crear api/public.js snippet y actualizar index.html manualmente.');
