import psycopg2
import psycopg2.extras
from functions.helpFunctions import (
    formatDoc, 
    detectar_duplicados_por_nombre, 
    preferir_correo_institucional,
    extraer_nombre_clave,
    nombres_similares,
    normalizar_nombre_comparacion,
    generar_correo_generico,
    es_correo_institucional
)

def insertDoc(connection, intoData):
    cursor = connection.cursor()
    docentes = []
    
    print(f"\n🔍 Procesando {len(intoData)} filas del Excel...")
    
    # Contadores para estadísticas
    estadisticas = {
        'total_filas': len(intoData),
        'docentes_procesados': 0,
        'sin_correo': 0,  # Cambiado de 'correos_generados' a 'sin_correo'
        'errores_formato': 0
    }
    
    # Diccionario para rastrear correos generados y evitar colisiones
    correos_generados_unicos = {}
    
    for idx, reg in enumerate(intoData):
        # Limpieza básica
        raw_ap = str(reg[0]).strip() if reg[0] else ""
        raw_nom = str(reg[1]).strip() if reg[1] else ""
        raw_cor = str(reg[2]).strip() if reg[2] else ""

        # CORRECCIÓN 1: NO filtrar vacíos durante split para mantener alineación índice por índice
        # Mantener todas las posiciones (incluso vacías) para preservar correspondencia
        l_ap = [x.strip() for x in raw_ap.split('\n')] if raw_ap else []
        l_nom = [x.strip() for x in raw_nom.split('\n')] if raw_nom else []
        l_cor = [x.strip() for x in raw_cor.split('\n')] if raw_cor else []

        # CORRECCIÓN 1: Validar que las listas tengan el mismo tamaño
        # Si hay desalineación, usar el tamaño mínimo y rellenar con vacío
        if l_ap or l_nom or l_cor:
            # Determinar el tamaño real (máximo entre las listas que tienen datos)
            tamanos = []
            if l_ap: tamanos.append(len(l_ap))
            if l_nom: tamanos.append(len(l_nom))
            if l_cor: tamanos.append(len(l_cor))
            
            if tamanos:
                max_len = max(tamanos)
            else:
                max_len = 0
            
            # Procesar cada línea, validando que haya datos válidos
            for i in range(max_len):
                # CORRECCIÓN: Usar cadena vacía si la lista es más corta, NO el último elemento
                ap_final = l_ap[i] if i < len(l_ap) else ""
                nom_final = l_nom[i] if i < len(l_nom) else ""
                cor_final = l_cor[i] if i < len(l_cor) else ""

                # Solo procesar si hay al menos nombre o apellido
                if ap_final or nom_final:
                    try:
                        # Formatear nombre completo
                        nom_app = formatDoc(nom_final, ap_final)
                        if not nom_app:
                            estadisticas['errores_formato'] += 1
                            continue
                            
                    except Exception as e:
                        estadisticas['errores_formato'] += 1
                        continue

                    # Si no hay correo, lo marcaremos para generar uno genérico después
                    if cor_final == "":
                        cor_final = None  # Se generará correo genérico después
                        estadisticas['sin_correo'] += 1
                    
                    # Solo agregar si hay nombre válido (correo puede ser None temporalmente)
                    docentes.append((nom_app, cor_final))
                    estadisticas['docentes_procesados'] += 1

    # Mostrar estadísticas preliminares
    print(f"📊 ESTADÍSTICAS PRELIMINARES:")
    print(f"   • Filas totales en Excel: {estadisticas['total_filas']}")
    print(f"   • Docentes procesados: {estadisticas['docentes_procesados']}")
    print(f"   • Docentes sin correo: {estadisticas['sin_correo']}")
    if estadisticas['errores_formato'] > 0:
        print(f"   • Errores de formato: {estadisticas['errores_formato']}")

    # ============ OBTENER CORREOS EXISTENTES PARA GENERAR CORREOS GENÉRICOS ÚNICOS ============
    correos_existentes_bd = set()
    try:
        cursor.execute("SELECT correo FROM docentes WHERE correo IS NOT NULL")
        correos_existentes_bd = {row[0] for row in cursor.fetchall()}
    except Exception as e:
        print(f"⚠️  Advertencia: No se pudieron obtener correos existentes: {e}")
        # Continuar con conjunto vacío

    # ============ GENERAR CORREOS GENÉRICOS PARA DOCENTES SIN CORREO ============
    if estadisticas['sin_correo'] > 0:
        print(f"\n🔧 Generando correos genéricos para {estadisticas['sin_correo']} docentes sin correo...")
        correos_generados_count = 0
        docentes_con_correo_generico = []  # Lista para mostrar después
        
        # Agregar correos existentes en el archivo actual al conjunto
        correos_en_archivo = {correo for _, correo in docentes if correo}
        correos_existentes_bd.update(correos_en_archivo)
        
        # Generar correos genéricos para docentes sin correo
        docentes_con_correos_genericos = []
        for nombre, correo in docentes:
            if correo is None:
                correo_generico = generar_correo_generico(nombre, correos_existentes_bd)
                correos_existentes_bd.add(correo_generico)  # Agregar al conjunto para evitar duplicados
                docentes_con_correos_genericos.append((nombre, correo_generico))
                docentes_con_correo_generico.append((nombre, correo_generico))
                correos_generados_count += 1
            else:
                docentes_con_correos_genericos.append((nombre, correo))
        
        docentes = docentes_con_correos_genericos
        
        # Mostrar todos los docentes que recibieron correo genérico
        if docentes_con_correo_generico:
            print(f"\n📧 DOCENTES CON CORREO GENÉRICO GENERADO ({len(docentes_con_correo_generico)}):")
            print("=" * 70)
            for nombre, correo_gen in docentes_con_correo_generico:
                nombre_display = nombre[:40] + "..." if len(nombre) > 40 else nombre
                print(f"   • {nombre_display}")
                print(f"     └─ {correo_gen}")
            print("=" * 70)
        
        print(f"✅ Se generaron {correos_generados_count} correos genéricos.")

    # ============ DETECCIÓN Y MANEJO DE DUPLICADOS ============
    if docentes:
        print(f"\n🔍 Buscando duplicados entre {len(docentes)} registros...")
        
        # Verificar duplicados internos en el archivo
        duplicados = detectar_duplicados_por_nombre(docentes)
        
        if duplicados:
            print(f"⚠️  Se encontraron {len(duplicados)} duplicados en el archivo.")
            
            # MODO AUTOMÁTICO: Consolidar automáticamente basado en reglas
            indices_omitidos = set()
            consolidaciones = []
            
            for dup in duplicados:
                correo_preferido = preferir_correo_institucional(
                    dup['correo_duplicado'], 
                    dup['correo_actual']
                )
                
                # Actualizar el registro original con el correo preferido
                idx_original = dup['duplicado_de']
                nombre_original, _ = docentes[idx_original]
                docentes[idx_original] = (nombre_original, correo_preferido)
                
                # Marcar el duplicado para omitir
                indices_omitidos.add(dup['indice_actual'])
                
                consolidaciones.append({
                    'nombre': dup['nombre_duplicado'],
                    'correo_mantenido': correo_preferido,
                    'correo_omitido': dup['correo_actual']
                })
            
            # Filtrar lista omitiendo los duplicados
            docentes_filtrados = []
            for i, docente in enumerate(docentes):
                if i not in indices_omitidos:
                    docentes_filtrados.append(docente)
            
            docentes = docentes_filtrados
            
            # Mostrar resumen de consolidaciones
            if consolidaciones:
                print(f"\n📊 RESUMEN DE CONSOLIDACIONES AUTOMÁTICAS:")
                print("=" * 50)
                for cons in consolidaciones[:3]:  # Mostrar solo primeros 3
                    nombre_display = cons['nombre'][:30] + "..." if len(cons['nombre']) > 30 else cons['nombre']
                    print(f"• {nombre_display}")
                    correo_mant = cons['correo_mantenido'][:25] + "..." if len(cons['correo_mantenido']) > 25 else cons['correo_mantenido']
                    correo_omit = cons['correo_omitido'][:25] + "..." if len(cons['correo_omitido']) > 25 else cons['correo_omitido']
                    print(f"  ✓ Mantenido: {correo_mant}")
                    print(f"  ✗ Omitido: {correo_omit}")
                
                if len(consolidaciones) > 3:
                    print(f"   ... y {len(consolidaciones) - 3} consolidaciones más")
                
                print(f"\n✅ Se filtraron automáticamente {len(indices_omitidos)} duplicados.")
        else:
            print("✅ No se encontraron duplicados en el archivo.")
        
        # ============ VERIFICAR DUPLICADOS EN LA BASE DE DATOS ============
        print(f"\n🔍 Verificando duplicados en la base de datos...")
        
        try:
            # Obtener nombres y correos existentes en la BD
            cursor.execute("SELECT id, nombre, correo FROM docentes")
            docentes_existentes = cursor.fetchall()
            
            if docentes_existentes:
                # Crear estructuras para búsqueda eficiente
                # Mapa de nombre_normalizado -> lista de (id, nombre_completo, correo)
                nombres_normalizados_bd = {}
                correos_existentes = {}
                
                for id_bd, nombre_bd, correo_bd in docentes_existentes:
                    if nombre_bd:
                        nombre_normalizado = normalizar_nombre_comparacion(nombre_bd)
                        if nombre_normalizado not in nombres_normalizados_bd:
                            nombres_normalizados_bd[nombre_normalizado] = []
                        nombres_normalizados_bd[nombre_normalizado].append((id_bd, nombre_bd, correo_bd))
                    if correo_bd:
                        correos_existentes[correo_bd] = (id_bd, nombre_bd)
                
                duplicados_en_bd = []
                docentes_finales = []
                docentes_a_actualizar = []  # Para actualizar correos de registros existentes
                
                for nombre, correo in docentes:
                    es_duplicado = False
                    tipo_duplicado = None
                    id_existente = None
                    correo_existente = None
                    
                    # 1. Verificar duplicado por correo (más estricto)
                    if correo and correo in correos_existentes:
                        es_duplicado = True
                        tipo_duplicado = "correo"
                        id_existente = correos_existentes[correo][0]
                        correo_existente = correo
                    else:
                        # 2. Verificar duplicado por nombre completo normalizado
                        nombre_normalizado = normalizar_nombre_comparacion(nombre)
                        if nombre_normalizado in nombres_normalizados_bd:
                            # Si el nombre normalizado coincide exactamente, es duplicado
                            for id_bd, nombre_bd, correo_bd in nombres_normalizados_bd[nombre_normalizado]:
                                # Verificar si son realmente similares
                                if nombres_similares(nombre, nombre_bd):
                                    es_duplicado = True
                                    tipo_duplicado = "nombre"
                                    id_existente = id_bd
                                    correo_existente = correo_bd
                                    
                                    # Detectar si el correo actual es genérico (con o sin sufijo numérico)
                                    correo_generico_esperado = generar_correo_generico(nombre_bd, set())
                                    es_correo_generico_actual = False
                                    if correo_bd and correo_generico_esperado and '@' in correo_generico_esperado:
                                        correo_lower = correo_bd.lower()
                                        base_local, base_dom = correo_generico_esperado.lower().split('@', 1)
                                        if correo_lower == correo_generico_esperado.lower():
                                            es_correo_generico_actual = True
                                        elif correo_lower.endswith('@' + base_dom) and correo_lower.startswith(base_local):
                                            sufijo = correo_lower[len(base_local):-(len(base_dom) + 1)]
                                            if sufijo.isdigit():
                                                es_correo_generico_actual = True
                                    
                                    # Si el existente tiene correo genérico (con o sin sufijo) o no institucional y el nuevo es institucional, actualizar
                                    if correo_bd and es_correo_institucional(correo) and (not es_correo_institucional(correo_bd) or es_correo_generico_actual):
                                        docentes_a_actualizar.append((id_bd, correo, nombre_bd, correo_bd))
                                    # Si el existente no tiene correo y el nuevo sí, actualizar
                                    elif not correo_bd and correo:
                                        docentes_a_actualizar.append((id_bd, correo, nombre_bd, None))
                                    break
                    
                    if es_duplicado:
                        duplicados_en_bd.append((nombre, correo, tipo_duplicado, id_existente, correo_existente))
                    else:
                        docentes_finales.append((nombre, correo))
                
                if duplicados_en_bd:
                    print(f"⚠️  Se encontraron {len(duplicados_en_bd)} registros que ya existen en la BD:")
                    for duplicado in duplicados_en_bd[:3]:
                        nombre, correo, tipo, id_existente, correo_existente = duplicado if len(duplicado) == 5 else (*duplicado, None)
                        nombre_display = nombre[:25] + "..." if len(nombre) > 25 else nombre
                        correo_display = (correo[:20] + "..." if len(correo) > 20 else correo) if correo else "NULL"
                        print(f"   • {nombre_display} ({correo_display}) - Duplicado por {tipo} (ID: {id_existente})")
                    
                    if len(duplicados_en_bd) > 3:
                        print(f"   ... y {len(duplicados_en_bd) - 3} más")
                    
                    docentes = docentes_finales
                
                # Actualizar correos de registros existentes (genéricos -> institucionales, o NULL -> cualquier correo)
                if docentes_a_actualizar:
                    print(f"\n📝 Actualizando correos de {len(docentes_a_actualizar)} registros existentes...")
                    
                    # Separar actualizaciones: genéricos -> institucionales vs otros
                    actualizaciones_generico_a_institucional = []
                    otras_actualizaciones = []
                    
                    for id_bd, correo_nuevo, nombre_bd, correo_anterior in docentes_a_actualizar:
                        es_generico_a_institucional = (
                            correo_anterior and 
                            not es_correo_institucional(correo_anterior) and 
                            es_correo_institucional(correo_nuevo)
                        )
                        if es_generico_a_institucional:
                            actualizaciones_generico_a_institucional.append((id_bd, correo_nuevo, nombre_bd, correo_anterior))
                        else:
                            otras_actualizaciones.append((id_bd, correo_nuevo, nombre_bd, correo_anterior))
                    
                    # Mostrar actualizaciones de genérico a institucional primero (destacadas)
                    if actualizaciones_generico_a_institucional:
                        print(f"\n🔄 ACTUALIZACIÓN: CORREO GENÉRICO → INSTITUCIONAL ({len(actualizaciones_generico_a_institucional)}):")
                        print("=" * 70)
                        for id_bd, correo_nuevo, nombre_bd, correo_anterior in actualizaciones_generico_a_institucional:
                            try:
                                cursor.execute(
                                    "UPDATE docentes SET correo = %s WHERE id = %s",
                                    (correo_nuevo, id_bd)
                                )
                                nombre_display = nombre_bd[:35] + "..." if len(nombre_bd) > 35 else nombre_bd
                                print(f"   ✓ ID {id_bd}: {nombre_display}")
                                print(f"     └─ {correo_anterior} → {correo_nuevo}")
                            except Exception as e:
                                print(f"   ✗ Error actualizando ID {id_bd}: {e}")
                        print("=" * 70)
                    
                    # Mostrar otras actualizaciones
                    if otras_actualizaciones:
                        if actualizaciones_generico_a_institucional:
                            print(f"\n📝 Otras actualizaciones ({len(otras_actualizaciones)}):")
                        for id_bd, correo_nuevo, nombre_bd, correo_anterior in otras_actualizaciones:
                            try:
                                cursor.execute(
                                    "UPDATE docentes SET correo = %s WHERE id = %s",
                                    (correo_nuevo, id_bd)
                                )
                                correo_ant_display = (correo_anterior[:20] + "..." if len(correo_anterior) > 20 else correo_anterior) if correo_anterior else "sin correo"
                                correo_nue_display = (correo_nuevo[:25] + "..." if len(correo_nuevo) > 25 else correo_nuevo)
                                nombre_display = nombre_bd[:25] + "..." if len(nombre_bd) > 25 else nombre_bd
                                print(f"   ✓ Actualizado ID {id_bd}: {nombre_display} ({correo_ant_display} -> {correo_nue_display})")
                            except Exception as e:
                                print(f"   ✗ Error actualizando ID {id_bd}: {e}")
                    
                    connection.commit()
                    total_actualizados = len(actualizaciones_generico_a_institucional) + len(otras_actualizaciones)
                    print(f"\n✅ Se actualizaron {total_actualizados} correos en total.")
                    if actualizaciones_generico_a_institucional:
                        print(f"   • {len(actualizaciones_generico_a_institucional)} actualizaciones de genérico a institucional")
                    if otras_actualizaciones:
                        print(f"   • {len(otras_actualizaciones)} otras actualizaciones")
                else:
                    print("✅ No hay duplicados con la base de datos existente.")
            else:
                print("ℹ️  No hay docentes existentes en la base de datos.")
                
        except Exception as e:
            print(f"⚠️  Error al verificar duplicados en BD: {e}")
            import traceback
            traceback.print_exc()
            # Continuar con la inserción aunque falle la verificación
        
        # ============ INSERTAR EN LA BASE DE DATOS ============
        if docentes:
            try:
                print(f"\n📤 Intentando insertar {len(docentes)} registros en la base de datos...")
                
                # Preparar datos para inserción masiva
                # Todos los docentes ahora tienen correo (genérico si no tenían uno)
                insert_query = """
                    INSERT INTO docentes (nombre, correo)
                    VALUES %s
                    ON CONFLICT (correo) 
                    DO NOTHING
                    RETURNING id, nombre, correo;
                """
                
                # Insertar con execute_values para mejor performance
                insertados_reales = psycopg2.extras.execute_values(
                    cursor, 
                    insert_query, 
                    docentes, 
                    template="(%s, %s)",
                    fetch=True,
                    page_size=100
                )
                
                connection.commit()
                
                cantidad_real = len(insertados_reales)
                omitidos_por_duplicado = len(docentes) - cantidad_real
                
                print(f"\n✅ INSERCIÓN FINALIZADA:")
                print(f"   • Registros intentados: {len(docentes)}")
                print(f"   • Registros insertados: {cantidad_real} ✅")
                if omitidos_por_duplicado > 0:
                    print(f"   • Registros omitidos (duplicados en BD): {omitidos_por_duplicado} ⚠️")
                
                if cantidad_real > 0:
                        print(f"\n📝 EJEMPLOS DE REGISTROS INSERTADOS:")
                        for i, (id_doc, nombre, correo) in enumerate(insertados_reales[:3]):
                            nombre_display = nombre[:30] + "..." if len(nombre) > 30 else nombre
                            correo_display = (correo[:25] + "..." if len(correo) > 25 else correo) if correo else "N/A"
                            print(f"   {i+1}. ID: {id_doc} | {nombre_display} | {correo_display}")
                        
                        if cantidad_real > 3:
                            print(f"   ... y {cantidad_real - 3} registros más")
                        
                        # Mostrar estadísticas finales
                        correos_institucionales = sum(1 for _, _, correo in insertados_reales if correo and es_correo_institucional(correo))
                        correos_genericos = cantidad_real - correos_institucionales
                        
                        print(f"\n📊 ESTADÍSTICAS FINALES:")
                        print(f"   • Correos institucionales (@pol.una.py): {correos_institucionales}")
                        if correos_genericos > 0:
                            print(f"   • Correos genéricos generados: {correos_genericos}")
                    
            except Exception as e:
                connection.rollback()
                print(f"❌ ERROR CRÍTICO durante la inserción:")
                print(f"   {e}")
                import traceback
                traceback.print_exc()
                
        else:
            print("\n⚠️  No hay datos válidos para insertar después del filtrado.")
            
    else:
        print("\n⚠️  No se encontraron datos para procesar.")

    cursor.close()
    print("\n" + "="*50)
    print("🏁 PROCESO DE INSERCIÓN FINALIZADO")
    print("="*50)