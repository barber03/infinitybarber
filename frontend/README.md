# Infinity Barber

Sistema full-stack para operar una barberia con enfoque mas profesional.

## Mejoras incluidas

- Login real con JWT para administrador y barberos.
- Contraseñas cifradas con `bcryptjs`.
- Rutas protegidas por rol.
- Disponibilidad publica sin exponer toda la agenda.
- Reservas con `payment_reference` y estado `pending_review`.
- Panel admin para validar pago, confirmar citas y gestionar servicios, barberos y galeria.
- Panel de barbero con acceso solo a sus citas.
- Variables de entorno para frontend y backend.
- Script de respaldo local de SQLite.

## Variables de entorno

Frontend:

```powershell
Copy-Item .env.example .env
```

Backend:

```powershell
Copy-Item server\\.env.example server\\.env
```

Produccion recomendada:

- `VITE_API_URL=https://tu-backend.onrender.com`
- `CORS_ORIGINS=https://tu-frontend.onrender.com`
- `DATABASE_PATH=/opt/render/project-data/database.sqlite`
- cambia `JWT_SECRET`, `ADMIN_USERNAME` y `ADMIN_PASSWORD`

## Desarrollo

```powershell
npm.cmd install
npm.cmd run dev
```

## Build

```powershell
npm.cmd run build
```

## Backup

```powershell
cd server
npm.cmd run backup
```

## Deploy en Render

El repo ya incluye [render.yaml](c:/Users/USUARIO/Downloads/barber2/barber2/barber2/render.yaml).

Pasos:

1. Sube este repo a GitHub.
2. En Render, crea un `Blueprint` desde el repo.
3. Cuando te pida variables, define:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `DEFAULT_BARBER_PASSWORD`
   - `CORS_ORIGINS`
   - `VITE_API_URL`
4. Usa la URL publica del backend en `VITE_API_URL`.
5. Usa la URL publica del frontend en `CORS_ORIGINS`.
