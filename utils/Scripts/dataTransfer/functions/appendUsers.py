import bcrypt
import psycopg2
import os
from psycopg2.extras import execute_values
from functions.helpFunctions import extraer_primer_nombre_apellido

def get_db_connection():
    """Helper to get a fresh DB connection from environment variables."""
    return psycopg2.connect(
        host=os.getenv("PG_HOST"),
        database=os.getenv("PG_DATABASE"),
        user=os.getenv("PG_USER"),
        password=os.getenv("PG_PASSWORD"),
        port=os.getenv("PG_PORT"),
        client_encoding='win1252'
    )

def normalizar_carrera(carrera_raw):
    """
    Normaliza carreras y las separa si vienen múltiples valores.
    Retorna una lista de strings normalizados.
    Ejemplo: "IIN, LCIK" -> ["IIN", "LCIK"]
    """
    if not carrera_raw:
        return []
    
    # Limpiar y separar por comas, punto y coma, o barras. 
    import re
    partes = [p.strip().upper() for p in re.split(r'[;,/]+', str(carrera_raw)) if p.strip()]
    
    resultados = []
    for parte in partes:
        resultados.append(parte)
            
    return list(set(resultados)) # Retornar únicos

def insertUsers(connection, intoData):
    """
    Procesa alumnos del Excel:
    1. Registra al alumno en 'alumnos' (id_rol = 4 por defecto).
    2. Registra sus carreras en 'matriculaciones'.
    3. Reporta estadísticas detalladas por carrera.
    """
    
    if not intoData:
        print("No hay datos para procesar.")
        return

    # --- CARGA DINAMICA DE CARRERAS DESDE LA BD ---
    cursor = connection.cursor()
    mapa_carreras = {}
    try:
        cursor.execute("SELECT id, nombre FROM carreras")
        mapa_carreras = {str(row[1]).strip().upper(): row[0] for row in cursor.fetchall()}
    except Exception as e:
        print(f"Error al cargar carreras: {e}")
        return
    finally:
        cursor.close()
        # Cerramos la conexion inicial para evitar timeouts durante el procesamiento lento
        print("Cerrando conexion inicial para procesar datos...")
        connection.close()

    # Agrupamos datos por correo para manejar multiples carreras
    usuarios_dict = {}
    
    # Para estadísticas de reporte
    stats_ok = {}      # carrera -> count registrados/validados
    stats_error = {}   # carrera -> count no existentes en BD
    otros_dominios = []
    
    print(f"Analizando {len(intoData)} filas y generando hashes (esto puede tomar unos minutos)...")
    import sys
    sys.stdout.flush()

    for idx, fila in enumerate(intoData):
        if len(fila) > 1 and fila[1]:
            correo = str(fila[1]).strip().lower()
            
            # Filtro básico: No procesar encabezados o vacíos
            if not correo or '@' not in correo or correo in ['email', 'correo', 'e-mail']:
                continue
            
            # Filtro de dominio institucional
            if not correo.endswith("@fpuna.edu.py"):
                otros_dominios.append(correo)
                continue
            
            nombre_raw = str(fila[0]).strip() if fila[0] else "Sin Nombre"
            nombre = extraer_primer_nombre_apellido(nombre_raw)
            carrera_raw = str(fila[3]).strip() if len(fila) > 3 and fila[3] else ""
            
            # Procesar posibles múltiples carreras (ej: "IIN, LCIK")
            carreras_encontradas = normalizar_carrera(carrera_raw)

            if correo not in usuarios_dict:
                # Generación de contraseña inicial (prefijo del correo)
                pwd_raw = correo.split('@')[0]
                salt = bcrypt.gensalt(12)
                hashed_pwd = bcrypt.hashpw(pwd_raw.encode('utf-8'), salt).decode('utf-8')
                
                usuarios_dict[correo] = {
                    'nombre': nombre,
                    'password': hashed_pwd,
                    'rol': 4, # Rol 4 por defecto
                    'carreras_ids': set()
                }
            
            # Validar carreras contra la BD
            for c_norm in carreras_encontradas:
                id_carrera = mapa_carreras.get(c_norm)
                if id_carrera:
                    usuarios_dict[correo]['carreras_ids'].add(id_carrera)
                    stats_ok[c_norm] = stats_ok.get(c_norm, 0) + 1
                else:
                    stats_error[c_norm] = stats_error.get(c_norm, 0) + 1
        
        # Log progress every 100 processed rows
        if idx % 100 == 0:
            if idx == 0:
                print(" > Iniciando procesamiento de filas...")
            else:
                print(f" > Procesando fila {idx} de {len(intoData)}...")
            import sys
            sys.stdout.flush()

    if not usuarios_dict:
        print("No se encontraron usuarios aptos para insertar (@fpuna.edu.py).")
        return

    print(f"\nSe detectaron {len(usuarios_dict)} alumnos unicos para procesar.")
    confirm = input(f"¿Deseas proceder con la insercion en la base de datos? (s/n): ").strip().lower()
    if confirm != 's':
        print("Operacion cancelada por el usuario.")
        return

    # --- REAPERTURA DE CONEXION ---
    print("Reabriendo conexion para la insercion...")
    new_conn = get_db_connection()
    cursor = new_conn.cursor()
    try:
        # 1. Insertar/Actualizar Alumnos
        print("Registrando informacion de alumnos...")
        alumnos_data = [(c, d['nombre'], d['password'], d['rol']) for c, d in usuarios_dict.items()]
        query_alumnos = """
            INSERT INTO alumnos (correo, nombre, password, rol)
            VALUES %s
            ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre
            RETURNING id, correo;
        """
        execute_values(cursor, query_alumnos, alumnos_data)
        
        # Recuperar IDs para las matriculaciones
        cursor.execute("SELECT id, correo FROM alumnos WHERE correo IN %s", (tuple(usuarios_dict.keys()),))
        mapa_ids = {correo: uid for uid, correo in cursor.fetchall()}

        # 2. Insertar Matriculaciones
        print("Vinculando alumnos con sus carreras...")
        matriculas_data = []
        for correo, uid in mapa_ids.items():
            for id_carrera in usuarios_dict[correo]['carreras_ids']:
                matriculas_data.append((uid, id_carrera))
        
        if matriculas_data:
            query_mat = """
                INSERT INTO matriculaciones (alumno, carrera)
                VALUES %s
                ON CONFLICT (alumno, carrera) DO NOTHING;
            """
            execute_values(cursor, query_mat, matriculas_data)

        new_conn.commit()
        
        # --- REPORTE DETALLADO ---
        print("\n" + "="*55)
        print(f"{'RESUMEN DE PROCESAMIENTO':^55}")
        print("="*55)
        
        print(f"\nCARRERAS REGISTRADAS CON EXITO:")
        if not stats_ok:
            print(" - Ninguna")
        for carr, total in sorted(stats_ok.items()):
            print(f" . {carr:<20}: {total} registros")
            
        if stats_error:
            print(f"\nCARRERAS NO ENCONTRADAS EN BD (Omitidas):")
            for carr, total in sorted(stats_error.items()):
                print(f" . {carr:<20}: {total} registros")
        
        print("\n" + "-" * 55)
        print(f"Total alumnos procesados: {len(usuarios_dict)}")
        if otros_dominios:
            print(f"Correos omitidos (externos): {len(otros_dominios)}")
        print("="*55 + "\n")
        
        print("Proceso finalizado correctamente.")
        
    except Exception as e:
        new_conn.rollback()
        print(f"Error critico durante la insercion: {e}")
    finally:
        cursor.close()
        new_conn.close()
