# Documentación de Módulos de Inserción

## 📋 Tabla de Contenidos

1. [appendSeccCur.py - Inserción de Secciones y Cursos](#appendsecccurpy---inserción-de-secciones-y-cursos)

## appendSeccCur.py - Inserción de Secciones y Cursos

### Objetivo del Módulo

El módulo `appendSeccCur.py` crea secciones (relación docente-asignatura) y cursos (sección con año y periodo) desde archivos Excel. Es el módulo más complejo ya que requiere validar múltiples entidades relacionadas.

### Función Principal

#### `insertSecciones(connection, intoData, year, periodo)`

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `connection` | `psycopg2.connection` | Conexión activa a PostgreSQL |
| `intoData` | `list[list]` | Lista de filas del Excel. Cada fila contiene `[asignatura, apellidos, nombres, correos]` |
| `year` | `int` | Año académico (ej: 2026) |
| `periodo` | `int` | Periodo académico (1 o 2) |

**Retorno:** `None` (efectos secundarios en BD)

### Lógica de Procesamiento

#### Fase 1: Carga de Catálogos (Caché en Memoria)

El módulo carga todos los datos necesarios en memoria para optimizar búsquedas:

**1. Asignaturas:**
```python
cursor.execute('SELECT id, nombre FROM asignaturas')
mapa_asignaturas = {}
for id_a, nom in cursor.fetchall():
    nombre_estandarizado = estandarizar_nombre_asignatura(nom)
    nombre_normalizado = normalizar_nombre_comparacion(nombre_estandarizado)
    mapa_asignaturas[nombre_normalizado] = id_a
```

**2. Docentes (dos índices):**
```python
# Por correo (prioritario)
mapa_docentes_correo[correo.lower()] = id_docente

# Por nombre normalizado (fallback)
mapa_docentes_nombre[nombre_normalizado] = id_docente
```

**3. Secciones existentes:**
```python
mapa_secciones[(docente_id, asignatura_id)] = seccion_id
```

**4. Cursos existentes:**
```python
cursos_existentes = {(docente_id, asignatura_id, year, periodo)}
```

#### Fase 2: Procesamiento de Filas del Excel

**Para cada fila:**

1. **Extracción de datos:**
   ```python
   nombre_asignatura_raw = str(reg[0]).strip()
   apellidos_raw = str(reg[1]).strip()
   nombres_raw = str(reg[2]).strip()
   correos_raw = str(reg[3]).strip()
   ```

2. **Búsqueda de asignatura:**
   ```python
   nombre_estandarizado = estandarizar_nombre_asignatura(nombre_asignatura_raw)
   key_asignatura = normalizar_nombre_comparacion(nombre_estandarizado)
   id_asignatura = mapa_asignaturas.get(key_asignatura)
   ```
   
   **Si no se encuentra:** Se registra error y se omite la fila

3. **Separación de múltiples docentes:**
   ```python
   l_ap = [x.strip() for x in apellidos_raw.split('\n')]
   l_nom = [x.strip() for x in nombres_raw.split('\n')]
   l_cor = [x.strip() for x in correos_raw.split('\n')]
   ```
   
   **Soporta:** Múltiples docentes en una sola fila (separados por `\n`)

#### Fase 3: Búsqueda de Docentes

**Estrategia de búsqueda (en orden de prioridad):**

1. **Por correo directo:**
   ```python
   if correo_clave in mapa_docentes_correo:
       id_docente = mapa_docentes_correo[correo_clave]
   ```

2. **Por correo genérico (con sufijos):**
   ```python
   candidatos_genericos = [
       "juan.gonzalez@pol.una.py",
       "juan.gonzalez2@pol.una.py",
       "juan.gonzalez3@pol.una.py",
       ...
   ]
   for cg in candidatos_genericos:
       if cg in mapa_docentes_correo:
           id_docente = mapa_docentes_correo[cg]
           break
   ```

3. **Por nombre normalizado (fallback):**
   ```python
   key_docente = normalizar_nombre_comparacion(nombre_docente_formateado)
   id_docente = mapa_docentes_nombre.get(key_docente)
   ```

**Si no se encuentra:** Se registra error y se omite el docente

#### Fase 4: Creación de Secciones y Cursos

**Para cada combinación (docente, asignatura):**

1. **Verificar si la sección existe:**
   ```python
   clave_seccion = (id_docente, id_asignatura)
   if clave_seccion in mapa_secciones:
       id_seccion = mapa_secciones[clave_seccion]
   else:
       secciones_nuevas.append((id_docente, id_asignatura))
   ```

2. **Verificar si el curso existe:**
   ```python
   curso_key = (id_docente, id_asignatura, year, periodo)
   if curso_key in cursos_existentes:
       # Omitir (ya existe)
   else:
       cursos_nuevos.append((id_seccion, year, periodo))
   ```

#### Fase 5: Inserción en Base de Datos

**1. Insertar secciones nuevas:**
```sql
INSERT INTO secciones (docente, asignatura)
VALUES %s
ON CONFLICT (docente, asignatura) DO NOTHING
RETURNING id, docente, asignatura;
```

**2. Insertar cursos:**
```sql
INSERT INTO cursos (seccion, year, periodo)
VALUES %s
ON CONFLICT (seccion, year, periodo) DO NOTHING
RETURNING id, seccion, year, periodo;
```

**Nota:** Los cursos se crean tanto para secciones nuevas como para secciones existentes (si el curso no existe).

### Tablas de PostgreSQL Afectadas

| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `secciones` | `INSERT` | Crea nuevas secciones (docente + asignatura) |
| `cursos` | `INSERT` | Crea nuevos cursos (sección + año + periodo) |
| `asignaturas` | `SELECT` | Consulta asignaturas para validación |
| `docentes` | `SELECT` | Consulta docentes para validación |
| `secciones` | `SELECT` | Consulta secciones existentes |
| `cursos` | `SELECT` | Consulta cursos existentes |

### Estadísticas Generadas

```
📊 RESUMEN DE PROCESAMIENTO:
   • Registros procesados exitosamente: 120
   • Secciones nuevas a crear: 15
   • Cursos nuevos a crear: 105
   • Duplicados en BD (omitidos): 10
   • Duplicados en Excel (omitidos): 5
   • Errores totales: 8
   • Docentes identificados por correo: 100
   • Docentes identificados por correo genérico: 10
   • Docentes identificados por nombre: 10
   • Registros sin correo en Excel: 5

✅ PROCESO FINALIZADO - PERÍODO 2026-1
   • Secciones nuevas creadas: 15
   • Cursos nuevos creados: 105

⚠️ OMISIONES:
   • Duplicados en BD: 10
   • Duplicados en Excel: 5

❌ ERRORES:
   • Asignaturas no encontradas: 3
   • Docentes no encontrados: 5
   • Datos inválidos: 0
```

### Casos Especiales

**1. Múltiples docentes en una fila:**
```
Excel: Asignatura="Base de Datos", Docentes="González\nPérez"
Resultado: 2 secciones creadas (una por cada docente)
```

**2. Sección existe pero curso no:**
```
Sección (Docente=1, Asignatura=5) ya existe
Curso (Sección=X, Year=2026, Periodo=1) no existe
Resultado: Solo se crea el curso
```

**3. Docente sin correo:**
```
El sistema intenta buscar por correo genérico primero
Si no encuentra, busca por nombre normalizado
Si no encuentra, registra error
```

---