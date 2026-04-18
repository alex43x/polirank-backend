import pandas as pd
from core.models import Docente, ValidationReport
from core.interfaces import IDocenteRepository
from core.normalizers import (
    extraer_docentes_de_celda, 
    es_duplicado_fuzzy,
    generar_correo_generico, 
    normalizar_texto,
    es_correo_institucional
)

class DocenteService:
    def __init__(self, repo: IDocenteRepository):
        self._repo = repo

    def validar(self, df: pd.DataFrame) -> ValidationReport:
        report = ValidationReport(entidad="Docentes")
        nombres_vistos: list[str] = []

        for idx, row in df.iterrows():
            celda_nombre = row.get("nombre", "")
            for nombre_extraido in extraer_docentes_de_celda(celda_nombre):
                partes = nombre_extraido.split(" ", 1)
                if len(partes) < 2:
                    report.advertencias.append(f"Fila {idx+2}: '{nombre_extraido}' podría no tener nombre y apellido completos.")
                    continue
                
                nombre_norm = normalizar_texto(nombre_extraido)
                for visto in nombres_vistos:
                    if es_duplicado_fuzzy(nombre_norm, visto):
                        report.advertencias.append(
                            f"Fila {idx+2}: Posible duplicado en el mismo archivo '{nombre_extraido}' ~ '{visto}'"
                        )
                nombres_vistos.append(nombre_norm)
        return report

    def importar(self, df: pd.DataFrame) -> dict:
        """
        Retorna estadísticas de importación.
        """
        docentes_nuevos: list[Docente] = []
        correos_usados: set[str] = set()
        stats = {
            "procesados": 0,
            "omitidos_duplicados": 0,
            "correos_generados": 0,
            "institucionales": 0
        }

        for _, row in df.iterrows():
            for nombre_extraido in extraer_docentes_de_celda(row.get("nombre", "")):
                stats["procesados"] += 1
                
                partes = nombre_extraido.strip().split(" ", 1)
                if len(partes) < 2:
                    nombre = partes[0]
                    apellido = "Sin Apellido"
                else:
                    nombre, apellido = partes[0], partes[1]

                # Verificar BD
                # En lugar de consultar BD registro a registro (que es N), podríamos cachear.
                # Para simplificar y mejorar consistencia, hacemos la consulta.
                existente = self._repo.buscar_por_nombre_normalizado(
                    normalizar_texto(nombre_extraido)
                )
                
                correo_raw = str(row.get("correo", "")).strip()
                if correo_raw.lower() in ("nan", "", "none"):
                    correo_raw = None

                correo_inst = correo_raw if es_correo_institucional(correo_raw) else None

                if existente:
                    stats["omitidos_duplicados"] += 1
                    continue

                correo_gen = None
                if not correo_inst:
                    correo_gen = generar_correo_generico(nombre, apellido)
                    base = correo_gen.split('@')[0]
                    contador = 2
                    # Resolver colisiones localmente
                    while correo_gen in correos_usados or self._repo.buscar_por_correo(correo_gen):
                        correo_gen = f"{base}{contador}@pol.una.py"
                        contador += 1
                    correos_usados.add(correo_gen)
                    stats["correos_generados"] += 1
                else:
                    stats["institucionales"] += 1

                docentes_nuevos.append(Docente(
                    nombre=nombre,
                    apellido=apellido,
                    correo=correo_gen,
                    correo_institucional=correo_inst,
                ))

        insertados = self._repo.insertar_bulk(docentes_nuevos)
        stats["insertados"] = insertados
        return stats
