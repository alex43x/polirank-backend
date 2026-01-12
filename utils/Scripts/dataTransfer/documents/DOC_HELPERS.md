# Documentación de Funciones Auxiliares

## 📋 Tabla de Contenidos

1. [Funciones de Procesamiento de Excel](#funciones-de-procesamiento-de-excel)
2. [Funciones de Normalización de Texto](#funciones-de-normalización-de-texto)
3. [Funciones de Detección de Duplicados](#funciones-de-detección-de-duplicados)
4. [Funciones de Manejo de Correos](#funciones-de-manejo-de-correos)
5. [Funciones de Estandarización de Asignaturas](#funciones-de-estandarización-de-asignaturas)
6. [Funciones de Utilidad](#funciones-de-utilidad)

---

## Funciones de Procesamiento de Excel

### `procesar_excel_exacto(archivo, nombre_hoja, indices_columnas, fila_inicio)`

**Descripción:** Extrae datos específicos de un archivo Excel, leyendo solo las columnas indicadas a partir de una fila de inicio.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `archivo` | `str` | Ruta completa al archivo Excel (.xlsx o .xls) |
| `nombre_hoja` | `str` | Nombre de la hoja a procesar |
| `indices_columnas` | `list[int]` | Lista de índices de columnas a extraer (0-indexed) |
| `fila_inicio` | `int` | Número de fila desde donde comenzar a leer (1-indexed) |

**Retorno:** `list[list]` - Lista de filas, cada fila es una lista con los valores de las columnas especificadas

**Ejemplo de uso:**
```python
# Extraer columnas 12, 13, 14 a partir de la fila 12
datos = procesar_excel_exacto(
    archivo="docentes.xlsx",
    nombre_hoja="Hoja1",
    indices_columnas=[12, 13, 14],
    fila_inicio=12
)
# Resultado: [[apellidos, nombres, correos], ...]
```

**Comportamiento:**
- Ignora filas anteriores a `fila_inicio`
- Si una columna no existe en una fila, se agrega `None`
- Solo incluye filas que tengan al menos un valor no nulo
- Usa `data_only=True` para leer valores calculados como números

**Manejo de errores:**
- Si la hoja no existe, imprime error y retorna `None`
- Si hay error al leer el archivo, imprime error y retorna `None`

---

### `seleccion_archivo()`

**Descripción:** Abre un diálogo gráfico para que el usuario seleccione un archivo Excel.

**Parámetros:** Ninguno

**Retorno:** `str | None` - Ruta completa al archivo seleccionado, o `None` si se cancela

**Características:**
- Usa `tkinter.filedialog` para la interfaz gráfica
- Filtra solo archivos Excel (.xlsx, .xls)
- Fuerza la ventana al frente (`-topmost`)
- Destruye la instancia de tkinter después de usar para liberar memoria

**Ejemplo de uso:**
```python
archivo = seleccion_archivo()
if archivo:
    print(f"Archivo seleccionado: {archivo}")
else:
    print("No se seleccionó archivo")
```

---

### `obtener_nombre_hoja(ruta_archivo)`

**Descripción:** Muestra las hojas disponibles en un archivo Excel y permite al usuario seleccionar una.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ruta_archivo` | `str` | Ruta al archivo Excel |

**Retorno:** `str | None` - Nombre de la hoja seleccionada, o `None` si hay error

**Comportamiento:**
- Si el archivo tiene solo una hoja, la retorna automáticamente
- Si tiene múltiples hojas, muestra un menú numerado
- Valida que la opción ingresada sea válida

**Ejemplo de uso:**
```python
hoja = obtener_nombre_hoja("archivo.xlsx")
# Si hay múltiples hojas:
# 📋 Hojas disponibles:
#   [1] Hoja1
#   [2] Datos
#   [3] Resumen
# 👉 Elige el número de la hoja: 2
# Resultado: "Datos"
```

---

## Funciones de Normalización de Texto

### `normalizar_nombre_comparacion(nombre)`

**Descripción:** Normaliza un nombre para comparación, eliminando diferencias de formato que no afectan la identidad.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre` | `str` | Nombre a normalizar |

**Retorno:** `str` - Nombre normalizado

**Transformaciones aplicadas:**

1. **Conversión a minúsculas:**
   ```python
   "Juan Pérez" → "juan pérez"
   ```

2. **Eliminación de tildes:**
   ```python
   "José María" → "jose maria"
   ```
   - Usa `unicodedata.normalize('NFD')` para descomponer caracteres
   - Elimina marcas de combinación (tildes, diéresis, etc.)

3. **Normalización de espacios:**
   ```python
   "Juan   Carlos" → "juan carlos"
   ```

**Ejemplo de uso:**
```python
nombre1 = normalizar_nombre_comparacion("Juan Pérez")
nombre2 = normalizar_nombre_comparacion("JUAN PÉREZ")
# nombre1 == nombre2 → True
```

**Uso típico:** Comparación de nombres para detectar duplicados

---

### `formatDoc(nom, app)`

**Descripción:** Combina nombre y apellido en un formato estandarizado.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nom` | `str` | Nombre(s) del docente |
| `app` | `str` | Apellido(s) del docente |

**Retorno:** `str | False` - Nombre completo formateado, o `False` si falta algún campo

**Comportamiento:**
- Valida que ambos parámetros no estén vacíos
- Normaliza espacios múltiples en nombre y apellido
- Combina: `"{nombre_completo} {apellido_completo}"`

**Ejemplo de uso:**
```python
nombre = formatDoc("Juan Carlos", "González Pérez")
# Resultado: "Juan Carlos González Pérez"

nombre = formatDoc("", "González")
# Resultado: False (falta nombre)
```

**Nota:** Esta función mantiene el nombre completo (no solo primer nombre + primer apellido)

---

## Funciones de Detección de Duplicados

### `nombres_similares(nombre1, nombre2)`

**Descripción:** Determina si dos nombres pertenecen a la misma persona usando normalización y reglas de similitud.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre1` | `str` | Primer nombre a comparar |
| `nombre2` | `str` | Segundo nombre a comparar |

**Retorno:** `bool` - `True` si son similares, `False` en caso contrario

**Algoritmo:**

1. **Normalización:**
   ```python
   n1 = normalizar_nombre_comparacion(nombre1)
   n2 = normalizar_nombre_comparacion(nombre2)
   ```

2. **Comparación exacta:**
   ```python
   if n1 == n2:
       return True
   ```

3. **Comparación por palabras clave:**
   - Extrae conjunto de palabras de cada nombre
   - Requiere al menos 2 palabras en común
   - Verifica que coincidan **primer nombre** y **primer apellido**

4. **Validación de palabras del medio:**
   - Si ambos nombres tienen 3+ palabras
   - Y tienen la misma cantidad de palabras
   - Verifica que las palabras del medio coincidan
   - Si difieren → son personas distintas

**Ejemplos:**

```python
# Casos que retornan True:
nombres_similares("Juan Pérez", "Juan Pérez")           # Exacto
nombres_similares("Juan Pérez", "JUAN PÉREZ")           # Normalización
nombres_similares("Juan Carlos Pérez", "Juan C. Pérez") # Palabras comunes

# Casos que retornan False:
nombres_similares("Juan Pérez", "Carlos Pérez")          # Diferente primer nombre
nombres_similares("José Antonio González", "José María González")  # Diferentes palabras del medio
```

**Limitaciones:**
- No detecta typos de 1 carácter (ej: "Perez" vs "Peres")
- No maneja abreviaciones (ej: "J." vs "Juan")
- Requiere coincidencia exacta de primer nombre y primer apellido

---

### `extraer_nombre_clave(nombre_completo)`

**Descripción:** Extrae una clave simplificada de un nombre para indexación rápida.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre_completo` | `str` | Nombre completo |

**Retorno:** `str` - Clave normalizada (primer nombre + primer apellido)

**Algoritmo:**
1. Normaliza el nombre completo
2. Extrae primera palabra (primer nombre)
3. Extrae última palabra (primer apellido)
4. Retorna: `"{primer_nombre} {primer_apellido}"`

**Ejemplo:**
```python
clave = extraer_nombre_clave("Juan Carlos González Pérez")
# Resultado: "juan perez" (normalizado)
```

**Uso:** Indexación rápida antes de comparación detallada con `nombres_similares()`

---

### `detectar_duplicados_por_nombre(nuevos_docentes)`

**Descripción:** Detecta duplicados dentro de una lista de docentes usando comparación de nombres.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nuevos_docentes` | `list[tuple]` | Lista de tuplas `(nombre, correo)` |

**Retorno:** `list[dict]` - Lista de diccionarios con información de duplicados

**Estructura del retorno:**
```python
[
    {
        'indice_actual': 5,
        'nombre': 'Juan Pérez',
        'correo_actual': 'juan@email.com',
        'duplicado_de': 2,
        'nombre_duplicado': 'Juan Pérez',
        'correo_duplicado': 'juan.perez@pol.una.py'
    },
    ...
]
```

**Algoritmo:**
1. Crea diccionario indexado por nombre clave
2. Para cada docente:
   - Extrae nombre clave
   - Busca en diccionario
   - Si encuentra, compara con `nombres_similares()`
   - Si son similares, agrega a lista de duplicados
   - Si no, agrega al diccionario

**Ejemplo de uso:**
```python
docentes = [
    ("Juan Pérez", "juan@email.com"),
    ("María González", "maria@email.com"),
    ("Juan Pérez", "juan.perez@pol.una.py")  # Duplicado
]

duplicados = detectar_duplicados_por_nombre(docentes)
# Resultado: [{'indice_actual': 2, 'duplicado_de': 0, ...}]
```

---

## Funciones de Manejo de Correos

### `generar_correo_generico(nombre_completo, correos_existentes=None)`

**Descripción:** Genera un correo electrónico genérico único basado en el nombre de una persona.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre_completo` | `str` | Nombre completo de la persona |
| `correos_existentes` | `set | dict | None` | Conjunto de correos ya existentes para evitar colisiones |

**Retorno:** `str | None` - Correo genérico único, o `None` si no se puede generar

**Formato generado:**
```
primer_nombre.primer_apellido@pol.una.py
```

**Algoritmo:**

1. **Normalización del nombre:**
   ```python
   nombre_normalizado = normalizar_nombre_comparacion(nombre_completo)
   palabras = nombre_normalizado.split()
   ```

2. **Extracción de componentes:**
   ```python
   primer_nombre = palabras[0]
   primer_apellido = palabras[-1]
   base_email = f"{primer_nombre}.{primer_apellido}"
   ```

3. **Limpieza de caracteres especiales:**
   ```python
   base_email = re.sub(r'[^a-z0-9.]', '', base_email)
   ```

4. **Verificación de unicidad:**
   ```python
   correo_base = f"{base_email}@pol.una.py"
   if correo_base not in correos_existentes:
       return correo_base
   ```

5. **Generación con sufijo numérico:**
   ```python
   contador = 2
   while True:
       correo_candidato = f"{base_email}{contador}@pol.una.py"
       if correo_candidato not in correos_existentes:
           return correo_candidato
       contador += 1
   ```

**Ejemplos:**

```python
# Caso básico
correo = generar_correo_generico("Juan Pérez", set())
# Resultado: "juan.perez@pol.una.py"

# Con colisión
correos_existentes = {"juan.perez@pol.una.py"}
correo = generar_correo_generico("Juan Pérez", correos_existentes)
# Resultado: "juan.perez2@pol.una.py"

# Nombre con caracteres especiales
correo = generar_correo_generico("José María González", set())
# Resultado: "jose.gonzalez@pol.una.py" (sin tilde, sin segundo nombre)
```

**Límite de seguridad:** Si no encuentra correo único después de 1000 intentos, genera uno aleatorio.

---

### `es_correo_institucional(correo)`

**Descripción:** Verifica si un correo electrónico es institucional (pertenece al dominio `@pol.una.py`).

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `correo` | `str` | Correo electrónico a verificar |

**Retorno:** `bool` - `True` si es institucional, `False` en caso contrario

**Implementación:**
```python
if not correo:
    return False
return '@pol.una.py' in correo.lower()
```

**Ejemplos:**
```python
es_correo_institucional("juan.perez@pol.una.py")  # True
es_correo_institucional("juan@gmail.com")          # False
es_correo_institucional("")                        # False
```

---

### `preferir_correo_institucional(correo1, correo2)`

**Descripción:** Decide cuál de dos correos tiene prioridad, dando preferencia a correos institucionales.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `correo1` | `str` | Primer correo a comparar |
| `correo2` | `str` | Segundo correo a comparar |

**Retorno:** `str` - Correo preferido

**Reglas de prioridad:**

1. Si `correo1` es `None` o vacío → retorna `correo2`
2. Si `correo2` es `None` o vacío → retorna `correo1`
3. Si `correo1` es institucional y `correo2` no → retorna `correo1`
4. Si `correo2` es institucional y `correo1` no → retorna `correo2`
5. En cualquier otro caso → retorna `correo1` (mantiene el primero)

**Ejemplos:**
```python
preferir_correo_institucional(
    "juan.perez@pol.una.py",
    "juan@gmail.com"
)
# Resultado: "juan.perez@pol.una.py" (institucional tiene prioridad)

preferir_correo_institucional(
    "juan@gmail.com",
    "juan.perez@pol.una.py"
)
# Resultado: "juan.perez@pol.una.py" (institucional tiene prioridad)
```

---

## Funciones de Estandarización de Asignaturas

### `estandarizar_nombre_asignatura(nombre)`

**Descripción:** Estandariza el nombre de una asignatura aplicando correcciones de ortografía, formato y conversión de números a romanos.

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `nombre` | `str` | Nombre de la asignatura a estandarizar |

**Retorno:** `str` - Nombre estandarizado

**Transformaciones aplicadas (en orden):**

#### 1. Limpieza Inicial
```python
# Elimina patrones como (*), (**), etc.
nombre = re.sub(r'\s*\(\*+\)', '', str(nombre))
# Normaliza espacios múltiples
nombre = ' '.join(nombre.split())
```

**Ejemplo:**
```
"Base de Datos (**)" → "Base de Datos"
```

#### 2. Corrección de Typos y Capitalización
```python
correcciones = {
    "sotfware": "Software",
    "Sotfware": "Software",
    "software": "Software",
    "datamining": "Data Mining",
    "Datamining": "Data Mining",
    "Tecnologia": "Tecnología",
    "lenguajes": "Lenguajes"
}
```

**Aplicación:** Palabra por palabra, preservando el resto del nombre

**Ejemplo:**
```
"sotfware 1" → "Software 1"
```

#### 3. Conversión de Números a Romanos

**Casos manejados:**

a) **Número al final:**
```python
nombre = re.sub(r'\b(\d+)$', lambda m: numero_a_romano(m.group(1)), nombre)
```

**Ejemplo:**
```
"Software 1" → "Software I"
"Electiva 3" → "Electiva III"
```

b) **Número después de "Electiva" o "Optativa":**
```python
nombre = re.sub(
    r'(Electiva|Optativa)\s+(\d+)',
    lambda m: f"{m.group(1)} {numero_a_romano(m.group(2))}",
    nombre,
    flags=re.IGNORECASE
)
```

**Ejemplo:**
```
"Electiva 2" → "Electiva II"
"Optativa 5" → "Optativa V"
```

**Mapa de conversión:**
```python
{
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
}
```

#### 4. Formato de Guiones
```python
# Separa guiones pegados a números romanos
nombre = re.sub(r'\b([IVX]+)-', r'\1 - ', nombre)
```

**Ejemplo:**
```
"VII-" → "VII - "
"IV-Programación" → "IV - Programación"
```

#### 5. Limpieza Final
```python
nombre = ' '.join(nombre.split())  # Elimina espacios dobles
```

**Ejemplo completo:**
```python
entrada = "sotfware 1 (**)"
salida = estandarizar_nombre_asignatura(entrada)
# Resultado: "Software I"
```

**Limitaciones:**
- El diccionario de correcciones es fijo (no se expande automáticamente)
- Solo convierte números del 1 al 10 a romanos
- No detecta variaciones como "Base de Datos" vs "Bases de Datos"

---

## Funciones de Utilidad

### `limpiar_pantalla()`

**Descripción:** Limpia la consola/terminal para mejorar la legibilidad del menú.

**Parámetros:** Ninguno

**Retorno:** `None`

**Implementación:**
```python
os.system('cls' if os.name == 'nt' else 'clear')
```

**Comportamiento:**
- En Windows: ejecuta `cls`
- En Unix/Linux/Mac: ejecuta `clear`

**Uso:** Llamada antes de mostrar el menú principal para mantener la interfaz limpia

---

## Resumen de Funciones por Categoría

| Categoría | Funciones | Uso Principal |
|-----------|-----------|---------------|
| **Excel** | `procesar_excel_exacto`, `seleccion_archivo`, `obtener_nombre_hoja` | Lectura y selección de archivos |
| **Normalización** | `normalizar_nombre_comparacion`, `formatDoc` | Estandarización de texto |
| **Duplicados** | `nombres_similares`, `extraer_nombre_clave`, `detectar_duplicados_por_nombre` | Detección de registros duplicados |
| **Correos** | `generar_correo_generico`, `es_correo_institucional`, `preferir_correo_institucional` | Generación y validación de correos |
| **Asignaturas** | `estandarizar_nombre_asignatura` | Estandarización de nombres de asignaturas |
| **Utilidad** | `limpiar_pantalla` | Interfaz de usuario |

---

## Flujo de Uso Típico

```python
# 1. Seleccionar archivo
archivo = seleccion_archivo()

# 2. Seleccionar hoja
hoja = obtener_nombre_hoja(archivo)

# 3. Procesar Excel
datos = procesar_excel_exacto(archivo, hoja, [12, 13, 14], 12)

# 4. Para cada fila, formatear nombres
for fila in datos:
    nombre = formatDoc(fila[1], fila[0])  # nombres, apellidos
    
    # 5. Normalizar para comparación
    nombre_norm = normalizar_nombre_comparacion(nombre)
    
    # 6. Generar correo si falta
    if not fila[2]:  # sin correo
        correo = generar_correo_generico(nombre, correos_existentes)
    
    # 7. Detectar duplicados
    if nombres_similares(nombre, nombre_existente):
        # Consolidar
        pass
```

---

**Última actualización:** 2024
