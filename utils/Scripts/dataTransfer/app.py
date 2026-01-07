import psycopg2

from functions.helpFunctions import procesar_excel_exacto, seleccion_archivo, obtener_nombre_hoja, limpiar_pantalla 
from functions.appendDocs import insertDoc
from functions.appendAsign import insertAsign
from functions.appendSeccCur import insertSecciones


def menu_principal():
    while True:
        limpiar_pantalla()
        print("===================================")
        print("   SISTEMA DE GESTIÓN DE MALLA")
        print("===================================")
        print("[1] Insertar Docentes")
        print("[2] Insertar Asignaturas")
        print("[3] Insertar Mallas")
        print("[4] Insertar Secciones y Cursos")
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
            print("\nSeleccione archivo")
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            
            FILA_DE_INICIO = 0
            COLUMNAS_OBJETIVO = [0,1,2]
            # 0=Asignatura 1= Carrera 2=Semestre
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
            '''insertMalla(connection, intoData)'''
            
            input("\nPresiona ENTER para continuar...")
            
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
            input("\nPresiona ENTER para continuar...")
        elif opcion == '0':
            print("¡Hasta luego!")
            break
        else:
            input("Opción no válida. Presiona ENTER para intentar de nuevo...")







try:
    connection = psycopg2.connect(
        host='localhost',
        user='postgres',
        password='Adelant5',
        database='polirankDB',
        options="-c search_path=polirank_test"
    )
    if connection.closed == 0:
        if __name__ == "__main__":
            menu_principal() 
except Exception as ex:
    print("Error durante la conexión:", ex)
finally:
    if connection.closed == 0:
        connection.close()
        print("Coneccion Cerrada")