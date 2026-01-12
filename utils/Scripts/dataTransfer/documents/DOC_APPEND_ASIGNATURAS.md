# Documentación de Módulos de Inserción

## 📋 Tabla de Contenidos

1. [appendAsign.py - Inserción de Asignaturas](#appendasignpy---inserción-de-asignaturas)

## appendAsign.py - Inserción de Asignaturas

### Objetivo del Módulo

El módulo `appendAsign.py` procesa e inserta asignaturas desde archivos Excel, validando que pertenezcan a departamentos existentes y aplicando estandarización de nombres.

### Función Principal

#### `insertAsign(connection, raw_data)`

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `connection` | `psycopg2.connection` | Conexión activa a PostgreSQL |
| `raw_data` | `list[list]` | Lista de filas del Excel. Cada fila contiene `[departamento_sigla, nombre_asignatura]` |

**Retorno:** `None` (efectos secundarios en BD)

### Lógica de Procesamiento

#### Fase 1: Carga de Catálogo de Departamentos

```python
cursor.execute("SELECT siglas, id FROM departamentos")
mapa_dept = {fila[0].strip().upper(): fila[1] for fila in cursor.fetchall()}
```

**Características:**
- Carga todos los departamentos en memoria
- Normaliza siglas a mayúsculas para comparación
- Crea diccionario para búsqueda O(1)

**Ejemplo:**
```python
mapa_dept = {
    "ING. ELEC": 1,
    "ING. SIST": 2,
    "MAT": 3
}
```

#### Fase 2: Validación de Departamentos

```python
sigla_raw = str(item[0]).strip().upper()
id_dept = mapa_dept.get(sigla_raw)
if id_dept is None:
    errores_dpto.append(f"{sigla_raw} -> {nombre_raw}")
    continue
```

**Validación:**
- Comparación exacta (case-insensitive)
- Rechaza asignaturas con departamentos no válidos
- Reporta errores para revisión manual

#### Fase 3: Estandarización de Nombres

Utiliza `estandarizar_nombre_asignatura()` de `helpFunctions.py`:

**Transformaciones aplicadas:**

1. **Limpieza:**
   - Elimina patrones `(*)`
   - Normaliza espacios múltiples

2. **Corrección de Typos:**
   ```python
   correcciones = {
       "sotfware": "Software",
       "datamining": "Data Mining",
       "Tecnologia": "Tecnología"
   }
   ```

3. **Conversión de Números a Romanos:**
   ```
   "Software 1" → "Software I"
   "Electiva 3" → "Electiva III"
   ```

4. **Formato de Guiones:**
   ```
   "VII-" → "VII - "
   ```

**Ejemplo:**
```
Entrada:  "sotfware 1"
Salida:   "Software I"
```

#### Fase 4: Eliminación de Duplicados

```python
clave = (nombre_final, id_dept)
if clave not in asignaturas_unicas:
    asignaturas_unicas[clave] = (nombre_final, id_dept)
```

**Lógica:**
- Clave única: `(nombre_estandarizado, id_departamento)`
- Si la misma asignatura aparece múltiples veces en el Excel, se mantiene solo una
- Previene duplicados antes de la inserción

#### Fase 5: Inserción en Base de Datos

```sql
INSERT INTO asignaturas (nombre, dpto)
VALUES %s
ON CONFLICT (nombre, dpto) DO NOTHING
RETURNING id, nombre, dpto;
```

**Características:**
- Inserción masiva con `execute_values()`
- `ON CONFLICT` previene duplicados a nivel de BD
- Retorna IDs de asignaturas insertadas

### Tablas de PostgreSQL Afectadas

| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `asignaturas` | `INSERT` | Inserta nuevas asignaturas |
| `departamentos` | `SELECT` | Consulta departamentos para validación |

### Estadísticas Generadas

```
📊 ESTADÍSTICAS DE PROCESAMIENTO:
   • Filas procesadas: 200
   • Asignaturas únicas: 185
   • Filas omitidas (departamento desconocido): 10
   • Filas omitidas (datos vacíos): 5

✅ INSERCIÓN FINALIZADA:
   • Asignaturas intentadas: 185
   • Asignaturas insertadas: 150 ✅
   • Asignaturas omitidas (ya existían): 35 ⚠️
```

### Limitaciones Conocidas

1. **Búsqueda exacta de departamentos:**
   - No hay fuzzy matching
   - Requiere coincidencia exacta de siglas

2. **Estandarización limitada:**
   - Diccionario de correcciones es fijo
   - No detecta variaciones como "Base de Datos" vs "Bases de Datos"

---