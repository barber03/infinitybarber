# Manual de Usuario Infinity Barber

## 1. Portada

**Nombre del proyecto:** Infinity Barber  
**Tipo de documento:** Manual de usuario  
**Tipo de sistema:** Aplicacion web para gestion de barberia  
**Institucion:** SENA  
**Programa de formacion:** [ADSO - ANALISIS Y DESARROLLO DE SOFTWARE]  
**Aprendiz:** [Jesus David Figueroa Alvarez]  
**Instructor(a):** [Karina Meza]  
**Fecha:** [21/04/2026]  

---

## 2. Introduccion

El presente manual de usuario tiene como finalidad orientar a los usuarios de Infinity Barber en el uso correcto de la plataforma. Este documento explica, de manera clara y organizada, los pasos necesarios para navegar por el sitio, realizar reservas, utilizar el asistente virtual, acceder al recomendador de estilos con IA y manejar los paneles privados del administrador y del barbero.

Infinity Barber fue desarrollado para facilitar la gestion de una barberia moderna, permitiendo que los clientes consulten servicios y agenden citas, que el administrador controle la operacion del negocio y que cada barbero revise su agenda personal.

---

## 3. Objetivo del Manual

Brindar una guia practica para que clientes, administradores y barberos puedan utilizar correctamente las funciones principales del sistema Infinity Barber.

### 3.1 Objetivos especificos

- Explicar el acceso a la pagina publica.
- Indicar el proceso para consultar servicios, equipo y galeria.
- Describir el paso a paso para registrar una reserva.
- Orientar el uso del pago por Nequi y la carga del comprobante.
- Explicar el funcionamiento del Asistente Virtual Infinity.
- Describir el uso del Analizador Facial con IA.
- Guiar al administrador en la gestion de reservas, servicios, barberos y galeria.
- Guiar al barbero en la consulta de su agenda personal.

---

## 4. Usuarios del Sistema

Infinity Barber maneja tres tipos principales de usuarios:

### 4.1 Cliente

Es la persona que visita la pagina web de la barberia. Puede consultar informacion publica, ver servicios, conocer el equipo, revisar la galeria, usar la IA y registrar una reserva.

### 4.2 Administrador

Es el usuario encargado de controlar la operacion general del sistema. Puede gestionar reservas, verificar pagos, administrar servicios, crear o editar barberos y subir imagenes a la galeria.

### 4.3 Barbero

Es el profesional de la barberia. Tiene acceso a un panel privado donde puede consultar solo las citas asignadas a su perfil.

---

## 5. Requisitos para Usar el Sistema

Para utilizar Infinity Barber se recomienda contar con:

- computador, tablet o telefono celular;
- navegador web actualizado, como Chrome, Edge, Firefox o Safari;
- conexion a internet o acceso a la red local donde este instalado el sistema;
- camara habilitada si se desea usar el Analizador Facial con IA;
- imagen o captura del comprobante de pago cuando se realice una reserva por Nequi.

---

## 6. Acceso al Sistema

El sistema puede ejecutarse en un entorno local o en un servidor. Segun la configuracion del proyecto, las rutas principales son:

- Pagina principal: `http://localhost:5173/` o `http://localhost/`
- Reserva de citas: `/reserva`
- Recomendador IA: `/ia-barber`
- Login administrador: `/admin/login`
- Panel administrador: `/admin`
- Login barbero: `/barber/login`
- Panel barbero: `/barber`

Cuando se ejecuta localmente en modo desarrollo, el frontend puede consultarse en:

```text
http://localhost:5173
```

---

## 7. Navegacion de la Pagina Publica

La pagina publica de Infinity Barber cuenta con un menu principal que permite acceder a las siguientes secciones:

- **Inicio:** presenta la identidad de la barberia y accesos principales.
- **Servicios:** muestra los servicios disponibles, precios y duracion.
- **Equipo:** muestra los barberos registrados en el sistema.
- **Galeria:** muestra imagenes de trabajos realizados.
- **Recomendador IA:** permite analizar el rostro del cliente y recibir una recomendacion de corte.
- **Reservar:** abre el formulario para agendar una cita.
- **Contacto:** permite consultar informacion de contacto de la barberia.

En dispositivos moviles, el menu se muestra mediante un boton lateral o desplegable.

---

## 8. Consulta de Servicios

Para consultar los servicios disponibles:

1. Ingresar a la pagina principal.
2. Seleccionar la opcion **Servicios** en el menu.
3. Revisar el nombre del servicio, duracion y precio.
4. Si se desea agendar, seleccionar la opcion **Reservar**.

Los servicios son administrados desde el panel del administrador, por lo que pueden cambiar segun la configuracion del negocio.

---

## 9. Consulta del Equipo de Barberos

Para consultar el equipo:

1. Seleccionar la opcion **Equipo**.
2. Revisar los perfiles de los barberos disponibles.
3. Observar el nombre, fotografia y descripcion profesional.
4. Elegir el barbero preferido al momento de realizar la reserva.

Cada barbero tiene una agenda independiente. El sistema evita que se registre mas de una cita para el mismo barbero en el mismo horario.

---

## 10. Consulta de Galeria

La galeria permite visualizar trabajos realizados por la barberia.

Pasos:

1. Seleccionar la opcion **Galeria**.
2. Revisar las imagenes disponibles.
3. Usar las imagenes como referencia visual antes de elegir un servicio o estilo.

Las imagenes de esta seccion son administradas desde el panel del administrador.

---

## 11. Registro de Reserva

El modulo de reserva permite al cliente agendar una cita de forma organizada.

### 11.1 Ingreso al formulario

Para iniciar una reserva:

1. Ir al menu principal.
2. Seleccionar **Reservar**.
3. El sistema mostrara el formulario de agenda.

### 11.2 Paso 1: Datos del cliente

El cliente debe ingresar:

- nombre completo;
- numero de telefono.

Estos datos son necesarios para identificar la reserva y permitir que la barberia pueda comunicarse con el cliente.

### 11.3 Paso 2: Servicio y barbero

El cliente debe seleccionar:

- el servicio que desea recibir;
- el barbero de preferencia.

El sistema mostrara los servicios y barberos registrados por el administrador.

### 11.4 Paso 3: Fecha y horario

El cliente debe:

1. Seleccionar una fecha disponible.
2. Esperar que el sistema consulte la disponibilidad.
3. Escoger uno de los horarios libres.

Los horarios disponibles son:

```text
09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00, 18:00
```

Si un horario ya esta ocupado, el sistema lo marcara como no disponible.

### 11.5 Paso 4: Pago por Nequi

El sistema trabaja con pago por Nequi mediante comprobante.

El cliente debe:

1. Escanear el codigo QR mostrado en pantalla.
2. Realizar la transferencia por el valor del servicio.
3. Tomar una captura de pantalla del comprobante.
4. Seleccionar **Subir imagen**.
5. Adjuntar la captura del pago.

La reserva no puede registrarse si no se carga el comprobante de pago.

### 11.6 Confirmacion de la reserva

Una vez completados los datos:

1. Presionar **Confirmar reserva**.
2. Esperar el mensaje de confirmacion.
3. La cita queda registrada con estado **pendiente**.

El administrador debe revisar posteriormente el pago y confirmar la cita.

---

## 12. Estados de una Reserva

Las reservas pueden manejar los siguientes estados:

- **pending:** reserva pendiente de revision.
- **confirmed:** reserva confirmada por el administrador.
- **completed:** servicio realizado.
- **cancelled:** reserva cancelada.
- **no_show:** el cliente no asistio.

El pago puede manejar estos estados:

- **pending_review:** pago pendiente de revision.
- **verified:** pago verificado.
- **rejected:** pago rechazado.

---

## 13. Uso del Asistente Virtual Infinity

Infinity Assistant es el chat de ayuda integrado en la pagina.

### 13.1 Abrir el asistente

1. Ubicar el boton flotante de chat en la esquina inferior derecha.
2. Hacer clic sobre el icono de mensaje.
3. Se abrira la ventana de conversacion.

### 13.2 Enviar un mensaje

1. Escribir la pregunta en el campo de texto.
2. Presionar el boton de enviar.
3. Esperar la respuesta del asistente.

El asistente puede responder dudas sobre servicios, horarios y proceso de reserva.

### 13.3 Agendar con el asistente

Cuando el cliente desea agendar por chat, el asistente puede solicitar:

- servicio deseado;
- barbero preferido;
- fecha;
- hora;
- nombre del cliente;
- telefono;
- comprobante de pago por Nequi.

Para adjuntar el comprobante:

1. Presionar el icono de clip.
2. Seleccionar la imagen del comprobante.
3. Esperar que el asistente procese la informacion.

Si toda la informacion es valida, el asistente puede registrar la cita en el sistema.

---

## 14. Uso del Analizador Facial con IA

El Analizador Facial con IA recomienda estilos de corte segun la forma del rostro.

### 14.1 Acceso

1. Seleccionar **Recomendador IA** en el menu.
2. Permitir el uso de la camara cuando el navegador lo solicite.
3. Esperar a que carguen los motores de IA.

### 14.2 Realizar el analisis

1. Ubicarse frente a la camara.
2. Procurar buena iluminacion.
3. Presionar **Capturar y analizar**.
4. Esperar el resultado.

El sistema detecta puntos clave del rostro y determina una forma facial aproximada.

### 14.3 Resultado del analisis

El sistema muestra:

- forma del rostro detectada;
- corte recomendado;
- descripcion de la recomendacion.

### 14.4 Reservar el estilo recomendado

Si el cliente desea agendar el estilo sugerido:

1. Presionar **Reservar este estilo**.
2. El sistema redirige al formulario de reserva.
3. Continuar con la seleccion de barbero, fecha, hora y pago.

---

## 15. Acceso del Administrador

El administrador debe ingresar desde:

```text
/admin/login
```

Pasos:

1. Escribir el usuario administrador.
2. Escribir la contrasena.
3. Presionar **Iniciar sesion**.

Si los datos son correctos, el sistema redirige al panel administrativo.

Si los datos son incorrectos, se mostrara un mensaje de error.

---

## 16. Panel de Administrador

El panel de administrador permite gestionar la informacion principal del sistema.

Las secciones disponibles son:

- **Dashboard / Reservas**
- **Servicios**
- **Equipo**
- **Galeria**

### 16.1 Dashboard de reservas

En esta seccion el administrador puede:

- consultar el historial de reservas;
- revisar cliente, fecha, hora, servicio y barbero;
- verificar el estado de la reserva;
- verificar el estado del pago;
- abrir el comprobante de pago;
- confirmar una cita;
- editar una reserva;
- eliminar una reserva;
- enviar mensaje de confirmacion por WhatsApp mediante enlace.

### 16.2 Confirmar una reserva

Para confirmar una reserva:

1. Ingresar al panel de administrador.
2. Ir a **Dashboard**.
3. Ubicar la reserva pendiente.
4. Revisar el comprobante de pago.
5. Presionar el boton de aprobacion.

Al aprobar, el sistema puede cambiar el estado de la cita a **confirmed** y el pago a **verified**.

### 16.3 Editar una reserva

Para editar una reserva:

1. Ubicar la reserva en el historial operativo.
2. Presionar **Editar**.
3. Modificar los campos necesarios.
4. Guardar los cambios.

El administrador puede modificar datos como:

- nombre del cliente;
- telefono;
- fecha;
- hora;
- servicio;
- barbero;
- estado de la reserva;
- estado del pago;
- notas.

### 16.4 Eliminar una reserva

Para eliminar una reserva:

1. Ubicar la reserva.
2. Presionar el boton de eliminar.
3. Confirmar la accion si el navegador o la interfaz lo solicita.

Esta accion retira la reserva del sistema.

---

## 17. Gestion de Servicios

La seccion **Servicios** permite crear y eliminar servicios.

### 17.1 Crear un servicio

Pasos:

1. Ir a **Servicios**.
2. Escribir el nombre del servicio.
3. Escribir el precio.
4. Escribir la duracion en minutos.
5. Presionar **Guardar**.

El nuevo servicio aparecera en la pagina publica y en el formulario de reserva.

### 17.2 Eliminar un servicio

Pasos:

1. Ir a **Servicios**.
2. Ubicar el servicio.
3. Presionar el icono de eliminar.

El sistema puede impedir la eliminacion si el servicio ya tiene reservas relacionadas.

---

## 18. Gestion del Equipo

La seccion **Equipo** permite crear, editar y eliminar perfiles de barberos.

### 18.1 Crear un barbero

Pasos:

1. Ir a **Equipo**.
2. Completar el nombre completo.
3. Escribir el nombre de usuario.
4. Crear una contrasena.
5. Cargar una fotografia de perfil si se desea.
6. Escribir una biografia profesional.
7. Presionar **Crear Profesional**.

El barbero creado aparecera en la pagina publica y podra iniciar sesion en su panel.

### 18.2 Editar un barbero

Pasos:

1. Ir a **Equipo**.
2. Ubicar el perfil del barbero.
3. Presionar el boton de editar.
4. Modificar los datos necesarios.
5. Presionar **Actualizar**.

Si no se desea cambiar la contrasena, se puede dejar el campo de contrasena vacio al editar.

### 18.3 Eliminar un barbero

Pasos:

1. Ir a **Equipo**.
2. Ubicar el perfil del barbero.
3. Presionar el boton de eliminar.

El sistema puede impedir la eliminacion si el barbero tiene reservas asociadas.

---

## 19. Gestion de Galeria

La seccion **Galeria** permite administrar las imagenes visibles en el sitio publico.

### 19.1 Subir una imagen

Pasos:

1. Ir a **Galeria**.
2. Seleccionar una imagen desde el equipo.
3. Presionar **Subir a Galeria**.

La imagen se mostrara en la seccion publica de galeria.

### 19.2 Eliminar una imagen

Pasos:

1. Ir a **Galeria**.
2. Ubicar la imagen.
3. Presionar el boton de eliminar.

La imagen dejara de mostrarse en la pagina publica.

---

## 20. Acceso del Barbero

El barbero debe ingresar desde:

```text
/barber/login
```

Pasos:

1. Escribir el usuario asignado por el administrador.
2. Escribir la contrasena.
3. Presionar **Entrar al panel**.

Si los datos son correctos, el sistema muestra el panel personal del barbero.

---

## 21. Panel del Barbero

El panel del barbero permite consultar la agenda personal.

El barbero puede ver:

- numero de citas del dia;
- numero de proximas citas;
- siguiente cita;
- agenda de hoy;
- proximas reservas;
- nombre del cliente;
- telefono del cliente;
- servicio solicitado;
- fecha y hora;
- duracion;
- estado de la reserva;
- estado del pago;
- referencia de pago.

El barbero solo puede consultar las citas asignadas a su propio perfil. No tiene acceso a la agenda de otros barberos ni a la administracion general.

---

## 22. Cierre de Sesion

### 22.1 Cierre de sesion del administrador

1. Ir al panel administrativo.
2. Presionar **Cerrar sesion** en el menu lateral.
3. El sistema regresara al login o a una vista publica.

### 22.2 Cierre de sesion del barbero

1. Ir al panel del barbero.
2. Presionar **Cerrar sesion**.
3. El sistema cerrara la sesion del usuario.

---

## 23. Recomendaciones de Uso

Para un uso correcto del sistema se recomienda:

- verificar que los datos del cliente esten completos antes de confirmar una reserva;
- revisar siempre el comprobante de pago antes de aprobar una cita;
- mantener actualizados los servicios, precios y duraciones;
- crear usuarios de barbero con contrasenas seguras;
- evitar eliminar servicios o barberos que ya tengan historial de citas;
- subir imagenes claras y profesionales a la galeria;
- usar buena iluminacion al ejecutar el Analizador Facial con IA;
- cerrar sesion al terminar de usar los paneles privados.

---

## 24. Posibles Errores y Soluciones

### 24.1 No se puede iniciar sesion

Posibles causas:

- usuario incorrecto;
- contrasena incorrecta;
- el perfil no existe;
- el servidor no esta activo.

Solucion:

- revisar usuario y contrasena;
- solicitar al administrador que verifique el perfil;
- confirmar que backend y frontend esten ejecutandose.

### 24.2 No aparecen servicios o barberos

Posibles causas:

- no existen registros en la base de datos;
- el backend no esta respondiendo;
- hay un error de conexion.

Solucion:

- ingresar al panel administrador y crear servicios o barberos;
- reiniciar el servidor;
- revisar la conexion del sistema.

### 24.3 No se puede reservar una cita

Posibles causas:

- faltan datos obligatorios;
- no se selecciono fecha u hora;
- el horario ya esta ocupado;
- no se subio comprobante de pago.

Solucion:

- completar todos los campos;
- elegir otro horario;
- subir una imagen valida del comprobante.

### 24.4 La camara no funciona en el Analizador Facial

Posibles causas:

- el navegador no tiene permiso de camara;
- otra aplicacion esta usando la camara;
- el dispositivo no tiene camara disponible;
- los modelos de IA no cargaron correctamente.

Solucion:

- permitir el acceso a la camara;
- cerrar otras aplicaciones que usen la camara;
- recargar la pagina;
- usar un navegador actualizado.

### 24.5 No se puede subir una imagen

Posibles causas:

- el archivo no es una imagen;
- el archivo supera el tamano permitido;
- el servidor no tiene acceso a la carpeta de subida.

Solucion:

- usar archivos JPG, JPEG, PNG o WebP;
- reducir el peso de la imagen;
- verificar la configuracion del servidor.

---

## 25. Buenas Practicas de Seguridad

- No compartir las credenciales del administrador.
- Crear contrasenas diferentes para cada barbero.
- Cerrar sesion despues de usar el panel.
- No subir imagenes sensibles o ajenas al negocio.
- Revisar manualmente los comprobantes antes de confirmar reservas.
- Mantener protegidas las variables de entorno del servidor.

---

## 26. Glosario

- **Reserva:** cita registrada por un cliente.
- **Barbero:** usuario profesional que atiende citas.
- **Administrador:** usuario con permisos completos de gestion.
- **Comprobante:** imagen que demuestra el pago realizado.
- **Nequi:** medio de pago digital usado por el sistema.
- **IA:** inteligencia artificial.
- **Dashboard:** vista principal de control administrativo.
- **Galeria:** seccion donde se muestran imagenes de trabajos realizados.
- **Estado de pago:** condicion actual del pago de una reserva.
- **Estado de reserva:** condicion operativa de una cita.

---

## 27. Conclusiones

Infinity Barber ofrece una experiencia digital organizada para clientes, administradores y barberos. El cliente puede consultar informacion y reservar con validacion de disponibilidad; el administrador puede controlar la operacion del negocio; y el barbero puede revisar su agenda personal de manera segura.

Este manual permite comprender el flujo general del sistema y sirve como guia de apoyo para el uso diario de la plataforma.

---

## 28. Anexos

### 28.1 Rutas principales

```text
/                 Pagina principal
/servicios        Servicios
/equipo           Equipo de barberos
/galeria          Galeria
/reserva          Formulario de reserva
/ia-barber        Analizador facial con IA
/admin/login      Login de administrador
/admin            Panel de administrador
/barber/login     Login de barbero
/barber           Panel de barbero
```

### 28.2 Flujo resumido del cliente

```text
Ingresar al sitio -> Consultar servicios -> Elegir barbero -> Seleccionar fecha y hora -> Pagar por Nequi -> Subir comprobante -> Confirmar reserva
```

### 28.3 Flujo resumido del administrador

```text
Iniciar sesion -> Revisar reservas -> Verificar pagos -> Confirmar o editar citas -> Gestionar servicios, equipo y galeria
```

### 28.4 Flujo resumido del barbero

```text
Iniciar sesion -> Consultar agenda de hoy -> Revisar proximas reservas -> Cerrar sesion
```
