# Desarrollo local (opcional)

**Producción en el VPS:** ver [DESPLIEGUE-VPS.md](DESPLIEGUE-VPS.md) (por defecto el proyecto usa perfil `vps`).

Para probar en tu PC con el API en **http://127.0.0.1:8080** (repo [Willyzsz/robot](https://github.com/Willyzsz/robot)):

## Requisitos

- Node.js y `npm install` en este proyecto
- Tras clonar: `npm run prepare:all` (genera `www/css/app.css`, iconos en `www/vendor/`, Cordova browser)
- Docker Desktop (PostgreSQL del backend)
- Go 1.21+
- Repo `robot` clonado al lado de este proyecto:

```text
Desktop/
  Competencia de Robots/   ← este repo
  robot/                  ← git clone https://github.com/Willyzsz/robot.git
```

O define `CR_ROBOT_DIR` en `.env` (copia desde `.env.example`).

## Opción A — Todo en dos terminales

**Terminal 1 — API + base de datos:**

```powershell
npm run local:api
```

**Terminal 2 — App en el navegador (proxy → :8080):**

```powershell
npm run local
```

Abre **http://localhost:8000**. Las rutas `/categorias`, `/partidas`, etc. se reenvían al Go en el puerto 8080.

## Opción B — Una sola terminal (API + navegador)

```powershell
npm run local:stack
```

## CSS en vivo + navegador

```powershell
npm run local:dev
```

## Probar en Android

1. Backend corriendo (`npm run local:api`).
2. **Emulador:** ya apunta a `http://10.0.2.2:8080` (perfil `local`).
3. **Celular físico:** en `www/js/config.local.js` pon tu IP LAN:

```javascript
apiLocalLan: 'http://192.168.1.42:8080'
```

4. `npm run build:android` e instala el APK (misma red Wi‑Fi que el PC).

## Servidor remoto (Tailscale / producción)

En `www/js/config.local.js`:

```javascript
w.CR_API_OVERRIDES = { apiProfile: 'remote' };
```

O en `.env`: `CR_API_PROFILE=remote` y `CR_API_TARGET=http://100.119.194.73:8080` para los scripts Node.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run local` | Navegador + proxy al API local |
| `npm run local:api` | Docker Postgres + `go run ./cmd/server` |
| `npm run local:stack` | API y navegador a la vez |
| `npm run browser` | Igual que antes; usa `.env` o 127.0.0.1:8080 por defecto |

Comprueba el API: http://127.0.0.1:8080/categorias
