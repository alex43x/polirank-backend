import os
import psycopg2
from dotenv import load_dotenv

from functions.helpFunctions import procesar_excel_exacto, seleccion_archivo, obtener_nombre_hoja, limpiar_pantalla, es_correo_estudiante, normalizar_carrera, filtrar_carreras, matriz_a_txt 
from functions.appendDocs import insertDoc
from functions.appendAsign import insertAsign
from functions.appendSeccCur import insertSecciones
from functions.searchUsers import usersImport
from functions.appendUsers import insertUsers
from functions.appendmalla import insertMalla
# Cargar variables de entorno desde el archivo .env en la raíz del proyecto
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
load_dotenv(env_path)


def menu_principal():
    while True:
        limpiar_pantalla()
        print("===================================")
        print("   SISTEMA DE GESTIÓN DE MALLA")
        print("===================================")
        print("[1] Insertar Docentes")
        print("[2] Insertar Asignaturas")
        print("[3] Insertar Usuarios")
        print("[4] Insertar Secciones y Cursos")
        print("[5] Insertar Mallas")
        print("[6] Normalizar (genera un txt en la raiz del proyecto)")
        print("[0] Salir")
        print("===================================")
        
        opcion = input("Selecciona una opción: ")
        limpiar_pantalla()

        if opcion == '1':
            print("\nSeleccione archivo")
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            
            
            #Extrae Nombres y Apellidos de los docentes
            FILA_DE_INICIO = 12
            COLUMNAS_OBJETIVO = [12,13,14]
            #12= Apellidos   13= Nombres    14= Correos
             
             
             
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
              
            insertDoc(connection,intoData)

            input("\nPresiona ENTER para continuar...")
            
        elif opcion == '2':
            print("\nSeleccione archivo")
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            
            
            #Extrae Asignatura y Departamento
            FILA_DE_INICIO = 12
            COLUMNAS_OBJETIVO = [1,2]
            # 1= Departamento  2= Asignatura
            
            
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
            insertAsign(connection,intoData)
           
            input("\nPresiona ENTER para continuar...")
            
        elif opcion == '3':
            while True:
                limpiar_pantalla()
                print("===================================")
                print("[1] Importar Usuarios desde GoogleContacts")
                print("[2] Insertar Usuarios a Base de datos")
                print("===================================")
                opt = input("Selecciona una opción: ")
                limpiar_pantalla()
                if opt == '1':
                    print("\n--- Importación de Usuarios Google ---")
                    usersImport()
                    input("\nPresiona ENTER para continuar...")
                    break
                    
                elif opt == '2':
                    print("\n--- Insertando a Base de Datos ---")
                    print("\nSeleccione archivo")
                    ARCHIVO = seleccion_archivo()
                    if not ARCHIVO: continue
                    HOJA = obtener_nombre_hoja(ARCHIVO)
                    
                    #Extrae Asignatura y Departamento
                    FILA_DE_INICIO = 2
                    COLUMNAS_OBJETIVO = [0, 1, 2, 3, 4]
                    # 0= Nombre y Apellido 1= Correo 2= CI 3= Carrera
                    
                    intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
                    
                    if intoData:
                        insertUsers(connection, intoData)
                    
                    
                    input("\nPresiona ENTER para continuar...")
                    break
                else:
                    input("Opción no válida. Presiona ENTER para intentar de nuevo...")
      
        elif opcion == '4':
            limpiar_pantalla()
            print("\nSeleccione archivo")
            
            
            
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue 
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            
           

            FILA_DE_INICIO = 12
            # 2= Asignatura, 12= Apellidos, 13= Nombres, 14= Correos
            COLUMNAS_OBJETIVO = [2, 12, 13, 14] 
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)

            # Solicitar año y periodo por consola
            while True:
                try:
                    year = int(input("Ingrese el año (ej: 2026): ").strip())
                    break
                except ValueError:
                    print("⚠️  Año inválido. Intente de nuevo.")
            
            while True:
                try:
                    periodo = int(input("Ingrese el periodo (1 o 2): ").strip())
                    if periodo in (1, 2):
                        break
                    print("⚠️  Periodo inválido. Use 1 o 2.")
                except ValueError:
                    print("⚠️  Periodo inválido. Intente de nuevo.")

            insertSecciones(connection, intoData, year, periodo)
            
            
            input("\nPresiona ENTER para continuar...")
            
        elif opcion == '5':
            limpiar_pantalla()
            print("\nSeleccione archivo")
            
            
            
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue 
            
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
           

            FILA_DE_INICIO = 1
            # 0 = materias , 1 = carreras, 2 = semestre
            COLUMNAS_OBJETIVO = [0,1,2] 
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
            
            insertMalla(connection,intoData)

            input("\nPresiona ENTER para continuar...")

        elif opcion == '6':
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue 
            
            HOJA = obtener_nombre_hoja(ARCHIVO)

            FILA_DE_INICIO = 1
            # 0 = nombre , 1 = correo, 2 = ci , 3 = carreras
            COLUMNAS_OBJETIVO = [0,1,2,3] 
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)

            filtrado = filtrar_carreras(intoData)

            matriz_a_txt(filtrado,"reporte_filtrado.txt")
            

        elif opcion == '0':
            print("¡Hasta luego!")
            break
        else:
            input("Opción no válida. Presiona ENTER para intentar de nuevo...")







def obtener_configuracion_db():
    """
    Obtiene la configuración de la base de datos desde variables de entorno.
    Retorna un diccionario con los parámetros de conexión.
    """
    # Variables requeridas
    required_vars = {
        'host': os.getenv('PG_HOST'),
        'user': os.getenv('PG_USER'),
        'password': os.getenv('PG_PASSWORD'),
        'database': os.getenv('PG_DATABASE'),
    }
    
    # Verificar que todas las variables requeridas estén presentes
    missing_vars = [key for key, value in required_vars.items() if not value]
    if missing_vars:
        print("❌ ERROR: Faltan las siguientes variables de entorno requeridas:")
        for var in missing_vars:
            var_name = f"DB_{var.upper()}" if var != 'schema' else 'DB_SCHEMA'
            print(f"   • {var_name}")
        print("\n💡 Asegúrate de que el archivo .env existe en la raíz del proyecto")
        print("   y contiene todas las variables necesarias.")
        return None
    
    # Puerto es opcional, por defecto 5432
    port = os.getenv('PG_PORT', '5432')
    
    return {
        'host': required_vars['host'],
        'user': required_vars['user'],
        'password': required_vars['password'],
        'database': required_vars['database'],
        'port': port,
    }


connection = None
try:
    # Obtener configuración de la base de datos
    db_config = obtener_configuracion_db()
    
    if db_config is None:
        print("\n⚠️  No se pudo cargar la configuración de la base de datos.")
        print("   El script no puede continuar sin las credenciales necesarias.")
        exit(1)
    
    # Intentar conectar a la base de datos
    print("🔄 Intentando conectar a la base de datos...")
    connection = psycopg2.connect(**db_config)
    
    if connection.closed == 0:
        print("✅ Conexión establecida correctamente.")
        if __name__ == "__main__":
            menu_principal()
    else:
        print("❌ Error: La conexión se estableció pero está cerrada.")
        
except psycopg2.Error as db_error:
    print(f"❌ ERROR DE BASE DE DATOS durante la conexión:")
    print(f"   {db_error}")
    print("\n💡 Verifica que:")
    print("   • PostgreSQL esté corriendo")
    print("   • Las credenciales en el archivo .env sean correctas")
    print("   • La base de datos y el schema existan")
    exit(1)
    
except Exception as ex:
    print(f"❌ ERROR INESPERADO durante la conexión:")
    print(f"   {ex}")
    import traceback
    traceback.print_exc()
    exit(1)
    
finally:
    if connection and connection.closed == 0:
        connection.close()
        print("\n✅ Conexión cerrada correctamente.")