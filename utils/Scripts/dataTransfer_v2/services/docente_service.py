import pandas as pd
from core.models import Docente, ValidationReport
from core.interfaces import IDocenteRepository
from core.normalizers import (
    es_duplicado_fuzzy,
    generar_correo_generico, 
    normalizar_texto,
    es_correo_institucional,
    es_correo_generado
)

class DocenteService:
    def __init__(self, repo: IDocenteRepository):
        self._repo = repo

    def validar(self, df: pd.DataFrame) -> ValidationReport:
        report = ValidationReport(entidad="Docentes")
        nombres_vistos: list[str] = []

        for idx, row in df.iterrows():
            apellido = str(row.get("apellido_docente", "")).strip()
            nombre = str(row.get("nombre_docente", "")).strip()
            
            if not apellido and not nombre:
                continue
            
            nombre_completo = f"{nombre} {apellido}".strip()
            
            if not nombre or not apellido:
                report.advertencias.append(
                    f"Fila {idx+2}: '{nombre_completo}' podría no tener nombre y apellido completos."
                )
                continue
            
            nombre_norm = normalizar_texto(nombre_completo)
            for visto in nombres_vistos:
                if es_duplicado_fuzzy(nombre_norm, visto):
                    report.advertencias.append(
                        f"Fila {idx+2}: Posible duplicado '{nombre_completo}' ~ '{visto}'"
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
            apellido = str(row.get("apellido_docente", "")).strip()
            nombre = str(row.get("nombre_docente", "")).strip()
            correo_raw = str(row.get("correo_docente", "")).strip()
            
            if not apellido and not nombre:
                continue
                
            stats["procesados"] += 1
            
            if not nombre:
                nombre = "Sin Nombre"
            if not apellido:
                apellido = "Sin Apellido"

            # Verificar si ya existe en BD
            nombre_completo = f"{nombre} {apellido}".strip()
            existente = self._repo.buscar_por_nombre_normalizado(
                normalizar_texto(nombre_completo)
            )
            
            if correo_raw.lower() in ("nan", "", "none"):
                correo_raw = None

            correo_inst = correo_raw if es_correo_institucional(correo_raw) else None

            if existente:
                # Si el docente existe con correo generado Y ahora trae correo real → ACTUALIZAR
                if correo_inst and es_correo_generado(existente.correo):
                    self._repo.actualizar_correo(existente.id, correo_inst)
                    stats["correos_actualizados"] = stats.get("correos_actualizados", 0) + 1
                else:
                    stats["omitidos_duplicados"] += 1
                continue

            # Evitar duplicados por correo institucional en el mismo lote
            if correo_inst and correo_inst in correos_usados:
                stats["omitidos_duplicados"] += 1
                continue

            correo_gen = None
            if not correo_inst:
                correo_gen = generar_correo_generico(nombre, apellido)
                base = correo_gen.split('@')[0]
                contador = 2
                # Resolver colisiones localmente y contra la BD
                while correo_gen in correos_usados or self._repo.buscar_por_correo(correo_gen):
                    correo_gen = f"{base}{contador}@noemail.pol.una.py"
                    contador += 1
                correos_usados.add(correo_gen)
                stats["correos_generados"] += 1
            else:
                correos_usados.add(correo_inst)
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
