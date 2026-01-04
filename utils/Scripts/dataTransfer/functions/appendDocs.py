import psycopg2
import psycopg2.extras
from functions.helpFunctions import (
    formatDoc, 
    detectar_duplicados_por_nombre, 
    preferir_correo_institucional,
    extraer_nombre_clave,
    nombres_similares
)

def insertDoc(connection, intoData):
    cursor = connection.cursor()
    docentes = []
    
    print(f"\n🔍 Procesando {len(intoData)} filas del Excel...")
    
    # Contadores para estadísticas
    estadisticas = {
        'total_filas': len(intoData),
        'docentes_procesados': 0,
        'correos_generados': 0,
        'errores_formato': 0
    }
    
    # Diccionario para rastrear correos generados y evitar colisiones
    correos_generados_unicos = {}
    
    for idx, reg in enumerate(intoData):
        # Limpieza básica
        raw_ap = str(reg[0]).strip() if reg[0] else ""
        raw_nom = str(reg[1]).strip() if reg[1] else ""
        raw_cor = str(reg[2]).strip() if reg[2] else ""

        l_ap = raw_ap.split('\n')
        l_nom = raw_nom.split('\n')
        l_cor = raw_cor.split('\n')

        max_len = max(len(l_ap), len(l_nom), len(l_cor))

        for i in range(max_len):
            ap_final = l_ap[i].strip() if i < len(l_ap) else l_ap[-1].strip()
            nom_final = l_nom[i].strip() if i < len(l_nom) else l_nom[-1].strip()
            cor_final = l_cor[i].strip() if i < len(l_cor) else l_cor[-1].strip()

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

                if cor_final == "":
                    # Generar correo a partir del nombre completo
                    # Usar nombre clave (primer nombre + primer apellido) para evitar colisiones
                    nombre_clave = extraer_nombre_clave(nom_app)
                    base_nombre = nombre_clave.lower()
                    # Quitar tildes
                    base_nombre = base_nombre.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n")
                    # Quitar caracteres especiales y espacios
                    base_nombre = ''.join(c for c in base_nombre if c.isalnum())
                    
                    # Verificar si ya existe un correo generado con esta base
                    correo_base = f"{base_nombre}@generic.com"
                    if correo_base in correos_generados_unicos:
                        # Si ya existe, agregar un número para hacerlo único
                        contador = correos_generados_unicos[correo_base] + 1
                        correos_generados_unicos[correo_base] = contador
                        cor_final = f"{base_nombre}{contador}@generic.com"
                    else:
                        correos_generados_unicos[correo_base] = 0
                        cor_final = correo_base
                    
                    estadisticas['correos_generados'] += 1
                
                docentes.append((nom_app, cor_final))
                estadisticas['docentes_procesados'] += 1

    # Mostrar estadísticas preliminares
    print(f"📊 ESTADÍSTICAS PRELIMINARES:")
    print(f"   • Filas totales en Excel: {estadisticas['total_filas']}")
    print(f"   • Docentes procesados: {estadisticas['docentes_procesados']}")
    print(f"   • Correos generados: {estadisticas['correos_generados']}")
    if estadisticas['errores_formato'] > 0:
        print(f"   • Errores de formato: {estadisticas['errores_formato']}")

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
            cursor.execute("SELECT nombre, correo FROM docentes")
            docentes_existentes = cursor.fetchall()
            
            if docentes_existentes:
                # Crear estructuras para búsqueda eficiente
                # Mapa de nombre_clave -> lista de (nombre_completo, correo)
                nombres_clave_bd = {}
                correos_existentes = set()
                
                for nombre_bd, correo_bd in docentes_existentes:
                    if nombre_bd:
                        nombre_clave = extraer_nombre_clave(nombre_bd)
                        if nombre_clave not in nombres_clave_bd:
                            nombres_clave_bd[nombre_clave] = []
                        nombres_clave_bd[nombre_clave].append((nombre_bd, correo_bd))
                    if correo_bd:
                        correos_existentes.add(correo_bd)
                
                duplicados_en_bd = []
                docentes_finales = []
                
                for nombre, correo in docentes:
                    es_duplicado = False
                    tipo_duplicado = None
                    
                    # 1. Verificar duplicado por correo (más estricto)
                    if correo in correos_existentes:
                        es_duplicado = True
                        tipo_duplicado = "correo"
                    else:
                        # 2. Verificar duplicado por nombre clave (mismo primer nombre + primer apellido)
                        nombre_clave = extraer_nombre_clave(nombre)
                        if nombre_clave in nombres_clave_bd:
                            # Verificar si hay nombres similares en la BD
                            for nombre_bd, correo_bd in nombres_clave_bd[nombre_clave]:
                                if nombres_similares(nombre, nombre_bd):
                                    es_duplicado = True
                                    tipo_duplicado = "nombre"
                                    break
                    
                    if es_duplicado:
                        duplicados_en_bd.append((nombre, correo, tipo_duplicado))
                    else:
                        docentes_finales.append((nombre, correo))
                
                if duplicados_en_bd:
                    print(f"⚠️  Se encontraron {len(duplicados_en_bd)} registros que ya existen en la BD:")
                    for nombre, correo, tipo in duplicados_en_bd[:3]:
                        nombre_display = nombre[:25] + "..." if len(nombre) > 25 else nombre
                        correo_display = correo[:20] + "..." if len(correo) > 20 else correo
                        print(f"   • {nombre_display} ({correo_display}) - Duplicado por {tipo}")
                    
                    if len(duplicados_en_bd) > 3:
                        print(f"   ... y {len(duplicados_en_bd) - 3} más")
                    
                    docentes = docentes_finales
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
                print(f"   • Registros omitidos (duplicados en BD): {omitidos_por_duplicado} ⚠️")
                
                if cantidad_real > 0:
                    print(f"\n📝 EJEMPLOS DE REGISTROS INSERTADOS:")
                    for i, (id_doc, nombre, correo) in enumerate(insertados_reales[:3]):
                        nombre_display = nombre[:30] + "..." if len(nombre) > 30 else nombre
                        correo_display = correo[:25] + "..." if len(correo) > 25 else correo
                        print(f"   {i+1}. ID: {id_doc} | {nombre_display} | {correo_display}")
                    
                    if cantidad_real > 3:
                        print(f"   ... y {cantidad_real - 3} registros más")
                    
                    # Mostrar estadísticas finales
                    correos_institucionales = sum(1 for _, _, correo in insertados_reales if '@pol.una.py' in correo)
                    correos_genericos = cantidad_real - correos_institucionales
                    
                    print(f"\n📊 ESTADÍSTICAS FINALES:")
                    print(f"   • Correos institucionales (@pol.una.py): {correos_institucionales}")
                    print(f"   • Correos genéricos (@generic.com): {correos_genericos}")
                    
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