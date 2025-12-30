from functions.helpFunctions import normalizar_para_comparacion




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