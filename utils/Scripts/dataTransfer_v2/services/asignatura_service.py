import pandas as pd
from core.models import Asignatura, ValidationReport
from core.interfaces import IAsignaturaRepository
from core.normalizers import normalizar_titulo_asignatura

class AsignaturaService:
    def __init__(self, repo: IAsignaturaRepository):
        self._repo = repo

    def validar(self, df: pd.DataFrame) -> ValidationReport:
        report = ValidationReport(entidad="Asignaturas")
        
        deptos_bd = self._repo.obtener_departamentos()
        titulos_procesados = set()

        for idx, row in df.iterrows():
            titulo = str(row.get("asignatura", "")).strip()
            depto = str(row.get("departamento", "")).strip().upper()
            
            if not titulo or titulo.lower() in ("nan", ""):
                continue
                
            if depto and depto not in deptos_bd:
                report.errores.append(f"Fila {idx+2}: Departamento desconocido '{depto}'")
            
            titulo_norm = normalizar_titulo_asignatura(titulo)
            if titulo_norm in titulos_procesados:
                report.advertencias.append(f"Fila {idx+2}: Asignatura duplicada '{titulo_norm}'")
            titulos_procesados.add(titulo_norm)

        return report

    def importar(self, df: pd.DataFrame) -> dict:
        asignaturas_unicas: dict[tuple, Asignatura] = {}
        stats = {
            "procesadas": 0,
            "omitidas_dpto_invalido": 0
        }
        
        deptos_bd = self._repo.obtener_departamentos()

        for _, row in df.iterrows():
            titulo = str(row.get("asignatura", "")).strip()
            depto = str(row.get("departamento", "")).strip().upper()
            
            if not titulo or titulo.lower() in ("nan", ""):
                continue
                
            stats["procesadas"] += 1
            
            if depto not in deptos_bd:
                stats["omitidas_dpto_invalido"] += 1
                continue
                
            titulo_norm = normalizar_titulo_asignatura(titulo)
            clave = (titulo_norm, depto)
            
            if clave not in asignaturas_unicas:
                asignaturas_unicas[clave] = Asignatura(
                    titulo=titulo_norm,
                    departamento=depto
                )
                
        insertadas = self._repo.insertar_bulk(list(asignaturas_unicas.values()))
        stats["insertadas"] = insertadas
        return stats
