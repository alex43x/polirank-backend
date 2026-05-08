import os
import sys
from pathlib import Path
import tkinter as tk
from tkinter import filedialog

# Añade la raíz del proyecto al sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters.excel.excel_parser import ExcelParser
from adapters.db.docente_repository import DocenteRepository
from adapters.db.asignatura_repository import AsignaturaRepository
from adapters.db.seccion_repository import SeccionRepository
from adapters.db.curso_repository import CursoRepository
from adapters.db.usuario_repository import UsuarioRepository
from adapters.db.malla_repository import MallaRepository

from services.docente_service import DocenteService
from services.asignatura_service import AsignaturaService
from services.seccion_service import SeccionService
from services.curso_service import CursoService
from services.usuario_service import UsuarioService
from services.malla_service import MallaService
from services.validation_service import ValidationService

def seleccion_archivo():
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    print("📂 Abriendo ventana de selección...")
    ruta = filedialog.askopenfilename(
        title="Selecciona el archivo Excel",
        filetypes=[("Archivos Excel", "*.xlsx *.xls")]
    )
    root.destroy()
    return Path(ruta) if ruta else None

def limpiar_pantalla():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    mapping_path = Path(__file__).parent.parent / "config" / "column_mapping.json"
    
    while True:
        limpiar_pantalla()
        print("===================================")
        print("   SISTEMA DE GESTIÓN (V2)")
        print("===================================")
        print("[1] Dry-Run (Solo Validar)")
        print("[2] Importar Asignaturas")
        print("[3] Importar Docentes")
        print("[4] Importar Usuarios (Alumnos)")
        print("[5] Importar Secciones y Cursos")
        print("[6] Importar Malla Curricular")
        print("[7] Normalizar Usuarios (Excel)")
        print("[0] Salir")
        print("===================================")

        opcion = input("Selecciona una opción: ")
        
        if opcion == "0":
            break
            
        archivo = seleccion_archivo()
        if not archivo: continue

        # Inicialización de dependencias
        parser = ExcelParser(archivo, mapping_path)
        
        doc_repo = DocenteRepository()
        asig_repo = AsignaturaRepository()
        usr_repo = UsuarioRepository()
        sec_repo = SeccionRepository()
        cur_repo = CursoRepository()
        mal_repo = MallaRepository()
        
        doc_svc = DocenteService(doc_repo)
        asig_svc = AsignaturaService(asig_repo)
        usr_svc = UsuarioService(usr_repo)
        sec_svc = SeccionService(sec_repo, doc_repo, asig_repo)
        cur_svc = CursoService(cur_repo)
        mal_svc = MallaService(mal_repo)
        val_svc = ValidationService(parser, doc_svc, asig_svc, usr_svc)

        try:
            if opcion == "1":
                resultado = val_svc.ejecutar()
                resultado.imprimir_resumen()
            elif opcion == "2":
                df = parser.get_asignaturas()
                stats = asig_svc.importar(df)
                print("\n✅ Asignaturas importadas:", stats)
            elif opcion == "3":
                df = parser.get_docentes()
                stats = doc_svc.importar(df)
                print("\n✅ Docentes importados:", stats)
            elif opcion == "4":
                df = parser.get_usuarios()
                stats = usr_svc.importar(df)
                print("\n✅ Usuarios importados:", stats)
            elif opcion == "5":
                year = int(input("Ingrese el año (ej: 2026): ").strip())
                periodo = int(input("Ingrese el periodo (1 o 2): ").strip())
                df = parser.get_secciones()
                stats = sec_svc.importar(df, year, periodo)
                print("\n✅ Secciones y Cursos procesados:", stats)
            elif opcion == "6":
                df = parser.get_malla()
                stats = mal_svc.importar(df)
                print("\n✅ Malla importada:", stats)
            elif opcion == "7":
                df = parser.get_usuarios()
                path = usr_svc.filtrar_y_exportar(df)
                if path:
                    print(f"\n✅ Archivo generado: {path}")
                else:
                    print("\n⚠️ No se encontraron alumnos válidos para exportar.")
        except Exception as e:
            print(f"\n❌ Error durante el proceso: {e}")
            import traceback
            traceback.print_exc()
            
        input("\nPresiona ENTER para continuar...")

if __name__ == "__main__":
    main()
