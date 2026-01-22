import psycopg2
from psycopg2.extras import execute_values

from functions.helpFunctions import extraer_primer_nombre_apellido, generar_password_complejo

def normalizar_carrera(carrera_raw):

    """
    Normaliza carreras con múltiples valores separados por comas, guiones o espacios.
    
    Reglas:
    - Si contiene "IIN" pero no "LCIK", retorna "IIN"
    - Si contiene "LCIK" pero no "IIN", retorna "LCIK"
    - Si contiene ambos "LCIK" e "IIN", retorna el que aparece primero
    - Maneja separadores: comas (,), guiones (-), espacios
    - Normaliza a mayúsculas
    
    Ejemplos:
    - "ISP, IIN" -> "IIN"
    - "IEK,LCIK" -> "LCIK"
    - "LCIK, IIN" -> "LCIK"
    - "IIN,LCIK" -> "IIN"
    - "LCIk" -> "LCIK"
    """
    if not carrera_raw:
        return "SIN CARRERA"
    
    carrera = carrera_raw.strip()
    
    # Separar por comas, guiones o espacios múltiples
    import re
    partes = [p.strip().upper() for p in re.split(r'[,\-\s]+', carrera) if p.strip()]
    
    if len(partes) > 1:
        tiene_iin = any("IIN" in p for p in partes)
        tiene_lcik = any("LCIK" in p for p in partes)
        
        if tiene_iin and tiene_lcik:
            # Retornar el primero que aparezca (IIN o LCIK)
            for p in partes:
                if "IIN" == p or "LCIK" == p:
                    return p
        elif tiene_iin:
            # Retornar solo IIN
            return "IIN"
        elif tiene_lcik:
            # Retornar solo LCIK
            return "LCIK"
    else:
        # Una sola parte, normalizar mayúsculas
        parte_upper = partes[0] if partes else carrera.upper()
        if "IIN" in parte_upper:
            return "IIN"
        elif "LCIK" in parte_upper:
            return "LCIK"
    
    return carrera.upper()

def insertUsers(connection, intoData):
    """
    Filtra los usuarios con terminación @fpuna.edu.py y realiza una separación por carrera,
    mostrando las estadísticas en consola.
    
    Según las indicaciones en app.py:
    # 0= Nombre y Apellido 1= Correo 2= CI 3= Carrera
    """
    
    if not intoData:
        print("⚠️ No hay datos para procesar.")
        return

    # --- CARGA DINÁMICA DE CARRERAS DESDE LA BD ---
    cursor = connection.cursor()
    mapa_carreras = {}
    try:
        cursor.execute("SELECT id, nombre FROM carreras")
        mapa_carreras = {str(row[1]).strip().upper(): row[0] for row in cursor.fetchall()}
        if not mapa_carreras:
            print("⚠️ Advertencia: La tabla 'carreras' está vacía en la base de datos.")
    except Exception as e:
        print(f"❌ Error al cargar carreras de la BD: {e}")
    finally:
        cursor.close()

    # Diccionario para agrupar por carrera encontrada en el Excel
    carreras_count = {}
    total_revisados = len(intoData)
    total_fpuna = 0
    total_insertables = 0
    correos_no_fpuna = []  # Lista para correos que NO son @fpuna.edu.py
    filas_descartadas = []  # Lista para almacenar el contenido de las filas descartadas
    
    # Lista para datos a insertar en la base de datos
    # Formato: (correo, nombre, carrera, password, rol)
    alumnos_a_insertar = []
    
    # El correo está en la columna índice 1, la carrera en la índice 3, CI en el 2
    for fila in intoData:
        if len(fila) > 1 and fila[1]:
            correo = str(fila[1]).strip().lower()
            
            # Validar que sea un correo válido (debe contener @)
            # y que no sea la fila de encabezado
            if not correo or '@' not in correo or correo in ['email', 'correo', 'e-mail']:
                filas_descartadas.append(fila)
                continue
            
            if correo.endswith("@fpuna.edu.py"):
                total_fpuna += 1
                carrera_raw = str(fila[3]).strip() if len(fila) > 3 and fila[3] else ""
                
                # Normalizar la carrera (simplificar múltiples valores)
                carrera_normalizada = normalizar_carrera(carrera_raw)
                carrera_up = carrera_normalizada.upper()
                
                # --- PREPARACIÓN PARA INSERCIÓN DINÁMICA ---
                # Verificamos si la carrera normalizada existe en el mapa de la BD
                id_carrera = mapa_carreras.get(carrera_up)
                
                if id_carrera:
                    total_insertables += 1
                    nombre_raw = str(fila[0]).strip() if fila[0] else "Sin Nombre"
                    # Extraer solo primer nombre y primer apellido
                    nombre = extraer_primer_nombre_apellido(nombre_raw)
                    
                    ci = str(fila[2]).strip() if len(fila) > 2 and fila[2] else "12345" # Default if CI missing
                    
                    # Rol 4 -> INACTIVE 
                    id_rol = 4
                    
                    # Password inicial: Generado aleatoriamente (Complejo)
                    # NOTA: En la base de datos se espera que esté hasheado. 
                    password_inicial = generar_password_complejo()
                    
                    alumnos_a_insertar.append((correo, nombre, id_carrera, password_inicial, id_rol))
                
                if carrera_normalizada in carreras_count:
                    carreras_count[carrera_normalizada] += 1
                else:
                    carreras_count[carrera_normalizada] = 1
            else:
                # Correo que NO termina en @fpuna.edu.py
                nombre = str(fila[0]).strip() if fila[0] else "N/A"
                correos_no_fpuna.append((nombre, correo))
        else:
            # Fila sin correo (columna vacía o fila incompleta)
            filas_descartadas.append(fila)

                
    print("\n" + "="*50)
    print(f"{'REPASO DE USUARIOS @FPUNA.EDU.PY':^50}")
    print("="*50)
    
    if not carreras_count:
        print("No se encontraron usuarios con el dominio @fpuna.edu.py")
    else:
        # Ordenar carreras por nombre para mejor visualización
        for carrera in sorted(carreras_count.keys()):
            carrera_up = carrera.upper()
            # Filtrar solo carreras que existen en la BD o SIN CARRERA
            if carrera_up in mapa_carreras or carrera_up == "SIN CARRERA":
                cantidad = carreras_count[carrera]
                icon = "⚡" if carrera_up in mapa_carreras else "❓"
                print(f"{icon} {carrera:<35} | {cantidad:>5} usuarios")
            
    print("-" * 50)
    print(f"📧 Total @fpuna.edu.py: {total_fpuna}")
    print(f"✨ Total alumnos aptos para insertar: {total_insertables}")
    print(f"📊 Total revisados en Excel: {total_revisados}")
    if len(filas_descartadas) > 0:
        print(f"⚠️  Filas descartadas (sin correo válido): {len(filas_descartadas)}")
    print("="*50 + "\n")
    
    # --- PROCESO DE INSERCIÓN EN BASE DE DATOS ---
    if alumnos_a_insertar:
        print(f"🔄 Se prepararon {len(alumnos_a_insertar)} alumnos para insertar.")
        confirmacion = input(f"¿Deseas insertar estos {len(alumnos_a_insertar)} alumnos en la base de datos? (s/n): ").strip().lower()
        
        if confirmacion == 's':
            cursor = connection.cursor()
            try:
                print("📤 Insertando alumnos en la tabla 'alumnos'...")
                
                # Query con ON CONFLICT para evitar correos duplicados
                query = """
                    INSERT INTO alumnos (correo, nombre, carrera, password, rol)
                    VALUES %s
                    ON CONFLICT (correo) DO NOTHING
                    RETURNING id;
                """
                
                # Usamos execute_values para eficiencia
                insertados = execute_values(cursor, query, alumnos_a_insertar, fetch=True)
                connection.commit()
                
                cantidad_insertada = len(insertados) if insertados else 0
                print(f"✅ Inserción finalizada: {cantidad_insertada} alumnos insertados.")
                if cantidad_insertada < len(alumnos_a_insertar):
                    print(f"⚠️  {len(alumnos_a_insertar) - cantidad_insertada} registros fueron omitidos (ya existían en la BD).")
                
            except Exception as e:
                connection.rollback()
                print(f"❌ Error durante la inserción: {e}")
            finally:
                cursor.close()
        else:
            print("⚠️ Inserción cancelada por el usuario.")
    
    # Mostrar correos que NO son @fpuna.edu.py
    if correos_no_fpuna:
        print("\n" + "="*60)
        print(f"{'CORREOS QUE NO SON @FPUNA.EDU.PY':^60}")
        print("="*60)
        print("-" * 60)
        print(f"📮 Total otros dominios: {len(correos_no_fpuna)}")
        print("="*60 + "\n")

    # Mostrar filas descartadas
    if filas_descartadas:
        print("\n" + "="*60)
        print(f"{'DETALLE DE FILAS DESCARTADAS':^60}")
        print("="*60)
        for i, fila in enumerate(filas_descartadas, 1):
            if i <= 10: # Solo mostrar las primeras 10 para no saturar
                print(f"Row {i}: {fila}")
        if len(filas_descartadas) > 10:
            print(f"... y {len(filas_descartadas) - 10} filas más.")
        print("="*60 + "\n")

    

