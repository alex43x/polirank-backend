# Documentación del Módulo: Buscador de Usuarios (searchUsers.py)

Este módulo se encarga de conectar con la API de Google Workspace (People API) para extraer, filtrar y exportar información de usuarios basándose en sus direcciones asociadas. Es utilizado principalmente para generar reportes de alumnos de carreras específicas.

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Flujo de Ejecución](#flujo-de-ejecución)
3. [Configuración de Credenciales (OAuth2)](#configuración-de-credenciales-oauth2)
4. [Configuración General](#configuración-general)
5. [Lógica de Filtrado](#lógica-de-filtrado)
6. [Salida](#salida)

---

## Descripción General

El script `searchUsers.py` automatiza la extracción masiva de usuarios del directorio del dominio. Su objetivo principal es identificar usuarios que pertenecen a ciertas carreras (definidas como "IIN", "LCIK") analizando el campo de dirección de sus perfiles.

**Función Principal:** `usersImport()`

---

## Flujo de Ejecución

1. **Autenticación OAuth2**:
   - Busca `token.json` para credenciales cacheadas.
   - Si no existe o expiró, utiliza `credentials.json` para iniciar el flujo de autenticación en navegador.
   - *Nota*: Requiere la carpeta `config/` en la raíz del proyecto.

2. **Escaneo del Directorio**:
   - Utiliza `people.listDirectoryPeople` para iterar sobre TODOS los perfiles del dominio.
   - **Campos solicitados**: `names`, `emailAddresses`, `addresses`, `externalIds`.
   - **Paginación**: Procesa bloques de 1000 usuarios por petición.

3. **Filtrado en Memoria**:
   - Por cada usuario, revisa si tiene direcciones (`addresses`).
   - Verifica si alguna dirección contiene las siglas objetivo (ej. "IIN", "LCIK").

4. **Exportación**:
   - Abre un diálogo de guardado de archivo (Tkinter) para que el usuario elija dónde guardar el reporte.
   - Genera un archivo Excel (`.xlsx`) con los resultados.

---

---

## Configuración de Credenciales (OAuth2)

Para que el script funcione, es necesario configurar un proyecto en Google Cloud y obtener las credenciales.

### Paso 1: Crear Proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (ej: "Importador-Alumnos").
3. Selecciona el proyecto recién creado.

### Paso 2: Habilitar APIs
1. En el menú lateral, ve a **APIs y servicios > Biblioteca**.
2. Busca y habilita las siguientes APIs:
   - **Google People API** (para leer perfiles).
   - **Admin SDK API** (para acceder al directorio del dominio).

### Paso 3: Pantalla de Consentimiento
1. Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**.
2. Selecciona **Interno** (solo usuarios de tu organización) o **Externo**.
3. Rellena los campos obligatorios (Nombre de la App, Correos de soporte).
4. En **Alcances (Scopes)**, asegúrate de agregar permisos de lectura de directorio si es necesario, aunque el script solicita los scopes automáticamente.

### Paso 4: Crear Credenciales
1. Ve a **APIs y servicios > Credenciales**.
2. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente de OAuth**.
3. En tipo de aplicación, selecciona **App de escritorio**.
4. Ponle un nombre (ej: "Script Python").
5. Al crearla, descarga el archivo JSON.

### Paso 5: Instalación
1. Renombra el archivo descargado a `credentials.json`.
2. Mueve el archivo a la carpeta `config/` dentro de la raíz del proyecto.
   - Ruta final esperada: `.../polirank-backend/config/credentials.json`

### Paso 6: Primera Ejecución
1. La primera vez que ejecutes el script, se abrirá automáticamente una ventana del navegador.
2. Inicia sesión con la cuenta de Google que tiene permisos de administrador o acceso al directorio.
3. Concede los permisos solicitados.
4. Se generará automáticamente un archivo `token.json` en la carpeta `config/`. **No borres este archivo**, guarda tu sesión.

---

## Configuración General

### Dependencias Google
Requiere las siguientes librerías:
- `google-auth`
- `google-api-python-client`

### Constantes Importantes
En el código fuente se definen:
- **SCOPES**: `['https://www.googleapis.com/auth/directory.readonly']`
- **CARRERAS_OBJETIVO**: `["IIN", "LCIK"]` (Lista de siglas a buscar en las direcciones)

---

## Lógica de Filtrado

El filtro es **inclusivo** (OR). Un usuario es seleccionado si su dirección contiene **al menos una** de las siglas configuradas.

**Ejemplo:**
- Dirección: "Alumno de IIN - Semestre 1" -> ✅ **Seleccionado** (Contiene "IIN")
- Dirección: "Docente LCIK Time Completo" -> ✅ **Seleccionado** (Contiene "LCIK")
- Dirección: "Administrativo Central" -> ❌ **Ignorado**

---

## Salida

El módulo genera un archivo Excel con las siguientes columnas:

| Columna           | Descripción |
| ----------------- | ----------- |
| `Nombre Completo` | Nombre mostrable del perfil de Google |
| `Email`           | Correo electrónico principal |
| `ID Empleado`     | ID externo (si existe), usualmente Cédula o ID de alumno |
| `Carrera Detectada`| El valor de la dirección que causó el "match" |

---
