# DataTransfer V2 — Contexto Técnico para Agentes de IA

## Propósito

Este documento describe la arquitectura, lógica de negocio y decisiones de diseño del sistema `dataTransfer_v2`, ubicado en `utils/Scripts/dataTransfer_v2/` dentro del repositorio `polirank-backend`. Está pensado para ser leído por una IA que necesite entender, mantener o extender este sistema.

---

## Ubicación y Contexto del Proyecto

```
polirank-backend/
├── .env                          ← Variables de entorno (PG_HOST, PG_USER, etc.)
├── models/                       ← Modelos Sequelize del backend Node.js
└── utils/Scripts/
    ├── dataTransfer/             ← Versión 1 (legacy, NO modificar)
    └── dataTransfer_v2/          ← Este sistema (activo)
```

El backend principal es **Node.js + Sequelize + PostgreSQL**. El `dataTransfer_v2` es un script **Python independiente** que accede directamente a la misma base de datos via `psycopg2`.

---

## Arquitectura (Clean Architecture)

```
dataTransfer_v2/
├── cli/
│   └── menu.py              ← Punto de entrada. Menú interactivo.
├── config/
│   ├── settings.py          ← Lee .env, expone DB_CONFIG
│   └── column_mapping.json  ← Mapeo columnas Excel ↔ nombres internos
├── core/
│   ├── models.py            ← Dataclasses: Docente, Asignatura, Seccion, Curso, Malla
│   ├── interfaces.py        ← ABCs: IDocenteRepository, IAsignaturaRepository, etc.
│   ├── exceptions.py        ← DataTransferError, ConfigError, DatabaseConnectionError
│   └── normalizers.py       ← Funciones puras de normalización y helpers
├── adapters/
│   ├── db/
│   │   ├── db_connection.py         ← Singleton pool de conexiones psycopg2
│   │   ├── docente_repository.py    ← Implementa IDocenteRepository
│   │   ├── asignatura_repository.py ← Implementa IAsignaturaRepository
│   │   ├── seccion_repository.py    ← Implementa ISeccionRepository
│   │   ├── curso_repository.py      ← Implementa ICursoRepository
│   │   ├── malla_repository.py      ← Implementa IMallaRepository
│   │   └── usuario_repository.py    ← Implementa IUsuarioRepository (no usado en menú aún)
│   └── excel/
│       └── excel_parser.py          ← Lectura y extracción de DataFrames desde Excel
└── services/
    ├── docente_service.py      ← Lógica de importación de docentes
    ├── asignatura_service.py   ← Lógica de importación de asignaturas
    ├── seccion_service.py      ← Lógica de creación de secciones y cursos
    ├── malla_service.py        ← Lógica de importación de malla curricular
    ├── validation_service.py   ← Dry-run: valida sin insertar
    └── usuario_service.py      ← Importación de alumnos (no expuesto en menú aún)
```

---

## Modelos de Datos (`core/models.py`)

```python
@dataclass
class Docente:
    nombre: str
    apellido: str
    id: Optional[int] = None
    correo: Optional[str] = None              # Correo generado (@noemail.pol.una.py)
    correo_institucional: Optional[str] = None # Correo real (@pol.una.py)
    nombre_normalizado: str                    # Generado automáticamente en __post_init__

    @property
    def correo_efectivo(self) -> str:
        # Prioriza correo_institucional. Si no, usa correo (generado).

@dataclass
class Asignatura:
    titulo: str
    id: Optional[int] = None
    departamento: Optional[str] = None  # Sigla del depto (ej: "IIN")
    depto_id: Optional[int] = None
    titulo_normalizado: str             # Generado en __post_init__

@dataclass
class Seccion:
    docente_id: int
    asignatura_id: int

@dataclass
class Curso:
    seccion_id: int
    anio: int
    periodo: int

@dataclass
class Malla:
    asignatura_id: int
    carrera_id: int
    semestre: int
```

---

## Esquema de Base de Datos (tablas relevantes)

```sql
-- Tablas de referencia (NO modificadas por el script, deben pre-existir)
CREATE TABLE departamentos (id SERIAL PRIMARY KEY, siglas TEXT, nombre TEXT);
CREATE TABLE carreras (id SERIAL PRIMARY KEY, nombre TEXT);

-- Tablas que el script popula
CREATE TABLE docentes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE  -- Constraint crítico para deduplicación
);

CREATE TABLE asignaturas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    depto INTEGER NOT NULL REFERENCES departamentos(id),
    UNIQUE (nombre, depto)  -- Constraint: uq_asignatura_dpto
);

CREATE TABLE secciones (
    id SERIAL PRIMARY KEY,
    docente INTEGER REFERENCES docentes(id),
    asignatura INTEGER REFERENCES asignaturas(id),
    UNIQUE (docente, asignatura)
);

CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    seccion INTEGER REFERENCES secciones(id),
    year INTEGER,
    periodo INTEGER,
    UNIQUE (seccion, year, periodo)
);

CREATE TABLE malla (
    id SERIAL PRIMARY KEY,
    carrera INTEGER REFERENCES carreras(id),
    asignatura INTEGER REFERENCES asignaturas(id),
    semestre INTEGER,
    UNIQUE (carrera, asignatura, semestre)
);
```

---

## Sistema de Correos: Diseño Crítico

### El Problema
La tabla `docentes` requiere `correo NOT NULL UNIQUE`. Muchos docentes en el Excel no tienen correo electrónico. Además, es necesario poder diferenciar correos reales de los generados para implementar la actualización cuando el docente reaparece con correo real.

### La Solución: Dominio Ficticio
| Tipo | Dominio | Ejemplo |
|---|---|---|
| Real (institucional) | `@pol.una.py` | `j.perez@pol.una.py` |
| Generado (ficticio) | `@noemail.pol.una.py` | `juan.perez@noemail.pol.una.py` |

**Funciones clave en `core/normalizers.py`:**
```python
DOMINIO_GENERADO = "noemail.pol.una.py"

def generar_correo_generico(nombre, apellido) -> str:
    # Genera "primernombre.ultimoapellido@noemail.pol.una.py"

def es_correo_institucional(correo) -> bool:
    # True si termina en @pol.una.py Y NO termina en @noemail.pol.una.py

def es_correo_generado(correo) -> bool:
    # True si termina en @noemail.pol.una.py
```

### Flujo de Actualización de Correo
```
Docente en BD con correo generado (@noemail.pol.una.py)
    + Docente reaparece en Excel con correo real (@pol.una.py)
    → DocenteService llama repo.actualizar_correo(id, correo_real)
    → UPDATE docentes SET correo = %s WHERE id = %s
```

---

## ExcelParser: Dos Modos de Lectura

### Modo Normal (Opciones 1-4: horarios)
```python
# Header en fila 11 (índice 10)
pd.read_excel(archivo, sheet_name=hoja, header=10, dtype=str)
```
Columnas identificadas por **nombre** según `column_mapping.json`:
- `DPTO.` → `departamento`
- `Asignatura` → `asignatura`
- `Apellido` → `apellido_docente`
- `Nombre` → `nombre_docente`
- `Correo Institucional` → `correo_docente`

### Modo Malla (Opción 5)
```python
# Header en fila 1 (índice 0)
pd.read_excel(archivo, sheet_name=hoja, header=0, dtype=str)
# Columnas por posición:
df.iloc[:, 0]  # Asignatura
df.iloc[:, 1]  # Sigla carrera
df.iloc[:, 2]  # Semestre
```

### Listado de Hojas
`listar_hojas_carreras()` retorna todas las hojas del Excel **excepto** las listadas en `hojas_ignorar` del JSON de configuración. Ya no filtra por `hojas_carreras` (el filtro fue eliminado para mayor flexibilidad).

---

## Flujo Completo de Importación de Docentes

```
ExcelParser.get_docentes() → DataFrame[apellido_docente, nombre_docente, correo_docente]
    ↓
DocenteService.importar(df)
    ↓ por cada fila:
    1. Omitir si apellido Y nombre están vacíos
    2. Buscar en BD por nombre normalizado (exact match, case-insensitive)
    3a. Si EXISTE en BD:
        - Si su correo es @noemail.pol.una.py Y la fila trae correo real:
            → repo.actualizar_correo(id, correo_real)  [UPDATE]
        - Else:
            → omitir (stat: omitidos_duplicados)
        - continue (nunca se inserta)
    3b. Si NO EXISTE en BD:
        - Si correo real → usarlo
        - Si no hay correo real → generar correo con @noemail.pol.una.py
            → resolver colisiones con sufijo numérico
        → agregar a lista docentes_nuevos
    4. repo.insertar_bulk(docentes_nuevos)
        → INSERT INTO docentes (nombre, correo) VALUES %s ON CONFLICT (correo) DO NOTHING
```

---

## Flujo de Importación de Secciones y Cursos

```
ExcelParser.get_secciones() → DataFrame[asignatura, departamento, apellido_docente, nombre_docente, correo_docente]
    ↓
SeccionService.importar(df, anio, periodo)
    ↓ por cada fila:
    1. Omitir si asignatura vacía
    2. Buscar asignatura por título normalizado en BD
       → Si no existe: omitir (stat: omitidas_asig_no_encontrada)
    3. Buscar docente:
       a. Por correo (si existe en la fila)
       b. Por nombre completo normalizado
       c. Por correo genérico generado a partir del nombre
       → Si no existe: omitir (stat: omitidas_doc_no_encontrado)
    4. Agregar Seccion(docente_id, asignatura_id) a lista
    ↓ al final:
    5. repo.insertar_bulk_and_return_ids(secciones)
       → INSERT ON CONFLICT (docente, asignatura) DO NOTHING RETURNING id, docente, asignatura
    6. Para cada seccion_id devuelto:
       → crear Curso(seccion_id, anio, periodo)
    7. cur_repo.insertar_bulk(cursos)
       → INSERT ON CONFLICT (seccion, year, periodo) DO NOTHING
```

---

## `column_mapping.json` — Referencia Completa

```json
{
    "hojas_carreras": ["IAE", "ICM", "IEK", ...],   // Informativo, ya no filtra
    "fila_header": 10,                                // = fila 11 en Excel
    "columnas": {
        "departamento":    "DPTO.",
        "asignatura":      "Asignatura",
        "nivel":           "Nivel",
        "semestre":        "Sem/Grupo",
        "sigla_carrera":   "Sigla carrera",
        "turno":           "Turno",
        "seccion":         "Sección",
        "titulo_docente":  "Tít",
        "apellido_docente":"Apellido",
        "nombre_docente":  "Nombre",
        "correo_docente":  "Correo Institucional"
    },
    "hojas_ignorar": ["Códigos", "Asignaturas Homólogas-DCB", ...]
}
```

---

## Normalización de Asignaturas (`normalizar_titulo_asignatura`)

- Elimina texto entre paréntesis o corchetes
- Corrige typos conocidos (`sotfware` → `Software`, `datamining` → `Data Mining`)
- Convierte números ordinales a romanos (`Software 1` → `Software I`)
- Limpia guiones pegados a números romanos

---

## Pool de Conexiones (`DatabasePool`)

Singleton con `psycopg2.pool.SimpleConnectionPool(min=1, max=10)`.
Cada repositorio obtiene una conexión mediante `contextmanager`:
```python
with self._db.connection() as conn:
    # auto-commit al salir, auto-rollback en excepción
```

---

## Variables de Entorno

Leídas desde `polirank-backend/.env` (4 niveles arriba de `config/`):

| Variable | Descripción |
|---|---|
| `PG_HOST` | Host de PostgreSQL |
| `PG_PORT` | Puerto (default: 5432) |
| `PG_DATABASE` | Nombre de la base de datos |
| `PG_USER` | Usuario de PostgreSQL |
| `PG_PASSWORD` | Contraseña |

---

## Bugs Conocidos y Decisiones de Diseño

| Tema | Decisión |
|---|---|
| `%` en SQL con psycopg2 | Escapar como `%%` en strings con `LIKE` dentro de `execute_values` |
| `CardinalityViolation` en bulk insert | Deduplicar correos en `correos_usados` antes del INSERT |
| Distinguir correos generados de reales | Usar dominio `@noemail.pol.una.py` (sin DB changes) |
| Malla con estructura diferente | `get_malla()` carga el Excel con `header=0` y accede por índice de columna |
| Hojas del Excel filtradas | El filtro por `hojas_carreras` fue eliminado; se muestran todas excepto `hojas_ignorar` |

---

*Versión documentada: Mayo 2026*
