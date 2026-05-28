# 💈 Infinity Barber - Gestión Inteligente de Barberías

Infinity Barber es una solución **full-stack** de última generación diseñada para digitalizar y potenciar la operación de barberías modernas. Combina una gestión administrativa sólida con herramientas de **Inteligencia Artificial** para ofrecer una experiencia premium tanto al cliente como al equipo de trabajo.

---

## ✨ Características Principales

*   🤖 **Asistente Virtual (Infinity):** Agendamiento conversacional y soporte mediante GPT-4o.
*   📸 **Analizador Facial IA:** Recomendación de cortes basada en la biometría facial del cliente.
*   📅 **Gestión de Reservas:** Sistema de citas con validación de disponibilidad en tiempo real.
*   📱 **Panel Multi-Rol:** Interfaces personalizadas para Administradores, Barberos y Clientes.
*   💳 **Control de Pagos:** Integración con Nequi mediante carga de capturas de pantalla y verificación manual.
*   🖼️ **Galería de Estilos:** Portafolio administrable para mostrar el trabajo del equipo.

---

## 🛠️ Tecnologías

### Frontend
- **React 19** + Vite
- **TypeScript**
- **Tailwind CSS** (Estética moderna y responsiva)
- **face-api.js** (Procesamiento de IA local)

### Backend
- **Node.js** + Express
- **SQLite** (Base de datos persistente)
- **GPT-4o (Inference AI)** para el asistente virtual.

---

## 🚀 Inicio Rápido

Requiere Node.js instalado.

```powershell
# Instalar dependencias del workspace
npm.cmd install

# Iniciar frontend y backend simultáneamente
npm.cmd start
```

---

## 🔐 Configuración (Variables de Entorno)

Crea tus archivos `.env` basándote en los archivos `.env.example` en las carpetas `barber/` y `barber/server/`.

Variables críticas:
- `GITHUB_TOKEN`: Necesario para el funcionamiento del Asistente IA.
- `JWT_SECRET`: Para la seguridad de las sesiones.
- `UPLOAD_DIR`: Ruta para persistencia de imágenes.

---

## 📜 Documentación Completa
Para una explicación detallada de la arquitectura, módulos y API, consulta la [Documentación del Proyecto](file:///c:/Users/USUARIO/Downloads/barber2/barber2/barber2/DOCUMENTACION_PROYECTO_INFINITY_BARBER.md).

---
*Desarrollado para el proyecto formativo SENA.*
