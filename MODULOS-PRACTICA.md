# Práctica — 3 módulos (equipo de 3)

App: **Competencia de Robots** (Cordova). Backend: carpeta `backend/` (PHP + SQL).

**Entrega escrita:** [`DOCUMENTO-PRACTICA.md`](DOCUMENTO-PRACTICA.md) (portada, planteamiento y avance en redacción). **Videos:** aparte, según sección «Evidencia — 3 videos».

## Resumen CRUD por módulo

| Módulo | Integrante (completar nombre) | CRUD |
|--------|-------------------------------|------|
| 1 Catálogo público | _________________ | **R** (leer) |
| 2 Admin categorías/reglas | _________________ | **C, R, U, D** |
| 3 Admin equipos + registro | _________________ | **R, U** |

---

## Módulo 1 — Catálogo público

**Qué hace:** Inicio, listas de categorías/equipos, búsqueda y fichas de detalle (solo consulta).

**Rutas:** `#/`, `#/categorias`, `#/categoria/:id`, `#/equipos`, `#/equipo/:id`, `#/validados`, `#/buscar`

**Archivos:** `www/views/public/`, `www/js/catalog/`, `www/js/core/icons.js`

**Requisitos práctica:** Diseño responsivo, iconos Heroicons, textos que se ocultan/reordenan en móvil; título visible en inicio.

**CRUD:** Leer categorías, reglas y equipos desde API.

---

## Módulo 2 — Administración (categorías y reglas)

**Qué hace:** Login admin, crear/editar/eliminar categorías y reglas del reglamento.

**Rutas:** `#/admin/login`, `#/admin`, `#/admin/categorias`

**Archivos:** `www/views/admin/`, `www/js/admin/vista-categorias.js`, `www/js/admin/almacen.js`

**Login:** mock local (`admin` / `admin`). **CRUD:** categorías y reglas en **MySQL** vía API PHP.

---

## Módulo 3 — Equipos admin + registro jueces

**Qué hace:** Tabla de equipos con paginación/filtros y asignación de categoría; verificación de equipos por jueces.

**Rutas:** `#/admin/equipos`, `#/registro`, `#/validados` (consulta pass)

**Archivos:** `www/views/admin/equipos.html`, `www/views/registro/registrar.html`, `www/js/admin/vista-equipos.js`, `www/js/registro/*`

**CRUD:** Leer listado de equipos; actualizar categoría (admin); validación (POST `/registro/validar`); consultar validados (GET `/validaciones?pass=1`). En **registro** solo aparecen equipos **sin verificación** previa (`GET /registro?exclude_validated=1` excluye pass true y pass false).

---

## Backend (PHP)

Subir `backend/php/` al host, importar SQL, configurar `config.php`. Cuando tengas la URL:

```text
https://TU-DOMINIO/api/health
```

Obligatorio: `apiRemoteBase` en `www/js/config.js` apuntando al host con PHP + SQL importados (`backend/README.md`).

## Evidencia — 3 videos (uno por módulo)

En cada video: di quién eres (módulo X), muestra **móvil y escritorio** (redimensiona la ventana o graba en teléfono).

| Video | Contenido principal |
|-------|---------------------|
| 1 | Catálogo público (solo lectura) |
| 2 | Admin: categorías, reglas **y** asignar categoría a equipos |
| 3 | Registro de verificación **y** consulta de validados (sin admin) |

### Video 1 — Catálogo público (solo lectura)

| | Ruta |
|---|------|
| **Empieza** | `#/` (inicio) |
| **Termina** | Tras mostrar detalle de un equipo (`#/equipo/1` o similar) y volver |

**Recorrido sugerido (3–5 min):**

1. Inicio: tiles, hero/imagen responsive.
2. `#/categorias` → entra a una categoría (`#/categoria/1`) → reglas.
3. `#/equipos` → varios equipos cargan desde API.
4. `#/buscar` → búsqueda con resultado.
5. Abre un equipo (`#/equipo/:id`) → datos e integrantes.
6. Opcional: `#/validados` (solo consulta, sin admin).

**No incluyas** login admin ni registro en este video.

---

### Video 2 — Admin: categorías, reglas y equipos

| | Ruta |
|---|------|
| **Empieza** | `#/admin/login` |
| **Termina** | `#/admin/equipos` tras guardar la categoría de un equipo |

**Recorrido sugerido (5–7 min):**

1. Login: `admin` / `admin` → panel `#/admin`.
2. `#/admin/categorias`:
   - **Crear** categoría (o mostrar las existentes).
   - **Editar** nombre y **guardar**.
   - **Crear / editar / eliminar** una regla (o categoría de prueba).
3. `#/admin/equipos`:
   - Listado, **filtro** y **paginación** si aplica.
   - **Actualizar** categoría de un equipo → **Guardar** → mensaje OK.

**No incluyas** registro de jueces ni `#/validados` en este video.

---

### Video 3 — Registro y equipos validados

| | Ruta |
|---|------|
| **Empieza** | `#/` → **Registrar robots** (`#/registro`) |
| **Termina** | `#/validados` con el equipo que acabas de validar visible |

**Recorrido sugerido (4–6 min):**

1. `#/registro`: elegir equipo del autocompletado, revisar datos, **Verificar** checklist.
2. Completar tablas → **Siguiente** (si aplica) → **Registrar** (aprobado).
3. Opcional en el mismo flujo: **Eliminar** / descalificar otro equipo (pass no aprobado) y confirmar en modal.
4. `#/validados`: el equipo validado aparece en el listado; prueba **filtro** o búsqueda.

**No incluyas** login admin, categorías ni `#/admin/equipos` en este video.
