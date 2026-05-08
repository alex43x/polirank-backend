import pandas as pd
from core.models import Curso
from core.interfaces import ICursoRepository

class CursoService:
    def __init__(self, cur_repo: ICursoRepository):
        self._cur_repo = cur_repo

    def importar(self, secciones_creadas: dict, anio: int, periodo: int) -> dict:
        """
        Toma un diccionario de {(doc_id, asig_id): seccion_id} y crea los cursos.
        """
        stats = {
            "procesadas": len(secciones_creadas),
        }
        
        cursos_a_crear = []
        for sec_id in secciones_creadas.values():
            cursos_a_crear.append(Curso(
                seccion_id=sec_id,
                anio=anio,
                periodo=periodo
            ))
            
        insertados = self._cur_repo.insertar_bulk(cursos_a_crear)
        stats["insertados"] = insertados
        return stats
