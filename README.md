# 📚 Guía de Configuración PoliRank Backend

Una guía completa para configurar y ejecutar el servidor PoliRank Backend localmente




## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

### Software Necesario
- **Node.js** (versión 16 o superior) - [Descargar](https://nodejs.org/)
- **npm** (viene con Node.js)
- **PostgreSQL** (versión 12 o superior) - [Descargar](https://www.postgresql.org/download/)
- **Git** (para clonar el repositorio) - [Descargar](https://git-scm.com/)


### Verificar Instalación
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version
```

---

## 📦 Instalación de Dependencias

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/alex43x/polirank-backend.git
cd polirank-backend
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

Este comando instalará todas las dependencias necesarias listadas en `package.json`:
- **express** - Framework web
- **sequelize** - ORM para PostgreSQL
- **pg** - Driver de PostgreSQL
- **cors** - Manejo de CORS
- **dotenv** - Gestión de variables de entorno
- **bcrypt** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación con JWT
- **swagger-ui-express** - Interfaz Swagger
- **morgan** - Logger HTTP
- **nodemon** (dev) - Reinicio automático en desarrollo

---

## ⚙️ Variables de Entorno

### Paso 1: Crear Archivo `.env`

En la raíz del proyecto, crea un archivo llamado `.env`:

```bash
touch .env
```

### Paso 2: Configurar Variables

Abre `.env` y añade las siguientes variables según tu configuración:

#### Para Desarrollo Local (PostgreSQL Local)
```env
# Base de Datos
PG_USER=postgres
PG_PASSWORD=tu_contraseña_postgres
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=polirank

# Servidor
PORT=3000
NODE_ENV=development

# JWT (Cambiar por valores seguros en producción)
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
JWT_EXPIRATION=24h
```

---

## 🚀 Ejecución del Servidor


Este modo reinicia automáticamente el servidor cuando detecta cambios en los archivos.

```bash
npm run dev
```

**Salida esperada:**
```
> nodemon server.js

[nodemon] 3.1.11
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,json
[nodemon] starting `node server.js`
✅ Conexión a la base de datos establecida correctamente
✅ Modelos sincronizados con la base de datos
🚀 Servidor corriendo en puerto 3000
```

---

## 📖 Documentación Swagger

### Acceder a la Documentación

Una vez que el servidor esté corriendo, accede a:

```
http://localhost:3000/docs
```

Deberías ver una interfaz interactiva con toda la documentación de los endpoints.

La documentación se genera automáticamente en runtime al iniciar el servidor. No hay script ni archivo estático — los comentarios `@openapi` viven en cada archivo de rutas del módulo correspondiente.

---
## 🧪 Prueba Rápida de la API

### Verificar que el servidor está activo

```bash
curl http://localhost:3000/
```

Respuesta esperada:
```json
"Hello world"
```

---

## 📁 Estructura de Carpetas Explicada

```
src/
├── modules/
│   ├── auth/          # Login, perfil, creación de contraseña
│   ├── student/       # Gestión de alumnos
│   ├── course/        # Gestión de cursos
│   ├── review/        # Reviews de cursos
│   ├── tries/         # Intentos de materias
│   └── email/         # Servicio de emails 
├── shared/
│   ├── middlewares/   # auth, errorHandler, validate
│   ├── errors/        # AppError, clases de error, errorCodes
│   ├── permissions/   # permissionsMap, requirePermission, hasPermission
│   └── http/          # ApiResponse
├── config/            # db, env, logger, swagger
├── models/            # Modelos Sequelize compartidos
├── app.js
└── server.js
```

Cada módulo contiene: `controller`, `service`, `routes`, `validators`, `dto`.

- **controller** — parsea el request, llama al service, aplica DTO, responde
- **service** — toda la lógica de negocio y queries Sequelize
- **validators** — validación de formato con `express-validator`
- **dto** — transforma el modelo Sequelize en la shape que recibe el cliente



## 📚 Recursos Adicionales

- [Documentación de Express.js](https://expressjs.com/)
- [Documentación de Sequelize](https://sequelize.org/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) - Explicación de JWT
- [Swagger/OpenAPI](https://swagger.io/)

---


**Última actualización:** 20 de abril de 2026

**Versión del Backend:** 2.0.0

