# Sistema de Transferencia de Datos V2 — Manual de Usuario

## Descripción

El **DataTransfer V2** es una herramienta de línea de comandos para importar datos académicos desde archivos Excel a la base de datos PostgreSQL de PoliRank. Permite cargar **docentes, asignaturas, secciones, cursos y mallas curriculares** de forma incremental y segura.

---

## Requisitos Previos

| Requisito | Versión |
|---|---|
| Python | 3.10 o superior |
| PostgreSQL | Corriendo y accesible |

### Instalar dependencias

Desde la carpeta `utils/Scripts/dataTransfer_v2/`:

```bash
pip install -r requirements.txt
```

### Variables de entorno

El script lee automáticamente el archivo `.env` ubicado en la raíz del proyecto (`polirank-backend/.env`). Debe contener:

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=tu_contraseña
```

---

## Ejecución

Desde la raíz del proyecto:

```powershell
cd utils/Scripts/dataTransfer_v2
python cli/menu.py
```

Se mostrará el menú principal:

```
===================================
   SISTEMA DE GESTIÓN (V2)
===================================
[1] Dry-Run (Solo Validar)
[2] Importar Asignaturas
[3] Importar Docentes
[4] Importar Secciones y Cursos
[5] Importar Malla Curricular
[0] Salir
===================================
```

---

## Flujo de Importación Recomendado

El orden importa, ya que cada paso depende del anterior:

```
1. Dry-Run  →  2. Asignaturas  →  3. Docentes  →  4. Secciones y Cursos  →  5. Malla
```

> **IMPORTANTE:** Las tablas `departamentos` y `carreras` deben tener datos **antes** de comenzar la importación.

---

## Opciones del Menú

### [1] Dry-Run (Solo Validar)

Analiza el archivo Excel **sin insertar nada** en la base de datos. Útil para detectar errores antes de comprometer datos.

**Qué detecta:**
- Docentes con nombre o apellido incompleto
- Posibles duplicados de docentes (por similitud de nombre ≥ 92%)
- Asignaturas con departamento inválido o desconocido
- Asignaturas duplicadas dentro del archivo

**Archivo Excel requerido:** Archivo de horarios (mismo formato que Opciones 2, 3 y 4)

---

### [2] Importar Asignaturas

Importa materias académicas y las vincula a su departamento.

**Columnas del Excel utilizadas:**
| Columna Excel | Nombre Interno |
|---|---|
| `DPTO.` | departamento |
| `Asignatura` | asignatura |

**Comportamiento:**
- El nombre de la materia se **normaliza** automáticamente (corrige typos, convierte números a romanos: "Software 1" → "Software I")
- El departamento se valida contra la tabla `departamentos` por sus **siglas** (en mayúsculas)
- Omite asignaturas cuyo departamento no se encuentre en la BD
- Omite duplicados (misma asignatura + mismo departamento)

---

### [3] Importar Docentes

Importa profesores y sus correos electrónicos.

**Columnas del Excel utilizadas:**
| Columna Excel | Nombre Interno |
|---|---|
| `Apellido` | apellido_docente |
| `Nombre` | nombre_docente |
| `Correo Institucional` | correo_docente |

**Comportamiento:**
- Si el docente **no tiene correo** en el Excel, el sistema genera uno ficticio con el dominio `@noemail.pol.una.py` (ej: `juan.perez@noemail.pol.una.py`) para poder registrarlo.
- Si el docente **ya existe en la BD** con un correo generado (`@noemail.pol.una.py`) y ahora aparece en el Excel con un **correo real** (`@pol.una.py`), el sistema actualiza automáticamente su correo.
- Los duplicados (por nombre normalizado) se omiten.
- Si dos docentes generarían el mismo correo genérico, se resuelve la colisión agregando un sufijo numérico (`juan.perez2@noemail.pol.una.py`).

**Estadísticas reportadas al finalizar:**
- `procesados`: Total de filas con datos válidos
- `insertados`: Docentes nuevos insertados
- `omitidos_duplicados`: Docentes ya existentes en BD (sin cambios)
- `correos_generados`: Correos ficticios creados
- `institucionales`: Correos reales usados directamente
- `correos_actualizados`: Correos ficticios reemplazados por correos reales

---

### [4] Importar Secciones y Cursos

Crea las secciones (par docente + asignatura) y los cursos (sección + año + periodo).

**Columnas del Excel utilizadas:**
| Columna Excel | Nombre Interno |
|---|---|
| `Asignatura` | asignatura |
| `DPTO.` | departamento |
| `Apellido` | apellido_docente |
| `Nombre` | nombre_docente |
| `Correo Institucional` | correo_docente |

**Datos adicionales solicitados por consola:**
- Año académico (ej: 2026)
- Periodo (1 o 2)

**Comportamiento:**
- Busca la asignatura por nombre normalizado (debe existir en la BD)
- Busca el docente por correo, luego por nombre completo, luego por correo genérico
- Si no encuentra la asignatura o el docente, omite esa fila
- Crea la sección solo si la combinación (docente + asignatura) no existe ya

> **Prerequisito:** Las asignaturas (Opción 2) y los docentes (Opción 3) deben estar cargados antes.

---

### [5] Importar Malla Curricular

Vincula asignaturas con carreras y semestres.

**Formato del archivo Excel:** Diferente al resto. Usa un archivo con estructura propia:
- **Header en fila 1**
- **Columna A (índice 0):** Nombre de la asignatura
- **Columna B (índice 1):** Sigla de la carrera (ej: IIN, ISP, IAE)
- **Columna C (índice 2):** Número de semestre

**Comportamiento:**
- Busca la asignatura por nombre (normalizado) en la BD
- Busca la carrera por su nombre en mayúsculas
- Omite filas cuya asignatura o carrera no exista en la BD
- Omite combinaciones (carrera + asignatura + semestre) ya existentes

> **Prerequisito:** Las asignaturas deben estar cargadas. Las carreras deben existir en `carreras`.

---

## Estructura del Archivo de Horarios (Opciones 1-4)

El archivo Excel de horarios tiene la siguiente estructura:

- Las primeras **10 filas** son encabezados/información general
- La **fila 11** contiene los nombres de las columnas (header real)
- Los datos comienzan en la **fila 12**
- Cada hoja del archivo corresponde a una carrera (IIN, ISP, IAE, etc.)

**Columnas esperadas en la fila 11:**

| DPTO. | Asignatura | Nivel | Sem/Grupo | Sigla carrera | Turno | Sección | Tít | Apellido | Nombre | Correo Institucional |

---

## Configuración Avanzada

El archivo `config/column_mapping.json` controla:

- **`hojas_carreras`**: Lista de nombres de hojas de carrera válidas
- **`hojas_ignorar`**: Hojas que se ignorarán (homologaciones, códigos)
- **`fila_header`**: Índice de la fila de encabezado (10 = fila 11 en Excel)
- **`columnas`**: Mapeo de nombres internos a nombres de columnas del Excel

Si los nombres de columnas de tu archivo Excel no coinciden, edita este archivo.

---

## Solución de Problemas

| Error | Causa | Solución |
|---|---|---|
| `Error al conectar a la BD` | PostgreSQL no corre o credenciales incorrectas | Verificar `.env` y que PostgreSQL esté activo |
| `No se encontraron hojas de carreras` | El archivo no tiene hojas con los nombres configurados | Verificar `column_mapping.json` o las hojas del Excel |
| `Columnas no encontradas` | Los encabezados del Excel no coinciden con el mapping | Revisar que la fila 11 tenga exactamente los nombres esperados |
| `Departamento desconocido` | La sigla del depto. no existe en la tabla `departamentos` | Verificar que la tabla `departamentos` tiene los datos base |
| `Asignatura no encontrada` (Opción 4) | La materia no fue importada antes | Ejecutar primero la Opción 2 |
| `Docente no encontrado` (Opción 4) | El docente no fue importado antes | Ejecutar primero la Opción 3 |

---

*Última actualización: Mayo 2026*
