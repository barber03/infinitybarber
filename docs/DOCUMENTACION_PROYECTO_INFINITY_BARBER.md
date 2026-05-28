# Documentacion del Proyecto Infinity Barber

## 1. Portada

**Nombre del proyecto:** Infinity Barber  
**Tipo de proyecto:** Aplicacion web full-stack para gestion de barberia  
**Institucion:** SENA  
**Programa de formacion:** [ADSO- ANALISIS Y DESARROLLO DE SOFTWARE]  
**Aprendiz:** [Jesús David Figueroa Alvarez]  
**Instructor(a):** [Karina Meza]  
**Fecha:** [21/04/2026]  

---

## 2. Introduccion

Infinity Barber es una aplicación web de vanguardia desarrollada para la gestión integral de barberías modernas. El sistema integra una interfaz pública para clientes, un panel privado de administración, un panel para barberos y herramientas avanzadas de Inteligencia Artificial (IA) para asistencia virtual y análisis biométrico.

El proyecto utiliza una arquitectura full-stack moderna (React 19, Node.js, SQLite) y ha sido fortalecido con capacidades de IA para el agendamiento inteligente y la recomendación de estilos basada en la forma del rostro, permitiendo centralizar y automatizar la operación del negocio en un entorno digital seguro y escalable.


Esta solucion nace como respuesta a la necesidad de digitalizar procesos que tradicionalmente se realizan por mensajes o de manera manual, reduciendo errores, mejorando la trazabilidad de la informacion y ofreciendo una experiencia mas profesional tanto para el cliente como para el personal de la barberia.

---

## 3. Planteamiento del Problema

Muchas barberias pequenas y medianas gestionan sus citas de forma manual por llamadas, mensajes de WhatsApp o agendas fisicas. Este modelo presenta varias dificultades:

- riesgo de duplicidad en los horarios de atencion;
- falta de control centralizado sobre servicios, barberos y reservas;
- dificultad para verificar pagos o anticipos;
- ausencia de trazabilidad sobre cambios, cancelaciones o confirmaciones;
- baja profesionalizacion de la experiencia digital del negocio.

Ante esta situacion, se propone el desarrollo de una plataforma web que permita automatizar y organizar las operaciones basicas de una barberia, mejorando la eficiencia administrativa y la experiencia del usuario final.

---

## 4. Justificacion

La implementacion de Infinity Barber permite digitalizar procesos clave del negocio y dar una imagen mas profesional de la barberia. La plataforma:

- optimiza la gestion de citas;
- mejora el control de disponibilidad de cada barbero;
- permite administrar servicios y personal desde un panel central;
- fortalece la seguridad mediante autenticacion y control por roles;
- facilita futuras mejoras como despliegue en produccion, analitica o integraciones externas.

Desde una perspectiva academica, este proyecto demuestra la aplicacion practica de conocimientos de desarrollo web, bases de datos, seguridad, arquitectura cliente-servidor y gestion de software.

---

## 5. Objetivos

### 5.1 Objetivo general

Desarrollar una aplicacion web full-stack para la gestion de una barberia, permitiendo administrar reservas, servicios, barberos y contenidos visuales en un entorno digital seguro, organizado y escalable.

### 5.2 Objetivos especificos

- Diseñar una interfaz publica para que los clientes consulten servicios, equipo y portafolio.
- Implementar un modulo de reservas con validacion de disponibilidad por fecha y barbero.
- Construir un panel de administración para gestionar servicios, citas, galería y personal.
- Implementar un Asistente Virtual basado en IA (GPT-4o) para el soporte al cliente y agendamiento conversacional.
- Integrar un Analizador Facial con IA para recomendaciones personalizadas de cortes y estilos.
- Implementar un panel de acceso individual para barberos con visualización de su agenda.

- Aplicar mecanismos de autenticacion y autorizacion por roles.
- Persistir la informacion del sistema mediante una base de datos SQLite.
- Organizar el proyecto con una estructura modular que facilite mantenimiento y escalabilidad.

---

## 6. Alcance del Proyecto

El sistema desarrollado cubre las siguientes funciones:

- agendamiento asistido por IA (Infinity Assistant);
- análisis de rostro para recomendaciones de estilo;
- visualización pública de la barbería;
- consulta de servicios y barberos;
- registro de citas por parte del cliente;
- control de disponibilidad por horario y barbero;
- registro de referencia de pago y carga de comprobantes;
- administración de reservas;
- administración de servicios;
- administración de barberos;
- administración de galería de imágenes;
- autenticación segura para administrador y barberos.

### 6.1 Próximas Implementaciones (Futuro)

Por decisión del desarrollo actual, no se implementaron aún:

- integraciones automáticas con WhatsApp;
- pasarela de pago en línea directa (ej: Mercado Pago);
- reportes estadísticos avanzados;
- notificaciones automáticas por correo o SMS.


---

## 7. Metodologia de Desarrollo

Para el desarrollo del proyecto se utilizo una metodologia incremental. Se construyo primero una version base del sistema y posteriormente se fueron agregando mejoras funcionales y tecnicas, especialmente en seguridad, estructura del backend y organizacion de la operacion.

### Etapas generales del desarrollo

1. Analisis del problema y definicion de requerimientos.
2. Diseño de la interfaz publica y los paneles privados.
3. Construccion del frontend con React.
4. Construccion del backend con Express.
5. Modelado de base de datos en SQLite.
6. Implementacion de autenticacion, control por roles y validaciones.
7. Pruebas de compilacion y arranque del sistema.
8. Elaboracion de documentacion tecnica.

---

## 8. Tecnologias Utilizadas

### 8.1 Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- face-api.js (IA para análisis facial)
- React Router
- Lucide React
- Sonner

### 8.2 Backend

- Node.js
- Express
- SQLite3
- GPT-4o / Inference AI (Motor de IA)
- Multer (Gestión de archivos)
- CORS / Helmet / express-rate-limit (Seguridad)
- bcryptjs / jsonwebtoken
- dotenv

### 8.3 Herramientas de apoyo

- Nginx (Proxy inverso y servidor estático)
- Git y GitHub para control de versiones
- Render como opción preparada para despliegue
- PowerShell para ejecución local en Windows

---

## 9. Arquitectura del Sistema

El proyecto implementa una arquitectura cliente-servidor.

### 9.1 Frontend

El frontend corresponde a la interfaz con la que interactuan los usuarios. Se construyo en React y se organiza en componentes reutilizables. Presenta tres areas principales:

- pagina publica para clientes;
- panel de administrador;
- panel de barbero.

### 9.2 Backend

El backend expone una API REST desarrollada en Express. Se encarga de:

- autenticar usuarios;
- validar datos;
- controlar permisos por rol;
- gestionar las operaciones CRUD;
- consultar y actualizar la base de datos;
- servir archivos estaticos de galeria y barberos.

### 9.3 Base de datos

La base de datos usada es SQLite, adecuada para un proyecto academico o una operacion local de pequena escala. Toda la informacion principal del sistema queda almacenada en un archivo local.

---

## 10. Estructura del Proyecto

```text
barber2/
|-- package.json
|-- README.md
|-- render.yaml
|-- DOCUMENTACION_PROYECTO_INFINITY_BARBER.md
|-- barber/
|   |-- package.json
|   |-- .env.example
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |   |-- components/
|   |   |   |   |-- AIAssistant.tsx
|   |   |   |   |-- FaceAnalyzer.tsx
|   |   |   |-- lib/
|   |-- server/
|   |   |-- package.json
|   |   |-- .env.example
|   |   |-- index.js
|   |   |-- database.js
|   |   |-- auth.js
|   |   |-- config.js
|   |   |-- scripts/

```

---

## 11. Modulos Funcionales

### 11.1 Modulo publico

Permite a los clientes:

- visualizar la pagina principal;
- consultar servicios;
- conocer el equipo de barberos;
- ver la galeria de trabajos;
- registrar una reserva;
- reportar una referencia de pago.

### 11.2 Modulo de reservas

Este modulo valida:

- datos del cliente;
- fecha seleccionada;
- barbero seleccionado;
- horario disponible;
- referencia de pago suministrada.

Las reservas se crean con estado pendiente hasta que el administrador revise la informacion.

### 11.3 Modulo administrador

Permite:

- consultar todas las citas;
- editar reservas;
- confirmar o cancelar reservas;
- validar el estado del pago;
- crear y eliminar servicios;
- crear, editar y eliminar barberos;
- subir y eliminar imagenes de galeria.

### 11.4 Modulo barbero

Permite a cada barbero:

- iniciar sesion con su usuario individual;
- consultar unicamente su agenda;
- revisar citas actuales y proximas;
- visualizar datos relevantes del cliente y del servicio.

### 11.5 Módulo Asistente IA (Infinity)

IA generativa configurada para:
- Atender dudas sobre servicios y horarios.
- Guiar al usuario en el proceso de reserva.
- Validar el envío de capturas de pago por Nequi.
- Agendar citas directamente interactuando con la base de datos.

### 11.6 Módulo Analizador Facial

Herramienta de análisis biométrico que:
- Detecta puntos clave del rostro mediante la cámara del usuario.
- Determina la forma geométrica de la cara.
- Recomienda estilos de corte específicos para potenciar los rasgos naturales.
- Permite reservar el estilo recomendado de forma inmediata.


---

## 12. Base de Datos

### 12.1 Tablas principales

El sistema trabaja con las siguientes tablas:

#### services

Almacena los servicios disponibles de la barberia:

- `id`
- `name`
- `price`
- `duration_minutes`
- `created_at`

#### profiles

Almacena los usuarios del sistema:

- `id`
- `full_name`
- `username`
- `role`
- `avatar_url`
- `description`
- `barber_password` (legado)
- `password_hash`
- `created_at`

#### gallery

Almacena las imagenes del portafolio:

- `id`
- `url`
- `created_at`

#### appointments

Almacena las reservas:

- `id`
- `customer_name`
- `customer_phone`
- `service_id`
- `barber_id`
- `appointment_date`
- `start_time`
- `status`
- `payment_method`
- `payment_reference`
- `payment_status`
- `notes`
- `created_at`

### 12.2 Relaciones

- Un servicio puede estar asociado a muchas citas.
- Un barbero puede tener muchas citas.
- Cada cita pertenece a un servicio y a un barbero.

---

## 13. API REST Implementada

### 13.1 Rutas publicas

- `GET /api/health`
- `POST /api/chat` (Interacción con asistente IA)
- `POST /api/payments/upload` (Carga de comprobantes de pago)
- `POST /api/auth/admin/login`
- `POST /api/auth/barber/login`
- `GET /api/auth/me`
- `GET /api/services`
- `GET /api/barbers`
- `GET /api/gallery`
- `GET /api/availability`
- `POST /api/appointments`

### 13.2 Rutas privadas del administrador

- `GET /api/admin/appointments`
- `GET /api/admin/barbers`
- `POST /api/admin/barbers/upload`
- `POST /api/admin/gallery/upload`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `POST /api/admin/barbers`
- `PUT /api/admin/barbers/:id`
- `DELETE /api/admin/barbers/:id`
- `DELETE /api/admin/gallery/:id`
- `PUT /api/admin/appointments/:id`
- `PATCH /api/admin/appointments/:id/status`
- `DELETE /api/admin/appointments/:id`

### 13.3 Rutas privadas del barbero

- `GET /api/barber/appointments`

---

## 14. Seguridad Implementada

Uno de los avances mas importantes del proyecto fue el fortalecimiento de la seguridad.

### 14.1 Mecanismos aplicados

- Autenticacion mediante JWT.
- Almacenamiento de contraseñas cifradas con `bcryptjs`.
- Proteccion de rutas por rol.
- Limitacion de peticiones con `express-rate-limit`.
- Uso de `helmet` para endurecer cabeceras HTTP.
- Variables de entorno para datos sensibles.
- Validaciones de payload en operaciones criticas.

### 14.2 Roles del sistema

#### Administrador

- acceso completo al panel administrativo;
- gestion de reservas, servicios, barberos y galeria.

#### Barbero

- acceso exclusivo a su agenda personal;
- no puede ver ni modificar la informacion del resto del equipo.

---

## 15. Flujo General del Sistema

### Flujo del cliente

1. El cliente accede a la pagina principal.
2. Consulta servicios y barberos.
3. Selecciona fecha y hora disponibles.
4. Ingresa sus datos y la referencia de pago.
5. El sistema registra la reserva con estado pendiente.

### Flujo del administrador

1. El administrador inicia sesion.
2. Consulta todas las reservas.
3. Revisa la referencia de pago.
4. Confirma, actualiza o cancela la cita.
5. Gestiona los servicios, barberos y galeria.

### Flujo del barbero

1. El barbero inicia sesion con sus credenciales.
2. El sistema carga solo sus citas.
3. El barbero revisa su agenda del dia y sus proximas reservas.

---

## 16. Requerimientos del Sistema

### 16.1 Requerimientos funcionales

- El sistema debe permitir consultar servicios y barberos.
- El sistema debe permitir registrar una reserva.
- El sistema debe validar disponibilidad de horarios.
- El administrador debe poder gestionar reservas.
- El administrador debe poder gestionar servicios.
- El administrador debe poder gestionar barberos.
- El administrador debe poder gestionar la galeria.
- El barbero debe poder visualizar su agenda.

### 16.2 Requerimientos no funcionales

- La aplicacion debe ser intuitiva y de facil navegacion.
- El sistema debe proteger las rutas privadas.
- Las contraseñas deben almacenarse de forma segura.
- El sistema debe permitir crecimiento futuro.
- La informacion debe persistir en base de datos.

---

## 17. Pruebas Realizadas

Durante el desarrollo se realizaron pruebas funcionales y tecnicas:

- compilacion exitosa del frontend con `npm run build`;
- arranque del frontend con Vite;
- arranque del backend con Express;
- validacion de rutas publicas y privadas;
- prueba de persistencia en SQLite;
- validacion del flujo de login por roles;
- prueba del script de respaldo de base de datos.

---

## 18. Resultados Obtenidos

Al finalizar la fase actual del proyecto se obtuvo una aplicacion funcional con:

- interfaz moderna para la barberia;
- backend organizado y protegido;
- autenticacion segura;
- panel administrativo funcional;
- panel privado para barberos;
- base de datos estructurada;
- preparacion tecnica para despliegue futuro.

Esto permite considerar el proyecto como una base solida para continuar con nuevas mejoras o una futura publicacion en internet.

---

## 19. Limitaciones Actuales

A pesar de los avances logrados, existen algunas limitaciones:

- no hay integracion automatica con pasarelas de pago;
- no se implementaron notificaciones automaticas;
- la base de datos SQLite es adecuada para pequena escala, pero no para alto volumen;
- aun no se encuentra desplegado en produccion;
- no se ha incorporado un sistema de reportes o estadisticas del negocio.

---

## 20. Recomendaciones de Mejora

Como trabajo futuro se recomienda:

- desplegar el sistema en la nube;
- migrar a PostgreSQL si aumenta el volumen de uso;
- integrar notificaciones automaticas;
- implementar dashboards con metricas;
- agregar modulo de historial de clientes;
- integrar pasarela de pago o validacion automatica;
- incorporar respaldo automatico programado.

---

## 21. Conclusiones

Infinity Barber constituye una solucion web funcional y estructurada para la gestion de una barberia. El sistema demuestra la aplicacion integrada de conocimientos en desarrollo frontend, backend, bases de datos, autenticacion, seguridad y arquitectura de software.

El proyecto responde de manera efectiva a una necesidad real del entorno comercial, permitiendo digitalizar y profesionalizar procesos operativos fundamentales del negocio. Asimismo, deja una base tecnica clara para futuras ampliaciones, mejoras y despliegues.

Desde el punto de vista formativo, el desarrollo de este proyecto fortalece competencias relacionadas con el analisis de requerimientos, diseño de soluciones, programacion full-stack, manejo de bases de datos y documentacion de software.

---

## 22. Bibliografia y Referencias Tecnicas

- Documentacion oficial de React: https://react.dev/
- Documentacion oficial de Vite: https://vite.dev/
- Documentacion oficial de Node.js: https://nodejs.org/
- Documentacion oficial de Express: https://expressjs.com/
- Documentacion oficial de SQLite: https://www.sqlite.org/docs.html
- Documentacion oficial de JSON Web Token: https://jwt.io/
- Documentacion oficial de Render: https://render.com/docs

---

## 23. Anexos

### 23.1 Comandos de ejecución local

```powershell
npm.cmd start
```

### 23.2 Build manual del frontend

```powershell
cd barber
npm.cmd run build
```

### 23.3 Archivos clave del sistema de IA

- `barber/src/app/components/AIAssistant.tsx`
- `barber/src/app/components/FaceAnalyzer.tsx`
- `barber/server/index.js` (Lógica de orquestación de herramientas IA)


