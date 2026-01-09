# Script de Transferencia de Datos

Este script permite importar datos desde archivos Excel a la base de datos PostgreSQL.

## Configuración

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la **raíz del proyecto** (no en esta carpeta) con las siguientes variables:

```env
# ===== Base de datos PostgreSQL =====
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=polirankDB
DB_SCHEMA=polirank_test
DB_PORT=5432
```

**Nota:** El archivo `.env` debe estar en la raíz del proyecto para que el script pueda encontrarlo automáticamente.

### 3. Ejecutar el script

```bash
python app.py
```

## Variables de entorno requeridas

- `DB_HOST`: Host de PostgreSQL (por defecto: localhost)
- `DB_USER`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña del usuario
- `DB_NAME`: Nombre de la base de datos
- `DB_SCHEMA`: Schema de PostgreSQL a utilizar
- `DB_PORT`: Puerto de PostgreSQL (opcional, por defecto: 5432)

## Seguridad

⚠️ **IMPORTANTE:** El archivo `.env` contiene credenciales sensibles y **NO debe ser subido al repositorio**. Asegúrate de que esté en `.gitignore`.
