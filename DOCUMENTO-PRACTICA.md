# DOCUMENTO DE PRÁCTICA

Completa los campos entre corchetes y exporta a PDF o Word (mínimo **3 hojas** sin contar la portada). Los **videos** se entregan aparte; aquí va solo la redacción del trabajo.

---

## PORTADA

**Institución:** [Universidad / escuela]  
**Materia:** [Nombre de la materia]  
**Nombre de la práctica:** Desarrollo de aplicación móvil modular — Competencia de Robots  
**Equipo:** 3 integrantes  
**Fecha de entrega:** [DD / MM / AAAA]

**Integrantes**

1. [Nombre Apellido] — Módulo: Catálogo público  
2. [Nombre Apellido] — Módulo: Administración  
3. [Nombre Apellido] — Módulo: Registro y equipos validados  

**Proyecto:** Competencia de Robots  
**Tipo de app:** Aplicación móvil (también usable en navegador), con información guardada en servidor.

---

## 1. PLANTEAMIENTO DE LA APLICACIÓN

### 1.1 Objetivo

La aplicación sirve para una competencia de robots organizada en la universidad. Antes, la información del evento (categorías, reglamento, equipos inscritos y resultados de verificación) podía repartirse en hojas o mensajes; con la app todo queda centralizado y accesible desde el celular.

El público puede ver categorías, reglamento y equipos; el administrador da de alta categorías y reglas y asigna en qué categoría compite cada equipo; los jueces revisan cada robot con listas de verificación y dejan constancia de si fue aprobado o descalificado. Así se cubre el ciclo completo: consulta, configuración del evento y verificación el día de la competencia.

### 1.2 División por integrante

Cada alumno entregó **un módulo**. La prueba en pantalla (celular y computadora) va en **un video por persona**, por separado de este documento.

**[Nombre 1] — Catálogo público**

Incluye la pantalla de inicio, el listado de categorías, las reglas de cada categoría, todos los equipos, la búsqueda, la ficha de cada equipo y la consulta de equipos ya validados. Es solo lectura: desde aquí no se modifican datos.

**[Nombre 2] — Administración**

Incluye el acceso con usuario y contraseña, el panel de administración, crear y editar categorías y reglas, y asignar la categoría de competencia a cada equipo, con búsqueda y páginas en el listado.

**[Nombre 3] — Registro y equipos validados**

Incluye la pantalla de registro para jueces (elegir equipo, datos, checklist según la categoría, aprobar o descalificar) y la pantalla donde el público ve los equipos que ya fueron validados, con búsqueda y filtro.

En operaciones de base de datos: el módulo 1 solo **consulta**; el 2 **crea, lee, actualiza y elimina** categorías y reglas, y **actualiza** la categoría de los equipos; el 3 **consulta** pendientes, **registra** la verificación y **consulta** los validados.

### 1.3 Arquitectura resumida

La app se divide en tres capas: lo que ve el usuario en el celular o navegador, el servidor que atiende las peticiones y la base de datos donde se guarda todo.

| Capa | Qué es (implementación actual) |
|------|--------------------------------|
| Cliente (app) | Pantallas y lógica en el dispositivo: HTML, estilos y JavaScript con Cordova. |
| Servidor | API en PHP que recibe peticiones y responde con JSON. |
| Datos | Base MySQL con equipos, categorías, reglas y verificaciones. |

**Nota:** El backend descrito arriba es el de la entrega de esta práctica. Está **sujeto a cambios**: se prevé migrar el servidor a **Go** y la base de datos a **PostgreSQL**, manteniendo la misma idea de API y los mismos datos para la app.

Los tres módulos comparten el mismo cliente y el mismo servidor; cada módulo usa distintas pantallas y distintas operaciones sobre esos datos. Aunque cada integrante desarrolló su parte por separado, las tres zonas están enlazadas: lo que el administrador configura se refleja en el catálogo, y lo que el juez registra aparece después en equipos validados.

### 1.4 Videos de evidencia (entrega aparte)

- **Video 1** ([Nombre 1]): recorrido del catálogo en celular y en pantalla grande (inicio, categorías, equipos, búsqueda, detalle de un equipo).
- **Video 2** ([Nombre 2]): login de administrador, categorías y reglas, y asignación de categoría a un equipo.
- **Video 3** ([Nombre 3]): registro de un robot con checklist y comprobación en equipos validados.

---

## 2. AVANCE DE LA APLICACIÓN

Aquí se describe qué se construyó en cada módulo. El uso real de la interfaz se ve en los tres videos.

### 2.1 Módulo 1 — Catálogo público

**Integrante:** [Nombre 1]

Es la parte para cualquier usuario. Desde el inicio se entra a categorías, equipos, búsqueda, el enlace al registro de robots y la lista de validados, sin poder editar nada.

Incluye: menú de inicio con iconos; lista de categorías; reglamento por categoría; todos los equipos; ficha con escuela, capitán, asesor e integrantes; búsqueda por nombre o escuela; y equipos validados en solo consulta.

Un usuario típico entra por el inicio, revisa en qué consiste cada categoría leyendo las reglas, busca un equipo por nombre o recorre el listado completo, y abre la ficha para ver quiénes lo integran. La sección de validados permite saber qué equipos ya pasaron la verificación oficial sin entrar al área de jueces. Toda la información se carga desde el servidor, por lo que si el administrador cambia una categoría o el juez valida un equipo, el catálogo muestra los datos actualizados al volver a entrar.

El **video 1** muestra todo ese recorrido en móvil y escritorio, sin administración ni registro de juez.

### 2.2 Módulo 2 — Administración

**Integrante:** [Nombre 2]

Zona con acceso restringido. El administrador entra con usuario y contraseña, ve un panel con resumen de equipos y categorías, y desde ahí gestiona categorías y reglas (alta, edición y baja) o va al listado de equipos para cambiar la categoría de cada uno, filtrar y guardar los cambios.

En categorías y reglas se puede crear una modalidad nueva (por ejemplo minisumo o fútbol), corregir el nombre que ve el público y añadir o quitar puntos del reglamento. En equipos, el listado permite buscar por nombre o filtrar por categoría y asignar en qué competencia participará cada robot antes de que los jueces hagan la verificación física. Al guardar, la app confirma que el cambio quedó registrado en el servidor.

El **video 2** muestra el login, los cambios en categorías y reglas, y el guardado de la categoría de un equipo.

### 2.3 Módulo 3 — Registro y equipos validados

**Integrante:** [Nombre 3]

Pensado para jueces. La pantalla de registro no aparece en el menú principal como un acceso visible para todos; se usa en el evento para no mezclar consulta pública con la verificación. El flujo es: escribir o elegir el nombre del equipo, revisar escuela y categoría en una tabla de solo lectura, pulsar **Verificar** y marcar cada criterio del checklist (primera tabla, y segunda si la categoría lo requiere). Cuando todo está marcado, se habilita **Registrar** para dejar constancia de aprobación. También existe **Eliminar** para descalificar, con confirmación en un cuadro de la app.

Solo aparecen en el buscador los equipos que aún no tienen verificación registrada, para evitar validar dos veces el mismo robot por error. Tras aprobar o descalificar, el equipo deja de listarse en registro y, si fue aprobado, puede verse en **equipos validados** con fecha y categoría.

En **equipos validados** cualquiera puede consultar el listado, buscar por nombre o escuela y filtrar por categoría, sin poder modificar nada.

El **video 3** muestra el registro completo y la comprobación en validados. No repite la parte de administración (eso va en el video 2).

### 2.4 Responsividad en la práctica

En celular el menú de inicio va en columna, con tarjetas anchas y fáciles de pulsar; en pantalla ancha el mismo menú aprovecha el espacio y pueden verse textos extra bajo cada opción. El botón de volver atrás queda accesible en la esquina para no perderse al navegar entre secciones.

El logo se reduce en el teléfono y crece un poco en tablet o PC, siempre centrado en la parte superior. Las fichas de equipo y las tarjetas de validados ajustan el texto para que nombres largos no rompan el diseño.

En el checklist del registro la lista hace scroll dentro de su zona mientras los botones **Siguiente**, **Registrar** y **Eliminar** permanecen visibles abajo, útil cuando hay muchos criterios. Las reglas muy largas (por ejemplo en minisumo) se leen desplazando la tabla en horizontal en pantallas estrechas, sin que el recuadro de cumplimiento quede desalineado.

En administración, los filtros de búsqueda y categoría, junto con el botón de aplicar, se adaptan al ancho; en móvil pueden ocupar más de una línea sin tapar el listado de equipos. Las pantallas de login y panel mantienen lectura clara del título y los accesos principales.

### 2.5 Datos en línea y coherencia entre módulos

Los datos de equipos, categorías, reglas y verificaciones viven en el servidor (hoy PHP y MySQL). Por eso la app muestra la misma información en cualquier dispositivo conectado: si en administración se asigna una categoría, el juez la ve al verificar; si el juez aprueba un equipo, el público lo encuentra en validados. Esa coherencia entre los tres módulos fue un objetivo del equipo, aunque cada quien grabó y documentó su parte por separado.

---

## Anexo — Antes de entregar

- Documento: nombres en portada, planteamiento y avance listos, mínimo 3 hojas sin portada.
- Video 1: catálogo, móvil y escritorio.
- Video 2: admin, categorías, reglas y equipos.
- Video 3: registro y validados.

---

*Competencia de Robots — completar nombres y fecha en la portada.*
