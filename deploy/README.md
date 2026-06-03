# Despliegue (VPS)

```
deploy/
├── nginx/          # Sitio nginx del front
├── systemd/        # Unidad robot-api
├── robot/          # Parches Go (npm run deploy:robot)
└── vps/            # Scripts e SQL del servidor — ver vps/README.md
```

Flujo habitual: `npm run deploy:vps` (build + git pull en el VPS).

Credenciales del evento: `deploy/vps/credenciales-evento.private.md` (no versionar).
