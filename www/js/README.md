# JavaScript de la app (`www/js`)

Sin bundler: cada archivo se carga con `<script>` en `index.html`. Los nombres en `window` son explícitos (no hay imports).

## Mapa rápido

| Carpeta / archivo | Responsabilidad |
|-------------------|-----------------|
| `config.js` | API base, mock, rutas del backend |
| `routes.js` | **Hash → vista HTML** (`#/categorias`, `#/equipo/3`, …) |
| `app.js` | Arranque, `#cr-outlet`, `hashchange` |
| `core/` | Utilidades compartidas (loading, vistas, router) |
| `api/` | HTTP, caché de equipos/categorías, mock, `window.CRApi` |
| `catalog/` | Pantallas de consulta (listas, búsqueda) |
| `registro/` | Pantalla **Registrar** (autocomplete, checklists, POST) |
| `admin/` | Login y panel (`#/admin/login`, `#/admin`, …) |
| `views/` | HTML por carpeta: `public/`, `registro/`, `admin/`, `checklists/` (ver `views/README.md`) |

## Añadir una ruta

1. `routes.js` → `static`, `patterns` o `redirects`
2. `www/views/{nombre}.html`
3. Si es catálogo: `catalog/vista-*.js` + entrada en `catalogInit` de `routes.js`

## Añadir un endpoint

1. `config.js` → path si hace falta
2. `api/request.js` solo si cambia la lógica global de peticiones
3. `api/public.js` → método nuevo en `window.CRApi`
4. Implementación en `equipos-registro-cache.js`, `categorias-cache.js` o `mock-handlers.js`

## Iconos (Heroicons)

- Paquete: `heroicons` en **`node_modules/heroicons`** (devDependency en `package.json`).
- La app no lee `node_modules` en runtime; **`npm run icons:sync`** copia `24/outline` → `www/vendor/heroicons/24/outline/`.
- `core/icons.js` (`window.CRIcons`) inserta `<img src="vendor/heroicons/24/outline/{nombre}.svg">` en elementos con `data-cr-icon="nombre"`.
- Tras instalar dependencias o añadir iconos nuevos: `npm run icons:sync` (o `npm run prepare:all`).

## Orden de carga (`index.html`)

Ver la lista al final de `www/index.html`. Regla: **config → routes → api/* → catalog/* → core → registro/* → app**.

## Administración

| Ruta | Vista |
|------|--------|
| `#/admin/login` | `views/admin/login.html` |
| `#/admin` | `views/admin/panel.html` |
| `#/admin/categorias` | `views/admin/categorias.html` |
| `#/admin/equipos` | `views/admin/equipos.html` — paginación en `config.js` (`adminEquiposPaginacion`) |

- Login **temporal mock** (`adminLoginMock: true`): usuario `admin` / contraseña `admin`.
- **Datos editables** (`adminDatosLocales: true`): categorías, reglas y categoría por equipo en `localStorage` vía `admin/almacen.js`. Rutas `#/admin/categorias` y `#/admin/equipos`.
- **Paginación admin equipos**: `adminEquiposPaginacion: 'cliente'` (default) = un `GET /registro` y páginas en el front. `'servidor'` = cada página pide `?page=&limit=` (y filtros `q`, `category_id` si el backend los soporta).
- Archivos: `admin/sesion.js`, `admin/vista-login.js`, `admin/vista-panel.js`, `admin/admin.js`.

## Registrar (jueces)

No se incluyen en `index.html`. Al abrir `#/registro`, `registro/cargar.js` inserta los scripts y luego monta la vista.

| Archivo | Qué hace |
|---------|----------|
| `registro/cargar.js` | Carga bajo demanda el resto de `registro/` |
| `registro/equipo-datos.js` | Panel escuela/capitán/id; sugerencias y detalle |
| `registro/autocomplete-equipo.js` | Dropdown `#nombre-equipo` |
| `registro/checklists-config.js` | Slugs minisumo / fútbol / velocista |
| `registro/pantalla-registrar.js` | Verificar → tablas → Registrar |
| `registro/registro.js` | `window.CRRegistro` (usa los anteriores) |
