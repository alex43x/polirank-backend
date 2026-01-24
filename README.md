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

### Generar Documentación Swagger

Si has añadido nuevos endpoints, regenera la documentación:

```bash
node swagger.js
```

Este comando:
1. Lee todos tus archivos de rutas
2. Escanea los comentarios JSDoc
3. Genera `swagger_output.json`
4. Actualiza la documentación

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
polirank-backend/
├── controllers/        # Lógica de negocio para cada entidad
│   ├── authController.js
│   ├── studentController.js
│   ├── courseController.js
│   └── ...
├── routes/            # Definición de rutas y endpoints
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   └── ...
├── models/            # Modelos Sequelize (tablas de BD)
│   ├── studentModel.js
│   ├── courseModel.js
│   └── ...
├── middlewares/       # Middlewares (autenticación, roles, etc)
│   ├── auth.js
│   ├── role.js
│   └── errorHandler.js
├── db/                # Configuración de base de datos
│   ├── connection.js  # Conexión a PostgreSQL
│   └── pool.js
├── utils/             # Utilidades (scripts, funciones comunes)
│   └── Scripts/
│       ├── app.py
│       └── funciones.py
├── .env               # Variables de entorno (NO commitear)
├── .gitignore         # Archivos a ignorar en git
├── app.js             # Configuración de Express
├── server.js          # Punto de entrada
├── swagger.js         # Configuración de Swagger
├── swagger_output.json # Documentación Swagger generada
├── package.json       # Dependencias del proyecto
└── README.md          # Este archivo
```



## 📚 Recursos Adicionales

- [Documentación de Express.js](https://expressjs.com/)
- [Documentación de Sequelize](https://sequelize.org/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) - Explicación de JWT
- [Swagger/OpenAPI](https://swagger.io/)

---


**Última actualización:** 10 de enero de 2026

**Versión del Backend:** 1.0.0

