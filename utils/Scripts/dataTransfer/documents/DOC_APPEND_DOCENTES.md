## 📋 Tabla de Contenidos

1. [appendDocs.py - Inserción de Docentes](#appenddocspy---inserción-de-docentes)

---

## appendDocs.py - Inserción de Docentes

### Objetivo del Módulo

El módulo `appendDocs.py` se encarga de procesar e insertar información de docentes desde archivos Excel a la base de datos PostgreSQL. Implementa lógica avanzada para:

- Normalización y formateo de nombres
- Generación automática de correos genéricos
- Detección y consolidación de duplicados
- Actualización inteligente de correos existentes

### Función Principal

#### `insertDoc(connection, intoData)`

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `connection` | `psycopg2.connection` | Conexión activa a PostgreSQL |
| `intoData` | `list[list]` | Lista de filas del Excel. Cada fila contiene `[apellidos, nombres, correos]` |

**Retorno:** `None` (efectos secundarios en BD)

### Lógica de Procesamiento

#### Fase 1: Extracción y Limpieza de Datos

```python
# Para cada fila del Excel:
raw_ap = str(reg[0]).strip()      # Apellidos
raw_nom = str(reg[1]).strip()      # Nombres
raw_cor = str(reg[2]).strip()       # Correos
```

**Características:**
- Soporta múltiples docentes por fila (separados por `\n`)
- Normaliza espacios en blanco
- Maneja valores `None` o vacíos

**Ejemplo de entrada:**
```
Fila Excel: ["González\nPérez", "Juan\nMaría", "juan@pol.una.py\n"]
Resultado: 2 docentes procesados
```

#### Fase 2: Formateo de Nombres

Utiliza `formatDoc()` de `helpFunctions.py`:

```python
nom_app = formatDoc(nom_final, ap_final)
# Resultado: "Juan Carlos González"
```

**Reglas:**
- Combina nombre completo + apellido completo
- Normaliza espacios múltiples
- Valida que ambos campos no estén vacíos

#### Fase 3: Generación de Correos Genéricos

**Cuando:** Un docente no tiene correo electrónico

**Algoritmo:**
1. Normaliza el nombre (quita tildes, minúsculas)
2. Extrae primer nombre y primer apellido
3. Genera formato: `primer_nombre.primer_apellido@pol.una.py`
4. Si existe, agrega sufijo numérico: `primer_nombre.primer_apellido2@pol.una.py`

**Ejemplo:**
```
Nombre: "Juan Carlos González"
Correo generado: "juan.gonzalez@pol.una.py"
Si existe: "juan.gonzalez2@pol.una.py"
```

#### Fase 4: Detección de Duplicados Internos

**Algoritmo:**
1. Extrae nombre clave (primer nombre + primer apellido normalizado)
2. Compara con nombres ya vistos usando `nombres_similares()`
3. Si encuentra duplicado, consolida automáticamente

**Reglas de Consolidación:**
- Prioriza correo institucional (`@pol.una.py`)
- Mantiene el primer registro encontrado
- Omite los duplicados

**Ejemplo:**
```
Registro 1: "Juan González" - "juan.gonzalez@pol.una.py"
Registro 2: "Juan González" - "juan.gonzalez@gmail.com"
Resultado: Se mantiene el primero (correo institucional)
```

#### Fase 5: Verificación contra Base de Datos

**Estrategia de Búsqueda:**

1. **Por correo (prioritario):**
   ```python
   if correo in correos_existentes:
       es_duplicado = True
   ```

2. **Por nombre normalizado (fallback):**
   ```python
   nombre_normalizado = normalizar_nombre_comparacion(nombre)
   if nombre_normalizado in nombres_normalizados_bd:
       if nombres_similares(nombre, nombre_bd):
           es_duplicado = True
   ```

**Actualización Inteligente:**
- Si el docente existente tiene correo genérico y el nuevo tiene institucional → **actualiza**
- Si el docente existente no tiene correo y el nuevo sí → **actualiza**
- Si ambos tienen correo → **omite** (no duplica)

#### Fase 6: Inserción Masiva

```sql
INSERT INTO docentes (nombre, correo)
VALUES %s
ON CONFLICT (correo) DO NOTHING
RETURNING id, nombre, correo;
```

**Características:**
- Usa `execute_values()` para inserción masiva (100 registros por batch)
- `ON CONFLICT` previene duplicados por correo
- Retorna IDs de registros insertados

### Tablas de PostgreSQL Afectadas

| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `docentes` | `INSERT` | Inserta nuevos docentes |
| `docentes` | `UPDATE` | Actualiza correos de docentes existentes |
| `docentes` | `SELECT` | Consulta docentes existentes para validación |

### Estadísticas Generadas

El módulo genera reportes detallados:

```
📊 ESTADÍSTICAS PRELIMINARES:
   • Filas totales en Excel: 150
   • Docentes procesados: 145
   • Docentes sin correo: 12

📧 DOCENTES CON CORREO GENÉRICO GENERADO (12):
   • Juan Carlos González
     └─ juan.gonzalez@pol.una.py

📊 RESUMEN DE CONSOLIDACIONES AUTOMÁTICAS:
   • Se filtraron automáticamente 5 duplicados

✅ INSERCIÓN FINALIZADA:
   • Registros intentados: 140
   • Registros insertados: 135 ✅
   • Registros omitidos (duplicados en BD): 5 ⚠️
```

---