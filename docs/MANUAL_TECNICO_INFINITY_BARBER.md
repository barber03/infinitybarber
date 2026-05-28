# Manual Tecnico Infinity Barber

## 1. Portada

**Nombre del proyecto:** Infinity Barber  
**Tipo de documento:** Manual tecnico  
**Tipo de sistema:** Aplicacion web full-stack para gestion de barberia  
**Institucion:** SENA  
**Programa de formacion:** [ADSO - ANALISIS Y DESARROLLO DE SOFTWARE]  
**Aprendiz:** [Jesus David Figueroa Alvarez]  
**Instructor(a):** [Karina Meza]  
**Fecha:** [21/04/2026]  

---

## 2. Introduccion

El presente manual tecnico describe la estructura, configuracion, instalacion, ejecucion y mantenimiento del sistema Infinity Barber. Esta guia esta dirigida a desarrolladores, administradores tecnicos o personal encargado de instalar, revisar, modificar o desplegar la aplicacion.

Infinity Barber es una aplicacion web full-stack construida con React, TypeScript, Node.js, Express y SQLite. El sistema permite gestionar servicios, barberos, reservas, galeria de imagenes, autenticacion por roles, carga de comprobantes de pago, asistente virtual con IA y analizador facial para recomendacion de estilos.

---

## 3. Objetivo del Manual

Documentar los aspectos tecnicos necesarios para instalar, ejecutar, mantener y comprender el funcionamiento interno de Infinity Barber.

### 3.1 Objetivos especificos

- Describir la arquitectura general del sistema.
- Explicar la estructura de carpetas y archivos principales.
- Indicar los requisitos tecnicos de instalacion.
- Documentar la configuracion de variables de entorno.
- Explicar la ejecucion local.
- Describir la base de datos y sus tablas principales.
- Documentar las rutas principales de la API REST.
- Explicar los mecanismos de seguridad implementados.
- Orientar tareas de mantenimiento, respaldo y solucion de errores.

---

## 4. Descripcion General del Sistema

Infinity Barber esta compuesto por:

- **Frontend:** aplicacion web desarrollada con React, TypeScript, Vite y Tailwind CSS.
- **Backend:** servidor API REST desarrollado con Node.js y Express.
- **Base de datos:** SQLite para persistencia local de informacion.
- **Almacenamiento de archivos:** carpetas publicas para imagenes de galeria, barberos y comprobantes de pago.
- **IA conversacional:** asistente virtual conectado a un modelo de lenguaje mediante API.
- **IA facial:** analisis local con `face-api.js` para detectar rasgos y recomendar estilos.

---

## 5. Arquitectura del Sistema

El sistema implementa una arquitectura cliente-servidor.

```text
Cliente web
   |
   | HTTP / Fetch API
   v
Frontend React + Vite
   |
   | Solicitudes REST
   v
Backend Node.js + Express
   |
   | Consultas SQL
   v
Base de datos SQLite
```

### 5.1 Frontend

El frontend contiene las pantallas publicas y privadas del sistema:

- pagina principal;
- servicios;
- equipo;
- galeria;
- reserva;
- analizador facial;
- login de administrador;
- panel de administrador;
- login de barbero;
- panel de barbero.

### 5.2 Backend

El backend expone una API REST encargada de:

- autenticar usuarios;
- validar datos;
- controlar permisos por rol;
- gestionar reservas;
- gestionar servicios;
- gestionar barberos;
- gestionar galeria;
- cargar archivos;
- conectar con la base de datos;
- conectar el asistente IA con el modelo configurado.

### 5.3 Base de datos

SQLite almacena la informacion principal:

- servicios;
- perfiles de usuarios;
- reservas;
- galeria.

---

## 6. Tecnologias Utilizadas

### 6.1 Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Sonner
- face-api.js
- react-webcam

### 6.2 Backend

- Node.js
- Express
- SQLite3
- bcryptjs
- jsonwebtoken
- multer
- cors
- helmet
- express-rate-limit
- dotenv

### 6.3 Herramientas de despliegue

- Nginx
- Render
- Git

---

## 7. Requisitos Tecnicos

### 7.1 Requisitos para ejecucion local

- Node.js instalado.
- npm instalado.
- Navegador web actualizado.
- Sistema operativo Windows, Linux o macOS.
- Conexion a internet si se utiliza el asistente IA.

### 7.2 Puertos utilizados

```text
Frontend desarrollo: 5173
Backend API: 3000
```

---

## 8. Estructura del Proyecto

```text
barber2/
|-- package.json
|-- package-lock.json
|-- README.md
|-- DOCUMENTACION_PROYECTO_INFINITY_BARBER.md
|-- MANUAL_DE_USUARIO_INFINITY_BARBER.md
|-- MANUAL_TECNICO_INFINITY_BARBER.md
|-- render.yaml
|-- barber/
|   |-- package.json
|   |-- vite.config.js
|   |-- public/
|   |   |-- gallery/
|   |   |-- barbers/
|   |   |-- payments/
|   |   |-- models/
|   |   |-- nequi-qr.jpeg
|   |-- src/
|   |   |-- main.tsx
|   |   |-- app/
|   |   |   |-- App.tsx
|   |   |   |-- routes.ts
|   |   |   |-- components/
|   |   |   |-- pages/
|   |   |   |-- lib/
|   |-- server/
|   |   |-- package.json
|   |   |-- index.js
|   |   |-- database.js
|   |   |-- auth.js
|   |   |-- config.js
|   |   |-- scripts/
```

---

## 9. Archivos Principales

### 9.1 Frontend

- `barber/src/main.tsx`: punto de entrada de React.
- `barber/src/app/App.tsx`: componente principal de la aplicacion.
- `barber/src/app/routes.ts`: definicion de rutas.
- `barber/src/app/lib/api.ts`: funciones de comunicacion con el backend.
- `barber/src/app/lib/storage.ts`: manejo de sesiones en navegador.
- `barber/src/app/lib/faceAnalysis.ts`: logica de analisis facial.
- `barber/src/app/components/BookingPage.tsx`: modulo de reservas.
- `barber/src/app/components/AdminPanel.tsx`: panel administrativo.
- `barber/src/app/components/BarberPanel.tsx`: panel del barbero.
- `barber/src/app/components/AIAssistant.tsx`: asistente virtual.
- `barber/src/app/components/FaceAnalyzer.tsx`: analizador facial.

### 9.2 Backend

- `barber/server/index.js`: servidor Express y rutas API.
- `barber/server/database.js`: inicializacion y conexion SQLite.
- `barber/server/auth.js`: autenticacion, JWT, hash y control de roles.
- `barber/server/config.js`: configuracion general del servidor.
- `barber/server/scripts/backup.js`: script de respaldo.

### 9.3 Despliegue

- `render.yaml`: configuracion preparada para Render.

---

## 10. Instalacion Local

### 10.1 Instalar dependencias generales

Desde la raiz del proyecto:

```powershell
npm.cmd install
```

### 10.2 Instalar dependencias del frontend

```powershell
cd barber
npm.cmd install
```

### 10.3 Instalar dependencias del backend

```powershell
cd barber/server
npm.cmd install
```

---

## 11. Configuracion de Variables de Entorno

El sistema utiliza variables de entorno para valores sensibles y configuracion por ambiente.

### 11.1 Variables del backend

Crear un archivo `.env` dentro de:

```text
barber/server/.env
```

Variables recomendadas:

```env
PORT=3000
JWT_SECRET=clave_segura_para_tokens
GITHUB_TOKEN=token_para_modelo_ia
AI_MODEL=gpt-4o
UPLOAD_DIR=../public
CORS_ORIGINS=http://localhost:5173,http://localhost
```

### 11.2 Descripcion de variables

- `PORT`: puerto donde escucha el backend.
- `JWT_SECRET`: clave usada para firmar tokens JWT.
- `GITHUB_TOKEN`: token requerido para consumir el servicio de IA conversacional.
- `AI_MODEL`: modelo usado por el asistente virtual.
- `UPLOAD_DIR`: carpeta base para guardar imagenes.
- `CORS_ORIGINS`: origenes permitidos para consumir la API.

### 11.3 Recomendaciones

- No subir archivos `.env` al repositorio.
- Usar un `JWT_SECRET` largo y dificil de adivinar.
- Mantener privado el token de IA.
- Configurar origenes CORS segun el dominio real de despliegue.

---

## 12. Ejecucion Local

### 12.1 Ejecutar todo el sistema desde la raiz

```powershell
npm.cmd start
```

Este comando ejecuta frontend y backend segun la configuracion del `package.json`.

### 12.2 Ejecutar frontend manualmente

```powershell
cd barber
npm.cmd run dev
```

Ruta esperada:

```text
http://localhost:5173
```

### 12.3 Ejecutar backend manualmente

```powershell
cd barber/server
npm.cmd start
```

Ruta esperada:

```text
http://localhost:3000
```

### 12.4 Verificar backend

Abrir en el navegador o consultar:

```text
http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "date": "fecha_actual"
}
```

---

## 13. Compilacion del Frontend

Para generar una version de produccion:

```powershell
cd barber
npm.cmd run build
```

El resultado queda en:

```text
barber/dist/
```

Esta carpeta contiene archivos estaticos listos para servir con Nginx u otro servidor web.

---

## 14. Base de Datos

El sistema utiliza SQLite. La inicializacion de tablas y datos base se administra desde:

```text
barber/server/database.js
```

### 15.1 Tablas principales

#### services

Almacena los servicios de la barberia.

```text
id
name
price
duration_minutes
created_at
```

#### profiles

Almacena usuarios del sistema.

```text
id
full_name
username
role
avatar_url
description
barber_password
password_hash
created_at
```

Roles permitidos:

```text
admin
barber
```

#### gallery

Almacena imagenes de la galeria.

```text
id
url
created_at
```

#### appointments

Almacena reservas.

```text
id
customer_name
customer_phone
service_id
barber_id
appointment_date
start_time
status
payment_method
payment_reference
payment_screenshot
payment_status
notes
ai_recommendation
created_at
```

### 15.2 Relaciones

- `appointments.service_id` se relaciona con `services.id`.
- `appointments.barber_id` se relaciona con `profiles.id`.
- Los perfiles con rol `barber` pueden tener reservas asociadas.

---

## 15. API REST

### 16.1 Rutas publicas

```text
GET    /api/health
POST   /api/chat
POST   /api/payments/upload
POST   /api/auth/admin/login
POST   /api/auth/barber/login
GET    /api/auth/me
GET    /api/services
GET    /api/barbers
GET    /api/gallery
GET    /api/availability
POST   /api/appointments
```

### 16.2 Rutas privadas de administrador

Requieren token JWT y rol `admin`.

```text
GET    /api/admin/appointments
GET    /api/admin/barbers
POST   /api/admin/barbers/upload
POST   /api/admin/gallery/upload
POST   /api/admin/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id
POST   /api/admin/barbers
PUT    /api/admin/barbers/:id
DELETE /api/admin/barbers/:id
DELETE /api/admin/gallery/:id
PUT    /api/admin/appointments/:id
PATCH  /api/admin/appointments/:id/status
DELETE /api/admin/appointments/:id
```

### 16.3 Rutas privadas de barbero

Requieren token JWT y rol `barber`.

```text
GET /api/barber/appointments
```

---

## 16. Autenticacion y Autorizacion

El sistema utiliza JSON Web Tokens.

### 17.1 Flujo de login

1. El usuario envia `username` y `password`.
2. El backend busca el perfil segun rol.
3. Se compara la contrasena con `bcryptjs`.
4. Si es valida, se genera un token JWT.
5. El frontend guarda la sesion en almacenamiento local.
6. Las rutas privadas consumen la API usando el token.

### 17.2 Control de roles

El backend valida el rol antes de permitir acciones privadas.

```text
admin  -> acceso administrativo completo
barber -> acceso a su agenda personal
```

---

## 17. Seguridad Implementada

Medidas incluidas:

- contrasenas cifradas con `bcryptjs`;
- autenticacion con JWT;
- proteccion por roles;
- limitacion de intentos con `express-rate-limit`;
- cabeceras de seguridad con `helmet`;
- validacion de datos de entrada;
- filtrado de archivos para permitir solo imagenes;
- limite de tamano de archivo;
- control de CORS;
- uso de variables de entorno para informacion sensible.

---

## 18. Carga y Gestion de Archivos

El backend usa `multer` para recibir imagenes.

### 19.1 Carpetas de archivos

```text
barber/public/gallery/    Imagenes de galeria
barber/public/barbers/    Fotografias de barberos
barber/public/payments/   Comprobantes de pago
barber/public/models/     Modelos de IA facial
```

### 19.2 Tipos permitidos

El servidor acepta archivos cuyo `mimetype` inicia con:

```text
image/
```

### 19.3 Tamano maximo

El limite configurado es:

```text
5 MB
```

---

## 19. Asistente Virtual IA

El asistente se implementa en:

```text
barber/src/app/components/AIAssistant.tsx
barber/server/index.js
```

### 20.1 Funcionamiento

1. El usuario escribe un mensaje.
2. El frontend envia el historial a `/api/chat`.
3. El backend agrega instrucciones del sistema.
4. El backend consulta el modelo configurado.
5. El modelo puede pedir herramientas internas.
6. El backend consulta disponibilidad o crea reservas.
7. La respuesta vuelve al frontend.

### 20.2 Herramientas internas

El asistente puede usar:

- `get_availability`: consulta horarios ocupados por barbero y fecha.
- `book_appointment`: registra una cita si los datos son validos.

### 20.3 Requisito tecnico

Para funcionar requiere:

```env
GITHUB_TOKEN=token_valido
AI_MODEL=gpt-4o
```

Si no se configura el token, la ruta `/api/chat` devuelve error de configuracion.

---

## 20. Analizador Facial IA

El analizador facial se implementa en:

```text
barber/src/app/components/FaceAnalyzer.tsx
barber/src/app/lib/faceAnalysis.ts
barber/public/models/
```

### 21.1 Funcionamiento

1. El navegador solicita acceso a la camara.
2. Se cargan los modelos de `face-api.js`.
3. El usuario presiona capturar y analizar.
4. El sistema detecta puntos faciales.
5. Se calcula la proporcion del rostro.
6. Se genera una recomendacion de estilo.
7. El usuario puede enviar la recomendacion al formulario de reserva.

### 21.2 Modelos requeridos

```text
tiny_face_detector_model-weights_manifest.json
tiny_face_detector_model-shard1
face_landmark_68_model-weights_manifest.json
face_landmark_68_model-shard1
```

### 21.3 Consideraciones

- La camara debe estar habilitada.
- El navegador debe permitir permisos de video.
- El procesamiento ocurre localmente en el dispositivo.
- Se recomienda buena iluminacion.

---

## 21. Estados del Sistema

### 22.1 Estados de reserva

```text
pending
confirmed
completed
cancelled
no_show
```

### 22.2 Estados de pago

```text
pending_review
verified
rejected
```

### 22.3 Horarios disponibles

```text
09:00
10:00
11:00
12:00
14:00
15:00
16:00
17:00
18:00
```

---

## 22. Mantenimiento

### 23.1 Respaldo de base de datos

El proyecto incluye un script de respaldo en:

```text
barber/server/scripts/backup.js
```

Ejecucion sugerida:

```powershell
cd barber/server
node scripts/backup.js
```

### 23.2 Respaldo de archivos publicos

Se recomienda respaldar periodicamente:

```text
barber/public/gallery/
barber/public/barbers/
barber/public/payments/
barber/server/*.db
```

### 23.3 Limpieza de archivos

Cuando se eliminan imagenes desde la interfaz administrativa, el backend intenta eliminar tambien el archivo fisico asociado.

Se recomienda revisar ocasionalmente las carpetas publicas para detectar archivos no usados.

---

## 23. Pruebas Tecnicas

### 24.1 Compilacion frontend

```powershell
cd barber
npm.cmd run build
```

### 24.2 Verificacion backend

```text
GET http://localhost:3000/api/health
```

### 24.3 Flujo minimo recomendado

1. Iniciar backend.
2. Iniciar frontend.
3. Consultar servicios.
4. Consultar barberos.
5. Crear una reserva.
6. Ingresar como administrador.
7. Confirmar la reserva.
8. Ingresar como barbero.
9. Verificar que la reserva aparezca en su agenda.

---

## 24. Solucion de Problemas

### 25.1 El frontend no inicia

Posibles causas:

- dependencias no instaladas;
- puerto ocupado;
- error en configuracion de Vite.

Soluciones:

```powershell
cd barber
npm.cmd install
npm.cmd run dev
```

Si el puerto esta ocupado, cerrar el proceso o usar otro puerto.

### 25.2 El backend no inicia

Posibles causas:

- dependencias faltantes;
- puerto 3000 ocupado;
- error en variables de entorno;
- error de permisos en carpetas de subida.

Soluciones:

```powershell
cd barber/server
npm.cmd install
npm.cmd start
```

Verificar que `PORT` y `UPLOAD_DIR` esten correctamente configurados.

### 25.3 Error de CORS

Posible causa:

- el origen del frontend no esta autorizado.

Solucion:

Actualizar `CORS_ORIGINS` en el archivo `.env` del backend.

Ejemplo:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost
```

### 25.4 Error al usar el asistente IA

Posibles causas:

- falta `GITHUB_TOKEN`;
- token invalido;
- fallo de conexion externa;
- modelo no disponible.

Solucion:

- verificar el archivo `.env`;
- confirmar que el token sea valido;
- revisar conexion a internet;
- revisar la variable `AI_MODEL`.

### 25.5 Error al subir imagenes

Posibles causas:

- archivo no compatible;
- archivo mayor a 5 MB;
- carpeta de destino sin permisos;
- backend detenido.

Solucion:

- usar imagen JPG, PNG o WebP;
- reducir el peso del archivo;
- verificar carpetas `gallery`, `barbers` y `payments`;
- reiniciar backend.

### 25.6 No se cargan modelos del analizador facial

Posibles causas:

- archivos faltantes en `public/models`;
- ruta incorrecta;
- problema de servidor estatico.

Solucion:

- verificar que existan los archivos del modelo;
- confirmar que el frontend este sirviendo la carpeta `public`;
- recargar la pagina.

---

## 25. Despliegue

### 25.1 Despliegue en Render

El archivo:

```text
render.yaml
```

contiene configuracion base para preparar despliegue en Render.

Antes de publicar en produccion se recomienda:

- configurar variables de entorno seguras;
- revisar origenes CORS;
- cambiar secretos de desarrollo;
- verificar rutas de archivos persistentes;
- configurar respaldos;
- usar HTTPS.

---

## 26. Recomendaciones Tecnicas

- Usar `JWT_SECRET` seguro en produccion.
- No compartir tokens de IA.
- Mantener dependencias actualizadas.
- Realizar respaldos periodicos de base de datos y archivos.
- No eliminar manualmente archivos relacionados con reservas sin revisar la base de datos.
- Migrar a PostgreSQL si el sistema crece en volumen.
- Agregar logs estructurados para produccion.
- Implementar monitoreo y alertas si se despliega publicamente.

---

## 27. Glosario Tecnico

- **API REST:** interfaz HTTP para comunicacion entre frontend y backend.
- **JWT:** token usado para autenticar sesiones.
- **SQLite:** motor de base de datos local basado en archivo.
- **Middleware:** funcion intermedia que procesa solicitudes en Express.
- **CORS:** politica que controla que origenes pueden consumir la API.
- **Hash:** transformacion segura de contrasenas.
- **Nginx:** servidor web usado para servir frontend y redirigir trafico.
- **Vite:** herramienta de desarrollo y compilacion frontend.
- **Multer:** libreria para recibir archivos en Express.

---

## 28. Conclusiones

Infinity Barber cuenta con una estructura tecnica clara y modular que facilita su instalacion, ejecucion y mantenimiento. La separacion entre frontend, backend, base de datos y archivos publicos permite comprender el sistema por capas y realizar ajustes sin afectar toda la aplicacion.

El sistema integra funciones modernas como autenticacion por roles, carga de archivos, gestion administrativa, asistencia con IA y analisis facial local, lo que lo convierte en una base solida para futuras mejoras, despliegue en produccion y ampliacion funcional.

---

## 29. Anexos

### 29.1 Comandos principales

```powershell
npm.cmd install
npm.cmd start
cd barber
npm.cmd run dev
npm.cmd run build
cd server
npm.cmd start
```

### 29.2 Rutas principales del frontend

```text
/                 Pagina principal
/servicios        Servicios
/equipo           Equipo
/galeria          Galeria
/reserva          Reservas
/ia-barber        Analizador facial
/admin/login      Login administrador
/admin            Panel administrador
/barber/login     Login barbero
/barber           Panel barbero
```

### 29.3 Endpoint de salud

```text
GET /api/health
```

### 29.4 Archivos criticos

```text
barber/server/index.js
barber/server/database.js
barber/server/auth.js
barber/src/app/routes.ts
barber/src/app/lib/api.ts
barber/src/app/components/AdminPanel.tsx
barber/src/app/components/BookingPage.tsx
barber/src/app/components/AIAssistant.tsx
barber/src/app/components/FaceAnalyzer.tsx
```
