from functions.helpFunctions import estandarizar_nombre_asignatura
from psycopg2.extras import execute_values
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
        
    except Exception as e:
        print(f"\n❌ ERROR al cargar datos de la base de datos: {e}")
        cursor.close()
        return
    try:
        cursor.execute("SELECT nombre, id FROM carreras")
        mapa_carreras = {fila[0].strip().upper(): fila[1] for fila in cursor.fetchall()}
        
    except Exception as e:
        print(f"❌ Error cargando carreras: {e}")
        cursor.close()
        return
    
    total_filas = 0
    asignaturas_no_encontradas = set()
    carreras_no_encontradas = set()
    asignaturas_vacias = 0

    # para evitar duplicados en la malla
    combinaciones_a_insertar=[] #[(id_carrera, id_asig, semestre)]
    combinaciones_vistas = set()  # (id_carrera, id_asig, semestre)
    
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
        if clave in combinaciones_vistas:
            continue  # evita duplicados

        combinaciones_vistas.add(clave)
        combinaciones_a_insertar.append(clave)

    insertadas=0
    if combinaciones_a_insertar:
        try:
            query = """
                INSERT INTO malla (carrera, asignatura, semestre)
                VALUES %s
                ON CONFLICT DO NOTHING
                RETURNING carrera, asignatura, semestre;
            """
            
            filas_insertadas = execute_values(cursor, query, combinaciones_a_insertar, fetch=True)
            connection.commit()

            insertadas = len(filas_insertadas) if filas_insertadas else 0
            omitidas = len(combinaciones_a_insertar) - insertadas

            print("\n📊 REPORTE DE CARGA DE MALLA")
            print(f"Total filas Excel: {total_filas}")
            print(f" ✅ Insertadas en malla (únicas): {insertadas}")
            if omitidas > 0:
                print(f" ⚠️ Omitidas (ya existían): {omitidas}")
            print(f" ✅ Carreras cargadas: {len(mapa_carreras)}")

        except Exception as e:
            connection.rollback()
            print(f"\n❌ ERROR CRÍTICO durante la inserción: {e}")
    else:
        print("\n⚠️ No hay datos válidos para insertar.")

    # --- Reporte de problemas ---
    if asignaturas_vacias:
        print(f"\n📌 Asignaturas vacías: {asignaturas_vacias}")
    if asignaturas_no_encontradas:
        print("\n📌 Asignaturas faltantes:")
        for a in sorted(asignaturas_no_encontradas):
            print(f" - {a}")
    if carreras_no_encontradas:
        print("\n📌 Carreras faltantes:")
        for c in sorted(carreras_no_encontradas):
            print(f" - {c}")

    cursor.close()
    if carreras_no_encontradas:
        print("\n📌 Carreras faltantes:")
        for c in sorted(carreras_no_encontradas):
            print(f" - {c}")