import psycopg2
from psycopg2.extras import execute_values
from functions.helpFunctions import (
    formatDoc,
    normalizar_nombre_comparacion,
    estandarizar_nombre_asignatura,
    generar_correo_generico
)


def insertSecciones(connection, intoData, year, periodo):
    """
    Inserta secciones y cursos desde datos de Excel en la base de datos.

    Formato esperado por fila:
        (nombre_asignatura, nombres_docente, apellidos_docente, correo_docente)

    Notas:
    - Si en una fila vienen varios docentes para la misma asignatura, deben venir
      separados por saltos de línea en las columnas de nombres/apellidos/correos.
      Se crea una sección (y curso) para cada docente, manteniendo la misma materia.
    - Se usan los correos como identificador principal del docente; si falta el
      correo se intenta un match por nombre normalizado.

    Procesa los datos para:
    1. Crear secciones (docente + asignatura) si no existen
    2. Crear cursos (sección + año + periodo) si no existen
    """
    cursor = connection.cursor()
    
    print(f"\n🔄 Procesando secciones y cursos para período {year}-{periodo}...")
    print(f"📋 Total de registros en Excel: {len(intoData)}")
    
    # ==========================================
    # 1. CARGA DE MAPAS (Memoria Caché)
    # ==========================================
    
    print("\n📚 Cargando datos de la base de datos...")
    
    try:
        # Cargar asignaturas: {nombre_normalizado: id}
        cursor.execute('SELECT id, nombre FROM asignaturas')
        mapa_asignaturas = {}
        for id_a, nom in cursor.fetchall():
            # Estandarizar el nombre para comparación
            nombre_estandarizado = estandarizar_nombre_asignatura(nom)
            nombre_normalizado = normalizar_nombre_comparacion(nombre_estandarizado)
            mapa_asignaturas[nombre_normalizado] = id_a
        
        print(f"   ✅ {len(mapa_asignaturas)} asignaturas cargadas")
        
        # Cargar docentes:
        #   - Por correo (clave principal)
        #   - Por nombre normalizado (respaldo si no hay correo en el Excel)
        cursor.execute('SELECT id, nombre, correo FROM docentes')
        mapa_docentes_correo = {}
        mapa_docentes_nombre = {}
        correos_existentes = set()
        for id_d, nom, cor in cursor.fetchall():
            if nom:
                nombre_normalizado = normalizar_nombre_comparacion(nom)
                if nombre_normalizado:
                    mapa_docentes_nombre[nombre_normalizado] = id_d
            if cor:
                correo_clave = cor.strip().lower()
                if correo_clave:
                    mapa_docentes_correo[correo_clave] = id_d
                    correos_existentes.add(correo_clave)
        
        print(f"   ✅ {len(mapa_docentes_nombre)} docentes cargados (por nombre)")
        print(f"   ✅ {len(mapa_docentes_correo)} docentes con correo registrado")
        
        # Cargar secciones existentes: {(docente_id, asignatura_id): seccion_id}
        cursor.execute('SELECT id, docente, asignatura FROM secciones')
        mapa_secciones = {}
        for id_s, doc, asig in cursor.fetchall():
            mapa_secciones[(doc, asig)] = id_s
        
        print(f"   ✅ {len(mapa_secciones)} secciones existentes cargadas")
        
        # Cargar cursos existentes: {(docente_id, asignatura_id, year, periodo): True}
        cursor.execute('''
            SELECT s.docente, s.asignatura, c.year, c.periodo 
            FROM cursos c
            JOIN secciones s ON c.seccion = s.id
        ''')
        cursos_existentes = set(cursor.fetchall())
        
        print(f"   ✅ {len(cursos_existentes)} cursos existentes cargados")
        
    except Exception as e:
        print(f"\n❌ ERROR al cargar datos de la base de datos: {e}")
        cursor.close()
        return
    
    # ==========================================
    # 2. PROCESAMIENTO DE DATOS DEL EXCEL
    # ==========================================
    
    print(f"\n🔍 Procesando {len(intoData)} registros del Excel...")
    
    secciones_nuevas = []      # Secciones a crear: [(docente_id, asignatura_id), ...]
    cursos_nuevos = []         # Cursos a crear: [(seccion_id, year, periodo), ...]
    errores = []
    avisos = []
    
    # Cache para evitar duplicados dentro del mismo Excel
    secciones_procesadas_excel = set()
    
    # Estadísticas
    stats = {
        'procesados': 0,
        'secciones_nuevas': 0,
        'cursos_nuevos': 0,
        'duplicados_bd': 0,
        'duplicados_excel': 0,
        'errores_asignatura': 0,
        'errores_docente': 0,
        'errores_datos': 0,
        'docentes_por_correo': 0,
        'docentes_por_nombre': 0,
        'docentes_por_correo_generado': 0,
        'docentes_sin_correo': 0
    }
    
    for idx, reg in enumerate(intoData, 1):
        # Validar que tenga los datos necesarios
        if not reg or len(reg) < 4:
            stats['errores_datos'] += 1
            errores.append(f"Fila {idx}: Datos insuficientes (se esperan Asignatura, Nombres, Apellidos, Correo)")
            continue
        
        # Extraer y limpiar datos base
        # Columnas esperadas desde app.py: [asignatura, apellidos, nombres, correos]
        nombre_asignatura_raw = str(reg[0]).strip() if reg[0] else ""
        apellidos_raw = str(reg[1]).strip() if reg[1] else ""
        nombres_raw = str(reg[2]).strip() if reg[2] else ""
        correos_raw = str(reg[3]).strip() if reg[3] else ""
        
        if not nombre_asignatura_raw:
            stats['errores_datos'] += 1
            errores.append(f"Fila {idx}: Asignatura vacía")
            continue
        
        # 1. Buscar asignatura (mismo formato que appendAsign)
        nombre_asignatura_estandarizado = estandarizar_nombre_asignatura(nombre_asignatura_raw)
        key_asignatura = normalizar_nombre_comparacion(nombre_asignatura_estandarizado)
        id_asignatura = mapa_asignaturas.get(key_asignatura)
        
        if not id_asignatura:
            stats['errores_asignatura'] += 1
            errores.append(f"Fila {idx}: Asignatura no encontrada: '{nombre_asignatura_raw}'")
            continue
        
        # 2. Separar docentes (soporta múltiples docentes en una sola fila)
        l_ap = [x.strip() for x in apellidos_raw.split('\n')] if apellidos_raw else []
        l_nom = [x.strip() for x in nombres_raw.split('\n')] if nombres_raw else []
        l_cor = [x.strip() for x in correos_raw.split('\n')] if correos_raw else []
        
        max_len = max(len(l_nom), len(l_ap), len(l_cor))
        if max_len == 0:
            stats['errores_docente'] += 1
            errores.append(f"Fila {idx}: No se proporcionaron docentes")
            continue
        
        def correos_genericos_candidatos(nombre_formateado):
            """
            Genera lista de correos genéricos candidatos (base + sufijos 2..10) para búsqueda.
            Se usa set() para evitar colisiones deterministas y poder reconstruir sufijos previos.
            """
            base = generar_correo_generico(nombre_formateado, set())
            if not base or '@' not in base:
                return []
            pref, dom = base.split('@', 1)
            candidatos = [base]
            for j in range(2, 11):
                candidatos.append(f"{pref}{j}@{dom}")
            return candidatos

        for i in range(max_len):
            nombre_parcial = l_nom[i] if i < len(l_nom) else ""
            apellido_parcial = l_ap[i] if i < len(l_ap) else ""
            correo_parcial = l_cor[i] if i < len(l_cor) else ""
            
            if not nombre_parcial and not apellido_parcial:
                stats['errores_docente'] += 1
                errores.append(f"Fila {idx}: Docente sin nombre/apellido en la posición {i + 1}")
                continue
            
            nombre_docente_formateado = formatDoc(nombre_parcial, apellido_parcial)
            if not nombre_docente_formateado:
                stats['errores_docente'] += 1
                errores.append(f"Fila {idx}: Error formateando docente en posición {i + 1}: '{nombre_parcial} {apellido_parcial}'")
                continue
            
            # 3. Buscar docente priorizando el correo
            id_docente = None
            correo_clave = correo_parcial.lower() if correo_parcial else ""
            candidatos_genericos = correos_genericos_candidatos(nombre_docente_formateado)

            if correo_clave:
                id_docente = mapa_docentes_correo.get(correo_clave)
                if id_docente:
                    stats['docentes_por_correo'] += 1
                else:
                    # Intentar correos genéricos (deterministas con posibles sufijos)
                    for cg in candidatos_genericos:
                        cg_key = cg.lower()
                        if cg_key in mapa_docentes_correo:
                            id_docente = mapa_docentes_correo[cg_key]
                            stats['docentes_por_correo_generado'] += 1
                            break
                    if not id_docente:
                        # Fallback a nombre si el correo (real o genérico) no está en BD
                        key_docente = normalizar_nombre_comparacion(nombre_docente_formateado)
                        id_docente = mapa_docentes_nombre.get(key_docente)
                        if id_docente:
                            stats['docentes_por_nombre'] += 1
                            avisos.append(f"Fila {idx}: Correo '{correo_parcial}' no encontrado, se usó match por nombre para '{nombre_docente_formateado}'")
                        else:
                            # No crear; sólo reportar
                            stats['errores_docente'] += 1
                            errores.append(f"Fila {idx}: Docente no encontrado por correo '{correo_parcial}', genéricos {candidatos_genericos} ni nombre '{nombre_docente_formateado}'")
                            continue
            else:
                stats['docentes_sin_correo'] += 1
                # Intentar correo genérico primero
                for cg in candidatos_genericos:
                    cg_key = cg.lower()
                    if cg_key in mapa_docentes_correo:
                        id_docente = mapa_docentes_correo[cg_key]
                        stats['docentes_por_correo_generado'] += 1
                        break
                if not id_docente:
                    key_docente = normalizar_nombre_comparacion(nombre_docente_formateado)
                    id_docente = mapa_docentes_nombre.get(key_docente)
                    if id_docente:
                        stats['docentes_por_nombre'] += 1
                    else:
                        stats['errores_docente'] += 1
                        errores.append(f"Fila {idx}: Docente sin correo no encontrado por genéricos {candidatos_genericos} ni por nombre '{nombre_docente_formateado}'")
                        continue
            
            # 4. Crear clave única (docente, asignatura) y manejar duplicados en Excel
            clave_seccion = (id_docente, id_asignatura)
            if clave_seccion in secciones_procesadas_excel:
                stats['duplicados_excel'] += 1
                continue
            
            secciones_procesadas_excel.add(clave_seccion)
            stats['procesados'] += 1
            
            # 5. Verificar si la sección ya existe en BD
            if clave_seccion in mapa_secciones:
                # La sección existe, obtener su ID
                id_seccion = mapa_secciones[clave_seccion]
                
                # Verificar si el curso ya existe
                curso_key = (id_docente, id_asignatura, year, periodo)
                if curso_key in cursos_existentes:
                    stats['duplicados_bd'] += 1
                else:
                    # La sección existe pero el curso no, crear curso
                    cursos_nuevos.append((id_seccion, year, periodo))
                    cursos_existentes.add(curso_key)  # Actualizar caché
                    stats['cursos_nuevos'] += 1
            else:
                # La sección no existe, crear sección y curso
                secciones_nuevas.append((id_docente, id_asignatura))
                stats['secciones_nuevas'] += 1
    
    # ==========================================
    # 3. INSERCIÓN EN BASE DE DATOS
    # ==========================================
    
    print(f"\n📊 RESUMEN DE PROCESAMIENTO:")
    print(f"   • Registros procesados exitosamente: {stats['procesados']}")
    print(f"   • Secciones nuevas a crear: {len(secciones_nuevas)}")
    print(f"   • Cursos nuevos a crear: {len(cursos_nuevos)}")
    print(f"   • Duplicados en BD (omitidos): {stats['duplicados_bd']}")
    print(f"   • Duplicados en Excel (omitidos): {stats['duplicados_excel']}")
    print(f"   • Errores totales: {len(errores)}")
    print(f"   • Avisos (coincidencia alternativa): {len(avisos)}")
    print(f"   • Docentes identificados por correo: {stats['docentes_por_correo']}")
    print(f"   • Docentes identificados por correo genérico: {stats['docentes_por_correo_generado']}")
    print(f"   • Docentes identificados por nombre: {stats['docentes_por_nombre']}")
    print(f"   • Registros sin correo en Excel: {stats['docentes_sin_correo']}")
    
    if not secciones_nuevas and not cursos_nuevos:
        print("\n⚠️ No hay datos nuevos para insertar.")
        cursor.close()
        return
    
    try:
        # Insertar nuevas secciones
        secciones_insertadas = 0
        secciones_ids_nuevas = {}  # Para mapear las nuevas secciones creadas
        
        if secciones_nuevas:
            print(f"\n📝 Insertando {len(secciones_nuevas)} nuevas secciones...")
            
            # Insertar secciones y obtener sus IDs
            query_secciones = """
                INSERT INTO secciones (docente, asignatura)
                VALUES %s
                ON CONFLICT (docente, asignatura) DO NOTHING
                RETURNING id, docente, asignatura;
            """
            
            secciones_insertadas_data = execute_values(
                cursor,
                query_secciones,
                secciones_nuevas,
                template="(%s, %s)",
                fetch=True
            )
            
            secciones_insertadas = len(secciones_insertadas_data) if secciones_insertadas_data else 0
            
            # Crear mapa de las nuevas secciones insertadas
            for id_s, doc, asig in (secciones_insertadas_data or []):
                secciones_ids_nuevas[(doc, asig)] = id_s
                # Actualizar mapa de secciones para cursos que se crearán después
                mapa_secciones[(doc, asig)] = id_s
            
            print(f"   ✅ {secciones_insertadas} secciones insertadas")
            
            # Si algunas secciones ya existían (conflicto), obtener sus IDs
            if secciones_insertadas < len(secciones_nuevas):
                secciones_no_insertadas = len(secciones_nuevas) - secciones_insertadas
                print(f"   ⚠️ {secciones_no_insertadas} secciones ya existían (omitidas)")
                
                # Obtener IDs de las secciones que ya existían
                for doc_id, asig_id in secciones_nuevas:
                    if (doc_id, asig_id) not in secciones_ids_nuevas:
                        # Buscar en BD
                        cursor.execute(
                            "SELECT id FROM secciones WHERE docente = %s AND asignatura = %s",
                            (doc_id, asig_id)
                        )
                        result = cursor.fetchone()
                        if result:
                            id_seccion_existente = result[0]
                            secciones_ids_nuevas[(doc_id, asig_id)] = id_seccion_existente
                            mapa_secciones[(doc_id, asig_id)] = id_seccion_existente
        
        # Crear cursos para secciones nuevas (las que acabamos de crear)
        cursos_de_secciones_nuevas = []
        for doc_id, asig_id in secciones_nuevas:
            if (doc_id, asig_id) in secciones_ids_nuevas:
                id_seccion = secciones_ids_nuevas[(doc_id, asig_id)]
                cursos_de_secciones_nuevas.append((id_seccion, year, periodo))
        
        # Insertar cursos (tanto de secciones nuevas como existentes)
        cursos_totales = cursos_de_secciones_nuevas + cursos_nuevos
        cursos_insertados = 0
        
        if cursos_totales:
            print(f"\n📝 Insertando {len(cursos_totales)} cursos...")
            
            query_cursos = """
                INSERT INTO cursos (seccion, year, periodo)
                VALUES %s
                ON CONFLICT (seccion, year, periodo) DO NOTHING
                RETURNING id, seccion, year, periodo;
            """
            
            cursos_insertados_data = execute_values(
                cursor,
                query_cursos,
                cursos_totales,
                template="(%s, %s, %s)",
                fetch=True
            )
            
            cursos_insertados = len(cursos_insertados_data) if cursos_insertados_data else 0
            print(f"   ✅ {cursos_insertados} cursos insertados")
            
            if cursos_insertados < len(cursos_totales):
                cursos_duplicados = len(cursos_totales) - cursos_insertados
                print(f"   ⚠️ {cursos_duplicados} cursos ya existían (omitidos)")
        
        # Commit de todos los cambios
        connection.commit()
        
        # ==========================================
        # 4. REPORTE FINAL
        # ==========================================
        
        print(f"\n{'='*70}")
        print(f"✅ PROCESO FINALIZADO - PERÍODO {year}-{periodo}")
        print(f"{'='*70}")
        
        print(f"\n📊 ESTADÍSTICAS FINALES:")
        print(f"   • Secciones nuevas creadas: {secciones_insertadas}")
        print(f"   • Cursos nuevos creados: {cursos_insertados}")
        print(f"   • Total de cursos creados: {cursos_insertados}")
        
        print(f"\n⚠️ OMISIONES:")
        print(f"   • Duplicados en BD: {stats['duplicados_bd']}")
        print(f"   • Duplicados en Excel: {stats['duplicados_excel']}")
        
        print(f"\n❌ ERRORES:")
        print(f"   • Asignaturas no encontradas: {stats['errores_asignatura']}")
        print(f"   • Docentes no encontrados: {stats['errores_docente']}")
        print(f"   • Datos inválidos: {stats['errores_datos']}")
        
        # Mostrar primeros errores si los hay
        if errores:
            print(f"\n🔍 DETALLE DE ERRORES (primeros 10):")
            for i, error in enumerate(errores[:10], 1):
                print(f"   {i}. {error}")
            if len(errores) > 10:
                print(f"   ... y {len(errores) - 10} errores más")
        
        # Mostrar avisos (coincidencias por nombre o correo genérico cuando el correo dado no coincidió)
        if avisos:
            print(f"\nℹ️ AVISOS (primeros 10):")
            for i, aviso in enumerate(avisos[:10], 1):
                print(f"   {i}. {aviso}")
            if len(avisos) > 10:
                print(f"   ... y {len(avisos) - 10} avisos más")
        
        print(f"{'='*70}\n")
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ ERROR CRÍTICO durante la inserción:")
        print(f"   {e}")
        import traceback
        traceback.print_exc()
        print(f"\n   ⚠️ Se ha realizado rollback de todos los cambios.")
    
    finally:
        cursor.close()

