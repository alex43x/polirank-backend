from functions.helpFunctions import normalizar_para_comparacion, limpiar_nombre_asignatura

def insertMalla(connection, intoData):
    cursor = connection.cursor()
    
    print(f"🔄 Procesando {len(intoData)} registros de malla...")
    
    # Estadísticas
    stats = {
        'total_registros': len(intoData),
        'insertados': 0,
        'omitidos': 0,
        'errores_asignatura': 0,
        'errores_carrera': 0,
        'duplicados': 0,
        'semestre_invalido': 0
    }
    
    errores = []
    registros_procesados_excel = set()  # Para duplicados dentro del mismo Excel
    
    # 1. Mapa Carreras
    cursor.execute('SELECT id, nombre FROM carreras')
    mapa_carreras = {}
    for (id_carr, nombre) in cursor.fetchall():
        clave_clean = " ".join(nombre.split()).lower()
        mapa_carreras[clave_clean] = id_carr
    
    # 2. Mapa Asignaturas
    cursor.execute('SELECT id, nombre FROM asignaturas')
    mapa_asignaturas = {}
    for (id_asig, nombre) in cursor.fetchall():
        clave_norm = normalizar_para_comparacion(nombre)
        mapa_asignaturas[clave_norm] = id_asig
    
    # 3. Malla existente
    cursor.execute('SELECT carrera, asignatura FROM malla')
    malla_existente = set(cursor.fetchall())
    
    datos_para_insertar = []
    
    for reg in intoData:
        nombre_materia_sucio = str(reg[0]).strip() if reg[0] else ""
        nombre_carrera_sucio = str(reg[1]).strip() if reg[1] else ""
        semestre_str = str(reg[2]).strip() if reg[2] else ""
        
        # Validación básica
        if not nombre_materia_sucio or not nombre_carrera_sucio or not semestre_str:
            stats['omitidos'] += 1
            continue
        
        # Convertir semestre
        try:
            semestre = int(semestre_str)
            if semestre <= 0:
                stats['semestre_invalido'] += 1
                continue
        except:
            stats['semestre_invalido'] += 1
            continue
        
        # Limpiar y normalizar
        nombre_materia_limpio = limpiar_nombre_asignatura(nombre_materia_sucio)
        key_materia = normalizar_para_comparacion(nombre_materia_limpio)
        key_carrera = " ".join(nombre_carrera_sucio.split()).lower()
        
        # Verificar duplicado dentro del mismo Excel
        clave_excel = f"{key_materia}_{key_carrera}_{semestre}"
        if clave_excel in registros_procesados_excel:
            stats['omitidos'] += 1
            continue
        registros_procesados_excel.add(clave_excel)
        
        # Buscar IDs
        id_asignatura = mapa_asignaturas.get(key_materia)
        id_carrera = mapa_carreras.get(key_carrera)
        
        # Validaciones
        if not id_asignatura:
            stats['errores_asignatura'] += 1
            errores.append(f"Asignatura no encontrada: '{nombre_materia_limpio}' (Key: {key_materia})")
            continue
            
        if not id_carrera:
            stats['errores_carrera'] += 1
            errores.append(f"Carrera no encontrada: '{nombre_carrera_sucio}' (Key: {key_carrera})")
            continue
        
        # Verificar si ya existe en BD
        if (id_carrera, id_asignatura) in malla_existente:
            stats['duplicados'] += 1
        else:
            datos_para_insertar.append((id_carrera, id_asignatura, semestre))
            malla_existente.add((id_carrera, id_asignatura))
            stats['insertados'] += 1
    
    # Insertar
    inserts_realizados = 0
    if datos_para_insertar:
        sql = "INSERT IGNORE INTO malla (carrera, asignatura, semestre) VALUES (%s, %s, %s)"
        try:
            cursor.executemany(sql, datos_para_insertar)
            connection.commit()
            inserts_realizados = cursor.rowcount
        except Exception as e:
            connection.rollback()
            print(f"❌ Error crítico al insertar malla: {e}")
            return
    
    # ==========================================
    # REPORTE DETALLADO
    # ==========================================
    print(f"\n{'='*60}")
    print(f"📊 REPORTE: INSERCIÓN DE MALLA CURRICULAR")
    print(f"{'='*60}")
    
    print(f"📋 TOTAL REGISTROS EXCEL: {stats['total_registros']}")
    print(f"🔍 REGISTROS ÚNICOS PROCESADOS: {len(registros_procesados_excel)}")
    
    print(f"\n✅ INSERTADOS:")
    print(f"   • Nuevas relaciones malla insertadas: {inserts_realizados}")
    
    print(f"\n⚠️  OMITIDOS:")
    print(f"   • Duplicados en BD: {stats['duplicados']}")
    print(f"   • Asignatura no encontrada: {stats['errores_asignatura']}")
    print(f"   • Carrera no encontrada: {stats['errores_carrera']}")
    print(f"   • Semestre inválido: {stats['semestre_invalido']}")
    
    print(f"\n🎯 RESUMEN:")
    if inserts_realizados > 0:
        print(f"   ✅ ¡ÉXITO! Se insertaron {inserts_realizados} nuevas relaciones de malla")
        print(f"      ↳ Carreras cubiertas: {len(set(c[0] for c in datos_para_insertar))}")
        print(f"      ↳ Asignaturas incluidas: {len(set(c[1] for c in datos_para_insertar))}")
    else:
        print(f"   ℹ️  No se insertaron nuevas relaciones de malla")
    
    # Mostrar primeros 5 errores
    if errores:
        print(f"\n❌ ERRORES DE COINCIDENCIA (primeros 5):")
        for i, error in enumerate(errores[:5], 1):
            print(f"   {i}. {error}")
        if len(errores) > 5:
            print(f"   ... y {len(errores) - 5} más")
    
    print(f"{'='*60}")
    
    return {
        'insertadas': inserts_realizados,
        'estadisticas': stats,
        'errores': errores[:10]
    }