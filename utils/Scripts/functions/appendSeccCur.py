from functions.helpFunctions import formatDoc, normalizar_para_comparacion, limpiar_nombre_asignatura


def insertSecciones(connection, intoData, year, periodo):
    cursor = connection.cursor()
    print(f"🔄 Cargando Secciones {year}-{periodo}...")

    # ==========================================
    # 1. CARGA DE MAPAS (Memoria Caché)
    # ==========================================
    
    # Asignaturas
    cursor.execute('SELECT id, nombre FROM asignaturas')
    mapa_asignaturas = {normalizar_para_comparacion(nom): id_a for id_a, nom in cursor.fetchall()}

    # Docentes
    cursor.execute('SELECT id, nombre FROM docentes')
    mapa_docentes = {nom.strip().lower(): id_d for id_d, nom in cursor.fetchall()}

    # Secciones Existentes: {(docente_id, asignatura_id): id_seccion_real}
    cursor.execute('SELECT id, docente, asignatura FROM secciones')
    mapa_secciones = {}
    for id_s, doc, asig in cursor.fetchall():
        mapa_secciones[(doc, asig)] = id_s

    # Cursos Existentes: Para no intentar crear duplicados
    cursor.execute('''
        SELECT s.docente, s.asignatura, c.year, c.periodo 
        FROM cursos c
        JOIN secciones s ON c.seccion = s.id
    ''')
    cursos_existentes = set(cursor.fetchall())

    # ==========================================
    # 2. CLASIFICACIÓN DE DATOS
    # ==========================================
    secciones_nuevas_trigger = []   # Usarán el Trigger
    cursos_manuales = []            # Usarán INSERT directo
    errores = []
    
    # Cache temporal para manejar duplicados dentro del mismo Excel
    secciones_procesadas_en_este_excel = set()
    
    stats = {
        'nuevas': 0, 
        'existentes_curso_nuevo': 0, 
        'duplicados': 0, 
        'ignorados_excel': 0,
        'errores_asignatura': 0,
        'errores_docente': 0
    }

    for reg in intoData:
        # --- A. Limpieza de Datos ---
        nombre_limpio = limpiar_nombre_asignatura(reg[0])
        key_materia = normalizar_para_comparacion(nombre_limpio)
        id_asignatura = mapa_asignaturas.get(key_materia)

        id_docente = None
        nombre_docente = formatDoc(reg[2], reg[1])
        if nombre_docente:
            id_docente = mapa_docentes.get(nombre_docente.lower())

        if not id_asignatura:
            stats['errores_asignatura'] += 1
            errores.append(f"Asignatura no encontrada: '{nombre_limpio}'")
            continue
            
        if not id_docente:
            stats['errores_docente'] += 1
            errores.append(f"Docente no encontrado: '{nombre_docente}' para '{nombre_limpio}'")
            continue

        clave = (id_docente, id_asignatura)
        
        # --- B. Verificar duplicados dentro del mismo Excel ---
        if clave in secciones_procesadas_en_este_excel:
            stats['ignorados_excel'] += 1
            continue  # Ya procesamos esta combinación en este Excel
        secciones_procesadas_en_este_excel.add(clave)

        # --- C. Lógica de Decisión ---
        
        # CASO 1: ¿La sección YA existe en la BASE DE DATOS?
        if clave in mapa_secciones:
            id_seccion_real = mapa_secciones[clave]

            # CASO 1.1: Sección vieja. ¿Ya tiene curso este periodo?
            if (id_docente, id_asignatura, year, periodo) in cursos_existentes:
                stats['duplicados'] += 1
            else:
                # CASO 1.2: Sección vieja, periodo nuevo -> INSERT MANUAL
                cursos_manuales.append((id_seccion_real, year, periodo))
                stats['existentes_curso_nuevo'] += 1
                # Actualizamos caché para evitar duplicados en este loop
                cursos_existentes.add((id_docente, id_asignatura, year, periodo))

        # CASO 2: La sección es totalmente NUEVA (no existe en BD)
        else:
            # La agregamos para insertar en secciones (usará trigger)
            secciones_nuevas_trigger.append((id_docente, id_asignatura))
            stats['nuevas'] += 1
            
            # NO la agregamos a mapa_secciones porque aún no existe en BD
            # Se agregará después de la inserción

    # ==========================================
    # 3. EJECUCIÓN EN BASE DE DATOS
    # ==========================================
    try:
        inserts_trigger = 0
        inserts_manual = 0

        # GRUPO A: Nuevas Secciones -> Usamos Variables + Trigger
        if secciones_nuevas_trigger:
            # 1. Declarar variables de sesión para el TRIGGER
            cursor.execute(f"SET @year_sesion = {int(year)}")
            cursor.execute(f"SET @periodo_sesion = {int(periodo)}")
            
            # 2. Insertar nuevas secciones (El trigger creará automáticamente los cursos)
            sql = "INSERT INTO secciones (docente, asignatura) VALUES (%s, %s)"
            cursor.executemany(sql, secciones_nuevas_trigger)
            inserts_trigger = cursor.rowcount
            
            # 3. Limpiar variables INMEDIATAMENTE (Seguridad)
            cursor.execute("SET @year_sesion = NULL")
            cursor.execute("SET @periodo_sesion = NULL")

        # GRUPO B: Secciones existentes -> Insertamos curso manualmente
        if cursos_manuales:
            # OPTIMIZACIÓN: Eliminado el bucle SELECT 1. Confiamos en la memoria + INSERT IGNORE
            sql = "INSERT IGNORE INTO cursos (seccion, year, periodo) VALUES (%s, %s, %s)"
            cursor.executemany(sql, cursos_manuales)
            inserts_manual = cursor.rowcount

        connection.commit()

        # ==========================================
        # 4. REPORTE DETALLADO
        # ==========================================
        print(f"\n{'='*60}")
        print(f"📊 RESULTADO FINAL - PERIODO {year}-{periodo}")
        print(f"{'='*60}")
        
        print(f"📋 TOTAL REGISTROS EXCEL: {len(intoData)}")
        print(f"🔍 REGISTROS ÚNICOS PROCESADOS: {len(secciones_procesadas_en_este_excel)}")
        
        print(f"\n📚 SECCIONES:")
        print(f"   • 🆕 Nuevas creadas (via trigger): {inserts_trigger}")
        print(f"   • 🔄 Cursos para secciones existentes: {inserts_manual}")
        
        print(f"\n⚠️  OMISIONES:")
        print(f"   • Duplicados en BD (sección + curso ya existían): {stats['duplicados']}")
        print(f"   • Repetidos dentro del mismo Excel: {stats['ignorados_excel']}")
        
        print(f"\n❌ ERRORES:")
        print(f"   • Asignaturas no encontradas: {stats['errores_asignatura']}")
        print(f"   • Docentes no encontrados: {stats['errores_docente']}")
        
        print(f"\n🎯 RESUMEN:")
        total_cursos = inserts_trigger + inserts_manual
        if total_cursos > 0:
            print(f"   ✅ ¡ÉXITO! Se crearon {total_cursos} cursos en total")
            print(f"      ↳ {inserts_trigger} via trigger (secciones nuevas)")
            print(f"      ↳ {inserts_manual} manualmente (secciones existentes)")
        else:
            print(f"   ℹ️  No se crearon nuevos cursos")
        
        # Mostrar primeros 5 errores si los hay
        if errores:
            print(f"\n🔍 DETALLE DE ERRORES (primeros 5):")
            for i, error in enumerate(errores[:5], 1):
                print(f"   {i}. {error}")
            if len(errores) > 5:
                print(f"   ... y {len(errores) - 5} más")
        
        print(f"{'='*60}")

    except Exception as e:
        connection.rollback()
        print(f"\n❌ ERROR DURANTE LA INSERCIÓN: {e}")
        print(f"   Se ha realizado rollback de todos los cambios.")
        
        # Limpieza de emergencia de variables globales
        try:
            cursor.execute("SET @year_sesion = NULL")
            cursor.execute("SET @periodo_sesion = NULL")
        except:
            pass # Ignorar errores al limpiar
        