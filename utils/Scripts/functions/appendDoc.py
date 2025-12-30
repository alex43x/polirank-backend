from functions.helpFunctions import formatDoc

def insertDoc(connection, intoData):
    cursor = connection.cursor()
    docTup = []
    
    print(f"🔄 Procesando {len(intoData)} registros de docentes...")
    
    # Estadísticas básicas
    total_procesados = len(intoData)
    docentes_procesados = set()  # Para duplicados dentro del Excel
    
    errores = []
    
    for doc in intoData:
        # Limpieza básica
        nombre_raw = str(doc[1]).strip() if doc[1] else ""
        apellido_raw = str(doc[0]).strip() if doc[0] else ""
        
        # Validación básica
        if not nombre_raw or not apellido_raw:
            errores.append(f"Datos incompletos: Nom='{doc[1]}', Ap='{doc[0]}'")
            continue
        
        # Formatear nombre
        nombre_formateado = formatDoc(nombre_raw, apellido_raw)
        
        if not nombre_formateado:
            errores.append(f"Formato inválido: '{nombre_raw}' '{apellido_raw}'")
            continue
        
        # Verificar duplicado dentro del mismo Excel
        clave_excel = nombre_formateado.lower()
        if clave_excel in docentes_procesados:
            continue  # Ya procesado en este Excel
        docentes_procesados.add(clave_excel)
        
        # Agregar para inserción 
        docTup.append((nombre_formateado,))
    
    # Insertar
    inserts_realizados = 0
    if docTup:
        try:
            query = "INSERT IGNORE INTO docentes (nombre) VALUES (%s)"
            cursor.executemany(query, docTup)
            connection.commit()
            inserts_realizados = cursor.rowcount
        except Exception as e:
            connection.rollback()
            print(f"❌ Error al insertar docentes: {e}")
            return
    
    # ==========================================
    # REPORTE SIMPLIFICADO
    # ==========================================
    print(f"\n{'='*60}")
    print(f"📊 REPORTE: DOCENTES")
    print(f"{'='*60}")
    
    print(f"📋 Registros en Excel: {total_procesados}")
    print(f"🔍 Únicos en este archivo: {len(docentes_procesados)}")
    print(f"✅ Nuevos insertados: {inserts_realizados}")
    
    if errores:
        print(f"\n⚠️  Errores/omitidos: {len(errores)}")
        for i, error in enumerate(errores[:3], 1):
            print(f"   {i}. {error}")
        if len(errores) > 3:
            print(f"   ... y {len(errores) - 3} más")
    
    if inserts_realizados > 0:
        print(f"\n🎯 ¡ÉXITO! Se agregaron {inserts_realizados} nuevos docentes")
    else:
        print(f"\nℹ️  No se encontraron docentes nuevos para insertar")
    
    print(f"{'='*60}")

    

    
    