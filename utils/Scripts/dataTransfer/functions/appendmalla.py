from functions.helpFunctions import estandarizar_nombre_asignatura
def mostrardatos(tabla):
    for fila in tabla:
        print(fila)
def insertMalla(connection,tabla):
    cursor = connection.cursor()
   
    try:
        cursor.execute('SELECT nombre, id FROM asignaturas')
        mapa_asignaturas = {}
        for nom,id_a in cursor.fetchall():

            nombre_std = estandarizar_nombre_asignatura(nom)
            mapa_asignaturas[nombre_std] = id_a
        
        print(f"   ✅ {len(mapa_asignaturas)} asignaturas cargadas")
    except Exception as e:
        print(f"\n❌ ERROR al cargar datos de la base de datos: {e}")
        cursor.close()
        return
    try:
        cursor.execute("SELECT nombre, id FROM carreras")
        mapa_carreras = {fila[0].strip().upper(): fila[1] for fila in cursor.fetchall()}
        
        print(f"✅ {len(mapa_carreras)} carreras cargadas")
    except Exception as e:
        print(f"❌ Error cargando carreras: {e}")
        cursor.close()
        return
    
    total_filas = 0
    insertadas = 0
    asignaturas_no_encontradas = set()
    carreras_no_encontradas = set()
    asignaturas_vacias = 0

    # para evitar duplicados en la malla
    combinaciones_insertadas = set()  # (id_carrera, id_asig, semestre)
    
    for linea in tabla:
        total_filas+=1
        if len(linea[0]) < 3:
            continue

        nom_asig = str(linea[0]).strip() 
        nom_carrera = str(linea[1]).strip().upper()
        semestre = linea[2]

        if not nom_asig:
            asignaturas_vacias+=1
            continue

        nombre_asig_std = estandarizar_nombre_asignatura(nom_asig)

        if nombre_asig_std not in mapa_asignaturas:
            asignaturas_no_encontradas.add(nom_asig)
            continue
        
        if nom_carrera not in mapa_carreras:
            carreras_no_encontradas.add(nom_carrera)
            continue
        
        id_asig = mapa_asignaturas[nombre_asig_std]
        id_carrera = mapa_carreras[nom_carrera]


        clave = (id_carrera, id_asig, semestre)
        if clave in combinaciones_insertadas:
            continue  # evita duplicados

        try:
            cursor.execute(
                """
                INSERT INTO malla (carrera,asignatura,semestre)
                VALUES(%s,%s,%s)
                """,
                (id_carrera,id_asig,semestre)
            )
            combinaciones_insertadas.add(clave)
            insertadas+=1

        except Exception as e:
            print(f"❌ Error insertando {nom_asig}: {e}")

    connection.commit()
    cursor.close()

    print("\n📊 REPORTE DE CARGA DE MALLA")
    print(f"Total filas Excel: {total_filas}")
    print(f"Insertadas en malla (únicas): {insertadas}")
    print(f"Asignaturas vacías: {asignaturas_vacias}")
    print(f"Asignaturas no encontradas: {len(asignaturas_no_encontradas)}")
    print(f"Carreras no encontradas: {len(carreras_no_encontradas)}")

    if asignaturas_no_encontradas:
        print("\n📌 Asignaturas faltantes:")
        for a in sorted(asignaturas_no_encontradas):
            print(f" - {a}")

    if carreras_no_encontradas:
        print("\n📌 Carreras faltantes:")
        for c in sorted(carreras_no_encontradas):
            print(f" - {c}")