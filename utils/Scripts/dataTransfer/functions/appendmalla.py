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
    
    for linea in tabla:
        if len(linea[0]) < 3:
            continue

        nom_asig = str(linea[0]).strip() 
        nom_carrera = str(linea[1]).strip().upper()
        semestre = linea[2]

        nombre_asig_std = estandarizar_nombre_asignatura(nom_asig)

        if nombre_asig_std not in mapa_asignaturas:
            print(f"⚠ Asignatura no encontrada: {nom_asig}")
            continue
        
        if nom_carrera not in mapa_carreras:
            print(f"⚠ Carrera no encontrada: {nom_carrera}")
            continue
        
        id_asig = mapa_asignaturas[nombre_asig_std]
        id_carrera = mapa_carreras[nom_carrera]
        try:
            cursor.execute(
                """
                INSERT INTO malla (carrera,asignatura,semestre)
                VALUES(%s,%s,%s)
                """,
                (id_carrera,id_asig,semestre)
            )
        except Exception as e:
            print(f"❌ Error insertando {nom_asig}: {e}")

    connection.commit()
    cursor.close()
    print("🎉 Carga de malla finalizada")