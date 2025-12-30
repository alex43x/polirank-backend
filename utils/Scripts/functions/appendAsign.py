from functions.helpFunctions import normalizar_para_comparacion, limpiar_nombre_asignatura

def insertAsign(connection, intoData):
    cursor = connection.cursor()
    
    print(f"🔄 Procesando {len(intoData)} registros de asignaturas...")
    
    # Cargamos mapa de departamentos 
    cursor.execute("SELECT id, siglas FROM departamentos")
    mapa_deptos = {sigla: id_dep for (id_dep, sigla) in cursor.fetchall()}
    
    if not mapa_deptos:
        print("❌ Error: No hay departamentos cargados.")
        return
    
    asignaturas_tup = []
    asignaturas_procesadas = set()
    errores = []
    
    for reg in intoData:
        cod_depto = str(reg[0]).strip() if reg[0] else ""
        nombre_sucio = str(reg[1]).strip() if reg[1] else ""
        
        # Validación básica
        if not cod_depto or not nombre_sucio:
            errores.append("Fila con datos incompletos")
            continue
        
        # Limpiar nombre
        nombre_limpio = limpiar_nombre_asignatura(nombre_sucio)
        if not nombre_limpio:
            errores.append(f"Nombre vacío después de limpiar: '{nombre_sucio}'")
            continue
        
        # Verificar departamento
        id_depto = mapa_deptos.get(cod_depto)
        if not id_depto:
            errores.append(f"Depto '{cod_depto}' no encontrado para '{nombre_limpio}'")
            continue
        
        # Verificar duplicado dentro del Excel
        clave_excel = f"{nombre_limpio.lower()}_{cod_depto}"
        if clave_excel in asignaturas_procesadas:
            continue
        asignaturas_procesadas.add(clave_excel)
        
        # Agregar para inserción
        asignaturas_tup.append((nombre_limpio, id_depto))
    
    # Insertar 
    inserts_realizados = 0
    if asignaturas_tup:
        try:
            cursor.executemany("INSERT IGNORE INTO asignaturas (nombre, dpto) VALUES (%s, %s)", asignaturas_tup)
            connection.commit()
            inserts_realizados = cursor.rowcount
        except Exception as e:
            connection.rollback()
            print(f"❌ Error al insertar asignaturas: {e}")
            return
    
    # ==========================================
    # REPORTE SIMPLIFICADO
    # ==========================================
    print(f"\n{'='*60}")
    print(f"📊 REPORTE: ASIGNATURAS")
    print(f"{'='*60}")
    
    print(f"📋 Registros en Excel: {len(intoData)}")
    print(f"🔍 Únicos en este archivo: {len(asignaturas_procesadas)}")
    print(f"✅ Nuevas insertadas: {inserts_realizados}")
    
    if errores:
        print(f"\n⚠️  Errores/omitidos: {len(errores)}")
        for i, error in enumerate(errores[:3], 1):
            print(f"   {i}. {error}")
        if len(errores) > 3:
            print(f"   ... y {len(errores) - 3} más")
    
    print(f"{'='*60}")