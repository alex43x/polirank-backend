import re
import unicodedata
from difflib import SequenceMatcher

# ==============================================================================
#    FUNCIONES DE AYUDA (LOGICA DE NORMALIZACION Y COMPARACION)
# ==============================================================================

def numero_a_romano(match):
    """Callback para convertir números arábigos (1-10) a romanos."""
    mapa = {
        '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
        '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X'
    }
    return mapa.get(match.group(), match.group())

def normalizar_para_comparacion(texto):
    """
    Normalización estricta para CLAVES de diccionarios:
    - Minúsculas, sin acentos.
    - Convierte número arábigo final a romano (1 -> I).
    - Elimina espacios (fisica 1 -> fisicai).
    """
    if not texto: return ""
    
    # 1. Limpieza básica
    texto = str(texto).lower().strip()
    
    # 2. Convertir número final a romano (Ej: "Física 1" -> "fisica I")
    texto = re.sub(r'\b([1-9]|10)\b$', numero_a_romano, texto, flags=re.IGNORECASE)
    
    # 3. Quitar acentos (NFD)
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    
    # 4. Eliminar espacios para crear una "huella digital" del texto
    return texto.replace(" ", "")

def extraer_numeros_clave(texto):
    """Extrae TODOS los números (arábigos y romanos) para distinguir niveles."""
    texto = str(texto).upper()
    arabigos = re.findall(r'\b\d+\b', texto)
    romanos = re.findall(r'\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b', texto)
    return set(arabigos + romanos)

def es_parecido(nombre_nuevo, nombre_existente, umbral=0.92):
    """Comparación visual difusa (Levenshtein ratio)."""
    return SequenceMatcher(None, nombre_nuevo, nombre_existente).ratio() >= umbral


# ==============================================================================
# 1. INSERTAR ASIGNATURAS (CON LOGICA ANTI-DUPLICADOS AVANZADA)
# ==============================================================================
def insertAsign(connection, intoData):
        cursor = connection.cursor()

        # 1. Cargar datos previos
        cursor.execute("SELECT id, siglas FROM departamentos")
        mapa_deptos = {sigla: id_dep for (id_dep, sigla) in cursor.fetchall()}

        cursor.execute("SELECT nombre FROM asignaturas")
        db_filas = cursor.fetchall()
        
        nombres_db_originales = [fila[0] for fila in db_filas]
        # Creamos el set usando la funcion NORMALIZADA
        nombres_db_norm = {normalizar_para_comparacion(nom) for nom in nombres_db_originales}

        if not mapa_deptos:
            print("❌ Error: No hay departamentos.")
            return

        asignaturas_tup = []
        contador_omitidos = 0

        print(f"🔄 Procesando {len(intoData)} registros...")

        for fila in intoData:
            cod_depto = fila[0]
            nombre_sucio = str(fila[1])

            # --- PASO A: LIMPIEZA DE ENTRADA ---
            # Quitar (*), (**), etc.
            nombre_limpio = re.sub(r'\s*\(\*+\)$', '', nombre_sucio) 
            nombre_limpio = nombre_limpio.replace("(*)", "").replace("(**)", "")
            nombre_limpio = " ".join(nombre_limpio.split())

            # --- PASO B: VALIDACIÓN INTELIGENTE ---
            nombre_check = normalizar_para_comparacion(nombre_limpio)
            
            # 1. Check Exacto (Normalizado)
            if nombre_check in nombres_db_norm:
                contador_omitidos += 1
                continue

            # 2. Check Fuzzy (Similitud Visual + Logica de Numeros)
            es_duplicado_fuzzy = False
            
            for existente in nombres_db_originales:
                # ¿Se parecen visualmente?
                if es_parecido(nombre_limpio.lower(), existente.lower()):
                    
                    # LOGICA 1: ANÁLISIS DE NÚMEROS
                    nums_nuevos = extraer_numeros_clave(nombre_limpio)
                    nums_existentes = extraer_numeros_clave(existente)
                    
                    if nums_nuevos != nums_existentes:
                        continue # Si los numeros son distintos, son materias distintas

                    # LOGICA 2: REGLA DE LONGITUD (Para evitar "Proyecto" vs "Anteproyecto")
                    diferencia_longitud = abs(len(nombre_limpio) - len(existente))
                    if diferencia_longitud > 3:
                         continue

                    # Si pasa todo, es un duplicado
                    print(f"  ⚠️ Detectado duplicado Fuzzy: '{nombre_limpio}' ~ '{existente}' -> OMITIDO")
                    es_duplicado_fuzzy = True
                    break
            
            if es_duplicado_fuzzy:
                contador_omitidos += 1
                continue

            # --- PASO C: PREPARAR PARA INSERTAR ---
            nombres_db_norm.add(nombre_check) # Agregamos al set temporal
            nombres_db_originales.append(nombre_limpio)

            id_depto = mapa_deptos.get(cod_depto)
            if id_depto:
                asignaturas_tup.append((nombre_limpio, id_depto))

        # --- INSERTAR ---
        if asignaturas_tup:
            sql = "INSERT IGNORE INTO asignaturas (nombre, dpto) VALUES (%s, %s)"
            cursor.executemany(sql, asignaturas_tup)
            connection.commit()
            print(f"✅ ÉXITO: {cursor.rowcount} insertados. ({contador_omitidos} omitidos)")
        else:
            print(f"🧹 Todo limpio. {contador_omitidos} omitidos.")


# ==============================================================================
# 2. INSERTAR DOCENTES
# ==============================================================================
def insertDoc(connection, intoData):
        cursor = connection.cursor()
        docTup = []
    
        for doc in intoData:
        # Validar que existan datos antes de hacer split
            nombre_raw = str(doc[1]).strip() if doc[1] else ""
            apellido_raw = str(doc[0]).strip() if doc[0] else ""
            
            if not nombre_raw or not apellido_raw:
                print(f"⚠️ Docente omitido por datos incompletos: {doc}")
                continue

            nom_pila = nombre_raw.split()[0]
            ape_pila = apellido_raw.split()[0]
            
            nom_completo = f"{nom_pila} {ape_pila}"
            docTup.append((nom_completo,))
        
        cursor.executemany("INSERT IGNORE INTO docentes (nombre) VALUES (%s)", docTup)
        connection.commit()
        print(f"Se insertaron {cursor.rowcount} docentes correctamente.")


# ==============================================================================
# 3. INSERTAR MALLAS (ADAPTADO A LA LÓGICA DE NORMALIZACIÓN)
# ==============================================================================
def insertMalla(connection, intoData):
        cursor = connection.cursor()
        
        # 1. Mapa Carreras
        cursor.execute('SELECT id, nombre FROM carreras')
        mapa_carreras = {}
        for (id_carr, nombre) in cursor.fetchall():
            # Normalización simple para carreras
            clave_clean = " ".join(nombre.split()).lower()
            mapa_carreras[clave_clean] = id_carr

        # 2. Mapa Asignaturas (USANDO LA NUEVA NORMALIZACIÓN)
        cursor.execute('SELECT id, nombre FROM asignaturas')
        mapa_asignaturas = {}
        for (id_asig, nombre) in cursor.fetchall():
            # AQUI ESTA EL CAMBIO CLAVE: Usamos normalizar_para_comparacion
            # Esto asegura que si en BD está "Fisica I", y buscamos "fisica 1", lo encuentre.
            clave_norm = normalizar_para_comparacion(nombre)
            mapa_asignaturas[clave_norm] = id_asig

        # 3. Verificación previa
        print("⏳ Verificando malla existente...")
        cursor.execute('SELECT carrera, asignatura FROM malla')
        malla_existente = set(cursor.fetchall()) 

        datos_para_insertar = []
        errores = []
        duplicados_omitidos = 0

        # 4. Procesar
        for reg in intoData:
            nombre_materia_sucio = str(reg[0])
            nombre_carrera_sucio = str(reg[1])
            semestre = reg[2]

            # Normalizamos el INPUT con la misma función estricta
            key_materia = normalizar_para_comparacion(nombre_materia_sucio)
            
            # Normalización simple para carrera
            key_carrera = " ".join(nombre_carrera_sucio.split()).lower()

            # Obtener IDs
            id_asignatura = mapa_asignaturas.get(key_materia)
            id_carrera = mapa_carreras.get(key_carrera)

            if id_asignatura and id_carrera:
                if (id_carrera, id_asignatura) in malla_existente:
                    duplicados_omitidos += 1
                else:
                    datos_para_insertar.append((id_carrera, id_asignatura, semestre))
                    malla_existente.add((id_carrera, id_asignatura)) 
            else:
                errores.append(f"No match: Mat='{nombre_materia_sucio}' (Key: {key_materia}) en Carr='{nombre_carrera_sucio}'")

        # 5. Insertar
        if datos_para_insertar:
            sql = "INSERT IGNORE INTO malla (carrera, asignatura, semestre) VALUES (%s, %s, %s)"
            try:
                cursor.executemany(sql, datos_para_insertar)
                connection.commit()
                print(f"🚀 MALLA: {cursor.rowcount} nuevos registros. ({duplicados_omitidos} omitidos)")
            except Exception as e:
                print(f"❌ Error crítico al insertar malla: {e}")
        else:
            print(f"✅ Malla al día. ({duplicados_omitidos} duplicados omitidos).")

        if errores:
            print(f"⚠️ {len(errores)} errores de coincidencia en Malla (Ejemplos):")
            for e in errores[:3]: print(e)



# ==============================================================================
# 4. INSERTAR SECCIONES Y CURSOS (MODIFICADO)
# ==============================================================================
def insertSecciones(connection, intoData, year, periodo):
    cursor = connection.cursor()

    print(f"🔄 Cargando Secciones para Año: {year}, Periodo: {periodo}...")

    # 1. Mapas
    cursor.execute('SELECT id, nombre FROM asignaturas')
    mapa_asignaturas = {normalizar_para_comparacion(nom): id_a for id_a, nom in cursor.fetchall()}

    cursor.execute('SELECT id, nombre FROM docentes')
    mapa_docentes = {nom.lower().strip(): id_d for id_d, nom in cursor.fetchall()}

    # ==============================================================================
    # VALIDACIÓN: ASIGNATURA + DOCENTE EN ESTE PERIODO
    # ==============================================================================
    # Solo verificamos si el par (Materia, Docente) ya tiene curso este semestre.
    sql_check = """
        SELECT s.asignatura, s.docente
        FROM secciones s
        INNER JOIN cursos c ON s.id = c.id_seccion
        WHERE c.year = %s AND c.periodo = %s
    """
    cursor.execute(sql_check, (year, periodo))
    
    # El set solo contiene tuplas de 2 elementos: (IdMateria, IdDocente)
    secciones_registradas_este_semestre = set(cursor.fetchall()) 

    datos_para_insertar = []
    errores = []
    duplicados_omitidos = 0

    # 4. Procesar
    for reg in intoData:
        nombre_asig_sucio = str(reg[0])
        turno = str(reg[1]).strip()
        nombre_seccion = str(reg[2]).strip() 
        apellido_raw = reg[3]
        nombre_raw = reg[4]

        # Normalización y búsqueda de IDs
        key_materia = normalizar_para_comparacion(nombre_asig_sucio)
        id_asignatura = mapa_asignaturas.get(key_materia)

        # Lógica Docente
        id_docente = None
        nom_str = str(nombre_raw).strip() if nombre_raw else ""
        ape_str = str(apellido_raw).strip() if apellido_raw else ""
        nombre_completo_generado = "DESCONOCIDO"

        if nom_str and ape_str:
            primer_nombre = nom_str.split()[0]
            primer_apellido = ape_str.split()[0]
            nombre_completo_generado = f"{primer_nombre} {primer_apellido}".lower()
            id_docente = mapa_docentes.get(nombre_completo_generado)

        if id_asignatura and id_docente:
            # Llave única basada SOLO en Asignatura y Docente
            llave_unica = (id_asignatura, id_docente)

            if llave_unica in secciones_registradas_este_semestre:
                duplicados_omitidos += 1
            else:
                # Si no existe en este semestre, preparamos la inserción
                datos_para_insertar.append((nombre_seccion, id_docente, id_asignatura, turno))
                
                # Actualizamos el set local para evitar duplicados dentro del mismo Excel
                secciones_registradas_este_semestre.add(llave_unica)
        else:
            motivo = []
            if not id_asignatura: motivo.append(f"Asignatura no hallada: {nombre_asig_sucio}")
            if not id_docente: motivo.append(f"Docente no hallado: {nombre_completo_generado}")
            errores.append(f"Omitido: {', '.join(motivo)}")

    # 5. Insertar y Disparar Trigger
    if datos_para_insertar:
        sql = "INSERT INTO secciones (nombre, docente, asignatura, turno) VALUES (%s, %s, %s, %s)"
        
        try:
            # Configuramos las variables para el Trigger
            cursor.execute(f"SET @year_sesion = {year};")
            cursor.execute(f"SET @periodo_sesion = {periodo};")
            
            cursor.executemany(sql, datos_para_insertar)
            connection.commit()
            
            print(f"🚀 ÉXITO: {cursor.rowcount} secciones nuevas creadas.")
            print(f"   (El trigger generó los cursos para {year}-{periodo})")
            
            if duplicados_omitidos > 0:
                print(f"   ℹ️  {duplicados_omitidos} registros omitidos (Docente ya tiene esta materia en este periodo).")

        except Exception as e:
            connection.rollback()
            print(f"❌ Error crítico SQL: {e}")
    else:
        print(f"⚠️ No hay nada nuevo para insertar. ({duplicados_omitidos} duplicados encontrados).")

    if errores:
        print(f"\n⚠️ Resumen de errores ({len(errores)}):")
        for e in errores[:5]: print(e)