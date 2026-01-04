import os
import openpyxl
import re
from tabulate import tabulate
import tkinter as tk
from tkinter import filedialog
import unicodedata




def limpiar_pantalla():
    os.system('cls' if os.name == 'nt' else 'clear')
    
    
def procesar_excel_exacto(archivo, nombre_hoja, indices_columnas, fila_inicio):
    try:
        wb = openpyxl.load_workbook(archivo, data_only=True)
        if nombre_hoja not in wb.sheetnames:
            print(f"Error: No existe la hoja '{nombre_hoja}'")
            return
        
        sheet = wb[nombre_hoja]
        data_final = []

        for num_fila, row in enumerate(sheet.iter_rows(values_only=True), start=1):
            
            # Saltamos hasta llegar a la fila deseada
            if num_fila < fila_inicio:
                continue

            # CORRECCIÓN 1: Inicializamos vacío, sin el num_fila
            fila_procesada = [] 

            # Extraer las columnas específicas por índice
            for i in indices_columnas:
                if i < len(row):
                    fila_procesada.append(row[i])
                else:
                    fila_procesada.append(None)

            # CORRECCIÓN 2: Validamos toda la fila (ya no usamos [1:])
            # Solo agregamos si hay contenido real
            if any(celda is not None for celda in fila_procesada):
                data_final.append(fila_procesada)

        # Mostrar con formato
        if data_final:
            # CORRECCIÓN 3: Quitamos el encabezado de "# Fila"
            '''headers = [f"Col {i}" for i in indices_columnas]
            print(f"\nDatos de '{nombre_hoja}' (Desde fila {fila_inicio}):")
            print(tabulate(data_final, headers=headers, tablefmt="fancy_grid"))'''
            
            return data_final
        else:
            print(f"No hay datos a partir de la fila {fila_inicio}")

    except Exception as e:
        print(f"Error crítico: {e}")
        
        
def seleccion_archivo():
    root = tk.Tk()
    root.withdraw() # Ocultamos la ventanita principal

    # TRUCO: Forzar que la ventana aparezca al frente de todo
    root.attributes('-topmost', True) 
    
    print("📂 Abriendo ventana de selección...")
    
    ruta_archivo = filedialog.askopenfilename(
        title="Selecciona el archivo de Malla",
        filetypes=[
            ("Archivos de Excel", "*.xlsx *.xls"),
            ("Todos los archivos", "*.*")
        ]
    )
    
    # Importante: Destruimos la instancia de tkinter para liberar memoria
    root.destroy() 

    # Validamos
    if ruta_archivo:
        nombre_archivo = os.path.basename(ruta_archivo)
        print(f"✅ Archivo seleccionado: {nombre_archivo}")
        return ruta_archivo
    else:
        print("❌ No se seleccionó ningún archivo.")
        return None
    
    
def obtener_nombre_hoja(ruta_archivo):
    """Muestra las hojas disponibles y permite elegir una."""
    try:
        # Leemos solo la estructura para ser rápidos
        wb = openpyxl.load_workbook(ruta_archivo, read_only=True, keep_links=False)
        hojas = wb.sheetnames
        wb.close()
    except Exception as e:
        print(f"❌ Error al leer hojas: {e}")
        return None

    if len(hojas) == 1:
        print(f"✅ Hoja única detectada: {hojas[0]}")
        return hojas[0]

    print("\n📋 Hojas disponibles:")
    for i, hoja in enumerate(hojas):
        print(f"  [{i + 1}] {hoja}")

    while True:
        try:
            opcion = int(input("\n👉 Elige el número de la hoja: ")) - 1
            if 0 <= opcion < len(hojas):
                return hojas[opcion]
            print("⚠️ Número inválido.")
        except ValueError:
            print("⚠️ Ingresa un número.")
            
            
def numero_a_romano(match):
    """Convierte números arábigos (1-10) a romanos (I-X)."""
    mapa = {
        '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
        '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X'
    }
    # Usamos group(1) porque el regex captura el número
    return mapa.get(match.group(1), match.group(1))

def normalizar_para_comparacion(texto):
    """
    Normaliza texto para que 'Álgebra Lineal' sea igual a 'algebra lineal'.
    1. Quita tildes.
    2. Minusculas.
    3. Convierte 'Matemática 1' a 'matematica i'.
    """
    if not texto: return ""
    
    # 1. Convertir a string
    texto = str(texto)
    
    # 2. Normalización Unicode (Eliminar tildes: Á -> A)
    texto = unicodedata.normalize('NFD', texto)
    texto = ''.join(c for c in texto if unicodedata.category(c) != 'Mn')
    
    # 3. Limpieza básica
    texto = texto.lower().strip()
    
    # 4. Unificar espacios (eliminar dobles espacios)
    texto = " ".join(texto.split())

    # 5. Convertir número arábigo al final a romano (Ej: " 1" -> " i")
    texto = re.sub(r'\b([1-9]|10)$', lambda m: numero_a_romano(m).lower(), texto)

    return texto

def limpiar_nombre_asignatura(texto):
    if not texto: return ""
    texto = str(texto)
    # Eliminar (*) y basura visual
    texto = re.sub(r'\s*\(\*+\)$', '', texto)
    # Agregar: Eliminar espacios extra invisibles
    texto = " ".join(texto.split()) 
    return texto

def formatDoc(nom, app):
    """Une Nombre y Apellido completos."""
    nombre_raw = str(nom).strip() if nom else ""
    apellido_raw = str(app).strip() if app else ""
    
    if not nombre_raw or not apellido_raw:
        return False
    
    try:
        # ANTES: Solo primer nombre + primer apellido
        # nom_pila = nombre_raw.split()[0]
        # ape_pila = apellido_raw.split()[0]
        # return f"{nom_pila} {ape_pila}"
        
        # AHORA: Nombre completo + Apellido completo
        nombre_completo = " ".join(nombre_raw.split())  # Normaliza espacios
        apellido_completo = " ".join(apellido_raw.split())  # Normaliza espacios
        
        return f"{nombre_completo} {apellido_completo}"
        
    except Exception as e:
        print(f"❌ Error formateando nombre completo: {e}")
        return False
    




    






# Agregar estas funciones al final de helpFunctions.py

import unicodedata

def normalizar_nombre_comparacion(nombre):
    """
    Normaliza nombre para comparación (quita tildes, convierte a minúsculas, etc.)
    """
    if not nombre:
        return ""
    
    # Convertir a minúsculas
    nombre = nombre.lower()
    
    # Quitar tildes
    nombre = unicodedata.normalize('NFD', nombre)
    nombre = ''.join(c for c in nombre if unicodedata.category(c) != 'Mn')
    
    # Quitar espacios extra
    nombre = " ".join(nombre.split())
    
    return nombre

def nombres_similares(nombre1, nombre2):
    """
    Compara si dos nombres son similares.
    Detecta si son la misma persona a pesar de variaciones en segundos nombres.
    """
    if not nombre1 or not nombre2:
        return False
    
    # Normalizar ambos nombres
    n1 = normalizar_nombre_comparacion(nombre1)
    n2 = normalizar_nombre_comparacion(nombre2)
    
    # Si son iguales después de normalizar
    if n1 == n2:
        return True
    
    # Extraer palabras
    palabras1 = n1.split()
    palabras2 = n2.split()
    
    if len(palabras1) >= 2 and len(palabras2) >= 2:
        # Mismo primer nombre + mismo primer apellido
        if palabras1[0] == palabras2[0] and palabras1[-1] == palabras2[-1]:
            return True
    
    return False

def extraer_nombre_clave(nombre_completo):
    """
    Extrae el nombre clave para comparación: primer nombre + primer apellido
    """
    if not nombre_completo:
        return ""
    
    nombre_normalizado = normalizar_nombre_comparacion(nombre_completo)
    palabras = nombre_normalizado.split()
    
    if len(palabras) >= 2:
        primer_nombre = palabras[0]
        primer_apellido = palabras[-1]
        return f"{primer_nombre} {primer_apellido}"
    
    return nombre_normalizado

def detectar_duplicados_por_nombre(nuevos_docentes):
    """
    Detecta duplicados por nombre.
    """
    nombres_vistos = {}
    duplicados = []
    
    for i, (nombre, correo) in enumerate(nuevos_docentes):
        encontrado = False
        nombre_clave = extraer_nombre_clave(nombre)
        
        # Buscar por nombre clave
        if nombre_clave in nombres_vistos:
            datos = nombres_vistos[nombre_clave]
            if nombres_similares(nombre, datos['nombre']):
                duplicados.append({
                    'indice_actual': i,
                    'nombre': nombre,
                    'correo_actual': correo,
                    'duplicado_de': datos['indice'],
                    'nombre_duplicado': datos['nombre'],
                    'correo_duplicado': datos['correo']
                })
                encontrado = True
        
        if not encontrado:
            nombres_vistos[nombre_clave] = {
                'indice': i,
                'nombre': nombre,
                'correo': correo
            }
    
    return duplicados

def preferir_correo_institucional(correo1, correo2):
    """
    Decide cuál correo preferir: @pol.una.py tiene prioridad
    """
    if not correo1:
        return correo2
    if not correo2:
        return correo1
    
    es_institucional_1 = '@pol.una.py' in correo1.lower()
    es_institucional_2 = '@pol.una.py' in correo2.lower()
    
    if es_institucional_1 and not es_institucional_2:
        return correo1
    elif es_institucional_2 and not es_institucional_1:
        return correo2
    else:
        # Si ambos son institucionales o ninguno lo es, mantener el primero
        return correo1