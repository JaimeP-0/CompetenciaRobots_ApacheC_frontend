# Práctica — 3 módulos (equipo de 3)

App: **Competencia de Robots** (Cordova). Backend: carpeta `backend/` (PHP + SQL).

## Resumen CRUD por módulo

| Módulo | Integrante (completar nombre) | CRUD |
|--------|-------------------------------|------|
| 1 Catálogo público | _________________ | **R** (leer) |
| 2 Admin categorías/reglas | _________________ | **C, R, U, D** |
| 3 Admin equipos + registro | _________________ | **R, U** |

---

## Módulo 1 — Catálogo público

**Qué hace:** Inicio, listas de categorías/equipos, búsqueda y fichas de detalle (solo consulta).

**Rutas:** `#/`, `#/categorias`, `#/categoria/:id`, `#/equipos`, `#/equipo/:id`, `#/buscar`

**Archivos:** `www/views/public/`, `www/js/catalog/`, `www/js/core/icons.js`

**Requisitos práctica:** Diseño responsivo, iconos Heroicons, textos que se ocultan/reordenan en móvil; **imágenes responsivas** (`picture` + hero en inicio).

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

**Rutas:** `#/admin/equipos`, `#/registro`

**Archivos:** `www/views/admin/equipos.html`, `www/views/registro/registrar.html`, `www/js/admin/vista-equipos.js`, `www/js/registro/*`

**CRUD:** Leer listado de equipos; actualizar categoría (admin) y validación (POST `/registro/validar`).

---

## Backend (PHP)

Subir `backend/php/` al host, importar SQL, configurar `config.php`. Cuando tengas la URL:

```text
https://TU-DOMINIO/api/health
```

Obligatorio: `apiRemoteBase` en `www/js/config.js` apuntando al host con PHP + SQL importados (`backend/README.md`).

## Evidencia

Grabar video de: inicio → categorías → admin CRUD → equipos → registro validar; redimensionar ventana para mostrar responsive.
