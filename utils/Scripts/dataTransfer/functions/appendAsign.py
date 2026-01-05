import psycopg2
from psycopg2.extras import execute_values
from functions.helpFunctions import estandarizar_nombre_asignatura

def insertAsign(connection, raw_data):
    """
    Inserta asignaturas desde datos de Excel en la base de datos.
    
    Procesa las asignaturas:
    1. Valida que exista el departamento
    2. Estandariza el nombre (corrige typos, convierte números a romanos)
    3. Elimina duplicados por (nombre, departamento)
    4. Inserta en la base de datos usando ON CONFLICT para evitar duplicados
    """
    cursor = connection.cursor()

    print("🔄 Cargando departamentos...")
    try:
        cursor.execute("SELECT siglas, id FROM departamentos")
        mapa_dept = {fila[0].strip().upper(): fila[1] for fila in cursor.fetchall()}
        
        if not mapa_dept:
            print("❌ Error: Tabla 'departamentos' vacía.")
            cursor.close()
            return
        
        print(f"✅ Se cargaron {len(mapa_dept)} departamentos.")
    except Exception as e:
        print(f"❌ Error al cargar departamentos: {e}")
        cursor.close()
        return

    print(f"\n📚 Procesando {len(raw_data)} filas del Excel...")

    asignaturas_unicas = {} 
    errores_dpto = []
    asignaturas_vacias = 0
    asignaturas_procesadas = 0

    for item in raw_data:
        if not item or len(item) < 2:
            continue

        sigla_raw = str(item[0]).strip().upper() if item[0] else ""
        nombre_raw = str(item[1]).strip() if item[1] else ""
        
        # Validar que haya sigla y nombre
        if not sigla_raw or not nombre_raw:
            asignaturas_vacias += 1
            continue
        
        # 1. Validar Departamento
        id_dept = mapa_dept.get(sigla_raw)
        if id_dept is None:
            errores_dpto.append(f"{sigla_raw} -> {nombre_raw}")
            continue

        # 2. Estandarizar (Typos y Romanos)
        nombre_final = estandarizar_nombre_asignatura(nombre_raw)

        if not nombre_final:
            asignaturas_vacias += 1
            continue

        asignaturas_procesadas += 1

        # 3. Preparar Clave Única (Nombre + Depto)
        clave = (nombre_final, id_dept)
        
        if clave not in asignaturas_unicas:
            asignaturas_unicas[clave] = (nombre_final, id_dept)

    datos_a_insertar = list(asignaturas_unicas.values())
    
    # Mostrar estadísticas
    print(f"\n📊 ESTADÍSTICAS DE PROCESAMIENTO:")
    print(f"   • Filas procesadas: {asignaturas_procesadas}")
    print(f"   • Asignaturas únicas: {len(datos_a_insertar)}")
    if errores_dpto:
        print(f"   • Filas omitidas (departamento desconocido): {len(errores_dpto)}")
        if len(errores_dpto) <= 5:
            print(f"\n   Ejemplos de departamentos desconocidos:")
            for error in errores_dpto:
                print(f"     - {error}")
        else:
            print(f"\n   Primeros 5 ejemplos de departamentos desconocidos:")
            for error in errores_dpto[:5]:
                print(f"     - {error}")
            print(f"     ... y {len(errores_dpto) - 5} más")
    if asignaturas_vacias > 0:
        print(f"   • Filas omitidas (datos vacíos): {asignaturas_vacias}")

    # 4. Inserción Segura
    if datos_a_insertar:
        try:
            # ON CONFLICT (nombre, dpto): 
            # Si ya existe EXACTAMENTE ese nombre en ese Dpto, no hace nada (lo salta).
            # Si el nombre varía un poco ("Base" vs "Bases"), LO INSERTA (Cumple Regla #2).
            query = """
                INSERT INTO asignaturas (nombre, dpto)
                VALUES %s
                ON CONFLICT (nombre, dpto) DO NOTHING
                RETURNING id, nombre, dpto;
            """
            
            insertadas = execute_values(cursor, query, datos_a_insertar, fetch=True)
            connection.commit()
            
            cantidad_insertada = len(insertadas) if insertadas else 0
            cantidad_omitida = len(datos_a_insertar) - cantidad_insertada
            
            print(f"\n✅ INSERCIÓN FINALIZADA:")
            print(f"   • Asignaturas intentadas: {len(datos_a_insertar)}")
            print(f"   • Asignaturas insertadas: {cantidad_insertada} ✅")
            if cantidad_omitida > 0:
                print(f"   • Asignaturas omitidas (ya existían): {cantidad_omitida} ⚠️")
            
        except Exception as e:
            connection.rollback()
            print(f"\n❌ ERROR CRÍTICO durante la inserción:")
            print(f"   {e}")
            import traceback
            traceback.print_exc()
            print("\n💡 Consejo: Verifica que la tabla 'asignaturas' tenga la constraint única (nombre, dpto)")
    else:
        print("\n⚠️ No hay datos válidos para insertar.")

    cursor.close()