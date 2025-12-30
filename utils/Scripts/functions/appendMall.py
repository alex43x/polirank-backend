from functions.helpFunctions import normalizar_para_comparacion





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