import os.path
import time
import pandas as pd
import tkinter as tk
from tkinter import filedialog
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# --- CONFIGURACIÓN ---
SCOPES = ['https://www.googleapis.com/auth/directory.readonly']
CARRERAS_OBJETIVO = ["IIN", "LCIK"]


def usersImport():
    """
    Esta función se encarga de todo el proceso:
    Conexión -> Descarga -> Filtrado -> Guardado Excel
    """
    creds = None

    # 1. Ubicamos la ruta base de ESTE archivo (searchUsers.py)
    # Ejemplo: .../polirank-backend/functions
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Subimos un nivel para llegar a la raíz del proyecto
    # Ejemplo: .../polirank-backend
    project_root = os.path.dirname(base_path)
    
    # 3. Construimos la ruta hacia la carpeta 'config'
    config_folder = os.path.join(project_root, 'config')
    
    # 4. Definimos las rutas finales de los JSON
    credentials_path = os.path.join(config_folder, 'credentials.json')
    token_path = os.path.join(config_folder, 'token.json')

    # Verificación de seguridad para evitar errores confusos
    if not os.path.exists(config_folder):
        print(f"❌ ERROR: No existe la carpeta 'config' en: {project_root}")
        print("   Por favor crea la carpeta 'config' y mueve 'credentials.json' ahí.")
        return

    # --- 1. AUTENTICACIÓN ---
    # (El resto del código sigue igual, usando token_path y credentials_path)
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    # ...

    # --- 1. AUTENTICACIÓN ---
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                print(f"❌ ERROR CRÍTICO: No se encuentra 'credentials.json' en {base_path}")
                return # Salimos de la función si no hay credenciales

            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('people', 'v1', credentials=creds)

        print(f"\n🚀 [Módulo Google] Iniciando escaneo masivo...")
        print(f"🎯 Filtrando por: {CARRERAS_OBJETIVO}")
        
        lista_encontrados = []
        next_page_token = None
        total_escaneados = 0
        pagina = 1
        start_time = time.time()

        # --- 2. BUCLE DE ESCANEO ---
        while True:
            results = service.people().listDirectoryPeople(
                readMask='names,emailAddresses,addresses,externalIds',
                sources=['DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE'],
                pageSize=1000,
                pageToken=next_page_token
            ).execute()
            
            personas_bloque = results.get('people', [])
            total_escaneados += len(personas_bloque)

            for person in personas_bloque:
                addresses = person.get('addresses', [])
                for addr in addresses:
                    valor_direccion = addr.get('formattedValue', '').upper()
                    if any(sigla in valor_direccion for sigla in CARRERAS_OBJETIVO):
                        names = person.get('names', [])
                        name = names[0].get('displayName') if names else "Sin nombre"
                        emails = person.get('emailAddresses', [])
                        email = emails[0].get('value') if emails else "Sin correo"
                        ids = person.get('externalIds', [])
                        emp_id = ids[0].get('value') if ids else "Sin ID"
                        
                        lista_encontrados.append({
                            'Nombre Completo': name,
                            'Email': email,
                            'ID Empleado': emp_id,
                            'Carrera Detectada': valor_direccion
                        })
                        break
            
            # Imprimimos progreso simple para no ensuciar tanto la consola del menú
            print(f"   -> Procesados: {total_escaneados} | Encontrados: {len(lista_encontrados)}")

            next_page_token = results.get('nextPageToken')
            if not next_page_token:
                break
            pagina += 1

        duracion = time.time() - start_time
        print(f"✅ Finalizado en {duracion:.2f}s. Total encontrados: {len(lista_encontrados)}")

        # --- 3. GUARDADO CON VENTANA ---
        if lista_encontrados:
            print("📂 Selecciona dónde guardar el archivo...")
            
            # Crear instancia de Tkinter
            root = tk.Tk()
            root.withdraw() # Ocultar ventanita gris
            root.attributes('-topmost', True) # Forzar que aparezca encima de todo
            
            ruta_archivo = filedialog.asksaveasfilename(
                parent=root,
                initialfile="reporte_alumnos.xlsx",
                title="Guardar Reporte de Alumnos",
                defaultextension=".xlsx",
                filetypes=[("Excel", "*.xlsx")]
            )
            
            # IMPORTANTE: Destruir la instancia para liberar memoria y devolver control al menú
            root.destroy() 

            if ruta_archivo:
                df = pd.DataFrame(lista_encontrados)
                df.to_excel(ruta_archivo, index=False)
                print(f"🎉 Archivo guardado: {ruta_archivo}")
            else:
                print("⚠️ Guardado cancelado.")
        else:
            print("⚠️ No se encontraron resultados.")

    except Exception as err:
        print(f"❌ Ocurrió un error en el módulo: {err}")

