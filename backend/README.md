# Backend — Competencia de Robots (PHP + MySQL)

La app está configurada para usar **base de datos** (`adminDatosLocales: false` en `www/js/config.js`). Admin, catálogo y registro leen/escriben vía este API.

## Estructura

```
backend/
  sql/schema.sql    → tablas
  sql/seed.sql      → datos de ejemplo
  php/
    config.example.php  → copiar a config.php
    index.php           → entrada API
    lib/                → Database, Response
    .htaccess           → reescritura (Apache)
```

## Instalación en el host

1. Crea una base MySQL/MariaDB (ej. `competencia_robots`).
2. Importa `sql/schema.sql` y luego `sql/seed.sql` (phpMyAdmin o consola).
3. Copia la carpeta `php/` a tu servidor, por ejemplo:
   - `https://tudominio.com/api/` → sube el contenido de `php/` ahí.
4. Renombra `config.example.php` → `config.php` y pon host, usuario y contraseña de MySQL.
5. Prueba: `GET https://tudominio.com/api/health` debe responder `{"ok":true,...}`.

### Contraseña admin

- Por defecto en seed: usuario `admin` (el hash en seed es de ejemplo).
- Mientras `demo_login.enabled` sea `true` en `config.php`, también acepta **admin / admin**.
- En producción: genera un hash con PHP y actualiza `admin_users`:

```php
echo password_hash('tu_clave_segura', PASSWORD_DEFAULT);
```

## Endpoints (contrato con la app)

| Método | Ruta | Uso en la app |
|--------|------|----------------|
| GET | `/health` | Comprobar que el API responde |
| POST | `/login` | Admin login |
| GET | `/categorias` | Lista categorías + reglas |
| POST | `/categorias` | Crear categoría (admin remoto, futuro) |
| PUT/PATCH | `/categorias/{id}` | Editar nombre |
| DELETE | `/categorias/{id}` | Borrar categoría |
| POST | `/categorias/{id}/reglas` | Nueva regla |
| PUT/PATCH | `/categorias/{id}/reglas/{rid}` | Editar regla |
| DELETE | `/categorias/{id}/reglas/{rid}` | Borrar regla |
| GET | `/registro` | Equipos (+ `?page=&limit=&q=&category_id=` paginación servidor) |
| PATCH | `/registro/{id}` | Asignar `category_id` al equipo |
| POST | `/registro/validar` | Verificación jueces (`team_id`, `pass`) |

## Conectar la app

1. Edita `www/js/config.js` → `apiRemoteBase: 'https://TU-DOMINIO.com/api'` (sin barra final).
2. En el APK / teléfono: `forceDirectApi: true` (o compila después de poner la URL correcta).
3. Login admin en la app: **admin / admin** (mock en el teléfono; no llama al PHP). El CRUD sí usa MySQL.

### Probar en PC antes del video

Terminal 1 (PHP + MySQL con `config.php` y SQL importados):

```powershell
.\scripts\run-php-api.ps1
```

Terminal 2:

```powershell
$env:CR_API_TARGET='http://127.0.0.1:8080'
npm run browser
```

Abre categorías en la app: deben salir de MySQL. Si cambias una categoría en admin, recarga el catálogo y debe verse el cambio (ya no es `localStorage`).

## Módulos del equipo (referencia)

Ver `MODULOS-PRACTICA.md` en la raíz del proyecto.
