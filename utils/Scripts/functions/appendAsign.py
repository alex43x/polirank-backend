from functions.helpFunctions import numero_a_romano,normalizar_para_comparacion,extraer_numeros_clave,es_parecido
import re

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