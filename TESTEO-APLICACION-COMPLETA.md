# Testeo completo — Competencia de Robots

Guía rápida y completa para validar la app en entorno web productivo.

## 1) Objetivo

Validar que los flujos críticos de:

- autenticación de staff/admin,
- dashboard en vivo,
- registro,
- match/brackets/ranking,
- panel admin,
- y exportación PDF

funcionan sin regresiones.

---

## 2) Entorno y precondiciones

- URL base: `https://utarena.online/`
- Navegador recomendado: Chrome/Edge actualizado.
- Ejecutar pruebas en ventana normal y una incógnita.
- Tener credenciales de prueba disponibles (staff, admin, registro).
- Si hay cambios recientes, hacer recarga forzada (`Ctrl+F5`) antes de iniciar.

---

## 3) Smoke test (5-10 min)

Checklist mínimo de salud general:

- [ ] Carga `#/inicio` sin errores visuales ni consola crítica.
- [ ] `#/login` permite iniciar sesión y redirige correctamente.
- [ ] `#/dashboard` muestra datos en vivo y refresco funcional.
- [ ] `#/match/internos` y `#/match/externos` cargan encuentros.
- [ ] `#/ranking` lista resultados por categoría.
- [ ] `#/registro` abre y permite flujo de registro (rol autorizado).
- [ ] `#/admin/login` y `#/admin` cargan panel y catálogos.
- [ ] Endpoint de PDF credenciales descarga el archivo sin error.

---

## 4) Matriz de rutas a validar

Rutas públicas y staff:

- [ ] `#/inicio`
- [ ] `#/login`
- [ ] `#/dashboard` (alias `#/visitante`)
- [ ] `#/categorias`
- [ ] `#/equipos`
- [ ] `#/validados`
- [ ] `#/match/internos`
- [ ] `#/match/externos`
- [ ] `#/ranking`
- [ ] `#/registro`

Rutas de administración:

- [ ] `#/admin/login`
- [ ] `#/admin`
- [ ] `#/admin/categorias`
- [ ] `#/admin/equipos`

PDF credenciales:

- [ ] `#/cr-doc-credenciales-1xuso-9k2m`
- [ ] `#/pruebapdf` (respaldo)

---

## 5) Pruebas por módulo

## 5.1 Login staff

- [ ] Usuario/contraseña correctos -> acceso permitido.
- [ ] Usuario/contraseña inválidos -> mensaje de error claro.
- [ ] Logout limpia sesión y regresa a login.
- [ ] No hay redirecciones inesperadas por rol.

## 5.2 Dashboard (`#/dashboard`)

- [ ] Muestra “Ahora en pista”, “Próximos”, “Últimos resultados”.
- [ ] Filtro por categoría funciona.
- [ ] Botón actualizar refresca datos y timestamp.
- [ ] Label de sesión staff se muestra correctamente.
- [ ] No aparece “cat. X” si ya se espera nombre de categoría.

## 5.3 Match / Brackets

- [ ] Carga en internos y externos.
- [ ] Al cambiar scope no rompe navegación.
- [ ] Botones de iniciar/finalizar resultado funcionan.
- [ ] Brackets se actualiza con los cambios.

## 5.4 Ranking

- [ ] Lista por categoría en orden correcto.
- [ ] Manejo de datos vacíos sin romper UI.
- [ ] Sin errores de formato de tiempo/resultados.

## 5.5 Registro (`#/registro`)

- [ ] Solo rol permitido accede.
- [ ] Formulario valida campos obligatorios.
- [ ] Registro exitoso muestra feedback correcto.
- [ ] Bloqueos por rol no permitido redirigen correctamente.

## 5.6 Admin

- [ ] Login admin correcto.
- [ ] Categorías: crear/editar/listar (si aplica).
- [ ] Equipos: listar/editar/operaciones (si aplica).
- [ ] Logout admin correcto.

## 5.7 PDF credenciales

- [ ] Abrir endpoint dispara generación automática.
- [ ] Nombre de archivo: `credenciales-jueces-arbitros.pdf`.
- [ ] PDF incluye tabla con columnas:
  - `Jueces / Árbitros`
  - `Usuario`
  - `Contraseña`
- [ ] Incluye fila de `teamregistro`.
- [ ] Logo, encabezado y footer institucional correctos.
- [ ] Paginación correcta si crece el listado.

---

## 6) Pruebas por rol (control de acceso)

- [ ] Visitante: solo rutas públicas.
- [ ] Juez/Árbitro: acceso a flujo staff permitido.
- [ ] Registro: acceso a `#/registro`, sin acceso indebido.
- [ ] Admin: acceso total a rutas admin.

---

## 7) Consola y red (obligatorio)

En DevTools:

- [ ] Sin errores JS bloqueantes.
- [ ] Sin 404 de recursos críticos (`js`, `css`, `views`).
- [ ] Endpoints API responden con 2xx esperado.
- [ ] Sin bloqueos CSP para scripts necesarios.

---

## 8) Criterios de aprobación

Liberación OK si:

- [ ] Smoke test completo en verde.
- [ ] Módulos críticos (`login`, `dashboard`, `match`, `registro`, `admin`, `pdf`) en verde.
- [ ] Sin errores bloqueantes en consola/red.
- [ ] Sin regresiones visuales críticas.

---

## 9) Evidencia mínima sugerida

- Capturas de:
  - login staff,
  - dashboard actualizado,
  - match/brackets,
  - ranking,
  - registro exitoso,
  - panel admin,
  - PDF generado.
- Fecha/hora de ejecución.
- Navegador usado.

---

## 10) Registro de ejecución (plantilla)

Fecha:

Entorno:

Tester:

Resultado general: `APROBADO / RECHAZADO`

Incidencias:

1.
2.
3.

