from mysql.connector import Error
import mysql.connector
import os

# Imports de funciones
from functions.helpFunctions import procesar_excel_exacto, seleccion_archivo, obtener_nombre_hoja, obtener_año_periodo, limpiar_pantalla 
from functions.appendDoc import insertDoc
from functions.appendAsign import insertAsign
from functions.appendMall import insertMalla
from functions.appendSeccCur import insertSecciones



#.\utils\Scripts\venv\Scripts\activate


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

        if opcion == '1':
            
            
            limpiar_pantalla()
            print("\nSeleccione archivo")
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            #Extrae Nombres y Apellidos de los docentes
            FILA_DE_INICIO = 12
            COLUMNAS_OBJETIVO = [12,13]
             
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
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)
            
            
            #El excel debe tener 3 columnas, la primera de asignatura, la segunda la carrera(siglas) y la tercera el semestre
            insertMalla(connection, intoData)
            
            input("\nPresiona ENTER para continuar...")
            
        elif opcion == '4':
            print("\nSeleccione archivo")
            ARCHIVO = seleccion_archivo()
            if not ARCHIVO: continue 
            HOJA = obtener_nombre_hoja(ARCHIVO)
            
            
            # --- VALIDACIÓN IMPORTANTE ---
            year, per = obtener_año_periodo(ARCHIVO, HOJA)
            
            if year is False or per is False:
                print("❌ ERROR: No se pudo detectar el Año o Periodo en la celda D1.")
                print("   Verifique que la celda D1 tenga formato '(PRIMER/SEGUNDO) PERIODO (AÑO)'")
                input("Presiona ENTER para volver al menú...")
                continue # Regresa al menú, no intenta insertar
            # -----------------------------

            FILA_DE_INICIO = 12
            # 2=Asignatura, 12=Apellidos, 13=Nombres
            COLUMNAS_OBJETIVO = [2, 12, 13] 
            
            intoData = procesar_excel_exacto(ARCHIVO, HOJA, COLUMNAS_OBJETIVO, FILA_DE_INICIO)

            insertSecciones(connection, intoData, year, per)
            
            
            input("\nPresiona ENTER para continuar...")
            
        elif opcion == '5':
            input("\nPresiona ENTER para continuar...")
        elif opcion == '0':
            print("¡Hasta luego!")
            break
        else:
            input("Opción no válida. Presiona ENTER para intentar de nuevo...")

try:
    connection = mysql.connector.connect(
        host = "localhost",
        port = 3306,
        user = "root",
        password = "Adelant5?",
        db = "polirank_test2"
    )
    if connection.is_connected():
        if __name__ == "__main__":
            menu_principal()
                  
except Error as ex:
    print("Error durante la conexion : {}".format(ex))
finally:
    if connection.is_connected():
        connection.close()
        print("Coneccion Cerrada")