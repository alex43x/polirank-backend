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
from adapters.db.malla_repository import MallaRepository

from services.docente_service import DocenteService
from services.asignatura_service import AsignaturaService
from services.seccion_service import SeccionService
from services.malla_service import MallaService
from services.validation_service import ValidationService


def seleccion_archivo() -> Path | None:
    """
    BUG-06 fix:
    - Sólo cae al input manual si Tkinter falla completamente (no si el usuario cancela).
    - Valida que el archivo exista antes de retornarlo.
    """
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        print("📂 Abriendo ventana de selección...")
        ruta_str = filedialog.askopenfilename(
            title="Selecciona el archivo Excel",
            filetypes=[("Archivos Excel", "*.xlsx *.xls")]
        )
        root.destroy()

        if not ruta_str:
            # El usuario canceló el diálogo — no caer al input manual
            return None

        p = Path(ruta_str)
        if not p.exists():
            print(f"❌ Archivo no encontrado: {ruta_str}")
            return None
        return p

    except Exception as e:
        print(f"⚠️ No se pudo abrir la interfaz gráfica: {e}")

    # Sólo llega aquí si Tkinter falló completamente
    ruta_manual = input("👉 Ingresa la ruta del archivo Excel (o deja vacío para cancelar): ").strip()
    if not ruta_manual:
        return None
    p = Path(ruta_manual)
    if not p.exists():
        print(f"❌ Archivo no encontrado: {ruta_manual}")
        return None
    return p


def limpiar_pantalla():
    os.system('cls' if os.name == 'nt' else 'clear')


def seleccionar_hoja(parser: ExcelParser) -> str | None:
    """Muestra las hojas disponibles y permite elegir una."""
    hojas = parser.listar_hojas_carreras()

    if not hojas:
        print("❌ No se encontraron hojas en el archivo.")
        return None

    print("\n📋 Hojas disponibles:")
    for i, hoja in enumerate(hojas, 1):
        print(f"  [{i}] {hoja}")

    while True:
        try:
            opcion = int(input("\n👉 Elige el número de la hoja: ")) - 1
            if 0 <= opcion < len(hojas):
                hoja_elegida = hojas[opcion]
                print(f"✅ Hoja seleccionada: {hoja_elegida}")
                parser.seleccionar_hoja(hoja_elegida)
                return hoja_elegida
            print("⚠️ Número inválido.")
        except ValueError:
            print("⚠️ Ingresa un número.")


def pedir_anio_periodo() -> tuple[int, int]:
    """
    DESIGN-05 fix: valida que el año esté en un rango razonable y
    que el período sea exactamente 1 o 2. Reintenta en lugar de lanzar ValueError.
    """
    while True:
        try:
            year = int(input("Ingrese el año (ej: 2025): ").strip())
            if not (2000 <= year <= 2100):
                print("⚠️ Año fuera de rango (2000-2100). Inténtalo de nuevo.")
                continue

            periodo = int(input("Ingrese el periodo (1 o 2): ").strip())
            if periodo not in (1, 2):
                print("⚠️ El período debe ser 1 o 2. Inténtalo de nuevo.")
                continue

            return year, periodo
        except ValueError:
            print("⚠️ Ingresa valores numéricos.")


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
        print("[4] Importar Secciones y Cursos")
        print("[5] Importar Malla Curricular")
        print("[0] Salir")
        print("===================================")

        opcion = input("Selecciona una opción: ")

        if opcion == "0":
            break

        archivo = seleccion_archivo()
        if not archivo: continue

        # Inicialización del parser
        parser = ExcelParser(archivo, mapping_path)

        # Selección de hoja de carrera
        hoja = seleccionar_hoja(parser)
        if not hoja: continue

        # Inicialización de repositorios
        doc_repo = DocenteRepository()
        asig_repo = AsignaturaRepository()
        sec_repo = SeccionRepository()
        cur_repo = CursoRepository()
        mal_repo = MallaRepository()

        # Inicialización de servicios
        # BUG-02 fix: cur_repo se inyecta en SeccionService (antes lo instanciaba internamente)
        doc_svc = DocenteService(doc_repo)
        asig_svc = AsignaturaService(asig_repo)
        sec_svc = SeccionService(sec_repo, doc_repo, asig_repo, cur_repo)
        mal_svc = MallaService(mal_repo)
        val_svc = ValidationService(parser, doc_svc, asig_svc)

        try:
            if opcion == "1":
                print(f"\n🔍 Ejecutando Dry-Run en hoja '{hoja}'...")
                resultado = val_svc.ejecutar()
                resultado.imprimir_resumen()
            elif opcion == "2":
                print(f"\n📚 Importando asignaturas de '{hoja}'...")
                df = parser.get_asignaturas()
                stats = asig_svc.importar(df)
                print("\n✅ Asignaturas importadas:", stats)
            elif opcion == "3":
                print(f"\n👨‍🏫 Importando docentes de '{hoja}'...")
                df = parser.get_docentes()
                stats = doc_svc.importar(df)
                print("\n✅ Docentes importados:", stats)
            elif opcion == "4":
                # DESIGN-05 fix: validación de año y período con reintento
                year, periodo = pedir_anio_periodo()
                print(f"\n📝 Importando secciones de '{hoja}' para {year}-{periodo}...")
                df = parser.get_secciones()
                stats = sec_svc.importar(df, year, periodo)
                print("\n✅ Secciones y Cursos procesados:", stats)
            elif opcion == "5":
                print(f"\n📋 Importando malla curricular de '{hoja}'...")
                df = parser.get_malla()
                stats = mal_svc.importar(df)
                print("\n✅ Malla importada:", stats)
        except Exception as e:
            print(f"\n❌ Error durante el proceso: {e}")
            import traceback
            traceback.print_exc()

        input("\nPresiona ENTER para continuar...")


if __name__ == "__main__":
    main()
