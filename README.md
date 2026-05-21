# CompetenciaRobots — Frontend (Apache Cordova)

App móvil **Competencia de Robots** (UTNC): catálogo público, registro de jueces y panel de administración.

## Stack

- Apache Cordova (browser + Android)
- HTML / JavaScript modular en `www/`
- Tailwind CSS (`www/css/src/input.css` → `npm run build:css`)
- API remota PHP/MySQL (configurar en `www/js/config.js` → `apiRemoteBase`)

## Desarrollo

```bash
npm install
npm run browser          # navegador + proxy API opcional
npm run build:android    # APK debug
```

Documentación de módulos del equipo: `MODULOS-PRACTICA.md`.

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `www/` | Código fuente de la app |
| `scripts/` | Servidor dev, proxy, utilidades |
| `res/` | Recursos nativos (browser run con proxy) |
| `hooks/` | Hooks Cordova |

El backend PHP no está en este repositorio.

## Licencia

Apache License 2.0 (base Cordova).
