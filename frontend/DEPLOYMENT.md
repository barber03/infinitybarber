# Infinity Barber – Guía de Despliegue

## Estructura

```
barber/          ← Frontend (React + Vite)
barber/server/   ← Backend  (Node.js + Express + SQLite)
```

---

## Variables de Entorno

### Backend (`barber/server/.env`)
Copia `.env.example` → `.env` y ajusta los valores:

```env
PORT=3000
DATABASE_PATH=./database.sqlite
JWT_SECRET=clave-larga-y-segura
CORS_ORIGINS=https://tu-frontend.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-password
DEFAULT_BARBER_PASSWORD=1234
```

### Frontend
Si tu plataforma requiere una variable de entorno para apuntar al backend, usa:

```
VITE_API_URL=https://tu-backend.com
```

---

## Comandos

### Backend
```bash
cd barber/server
npm install
node index.js        # producción
```

### Frontend
```bash
cd barber
npm install
npm run build        # genera la carpeta dist/
```
Sirve la carpeta `dist/` con cualquier servidor web estático.

### Desarrollo local (frontend + backend juntos)
```bash
# Desde la raíz del proyecto
npm install
npm start
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

---

## Notas importantes

- El backend necesita **sistema de archivos persistente** (usa SQLite y guarda imágenes en disco).
- La carpeta `dist/` generada por el frontend es una **SPA** — configura tu servidor para redirigir todas las rutas a `index.html`.
- Nunca subas el archivo `.env` al repositorio (ya está en `.gitignore`).
