import pandas as pd
from core.models import Malla
from core.interfaces import IMallaRepository
from core.normalizers import normalizar_titulo_asignatura

class MallaService:
    def __init__(self, repo: IMallaRepository):
        self._repo = repo

    def importar(self, df: pd.DataFrame) -> dict:
        stats = {
            "procesados": 0,
            "omitidos_carrera_inv": 0,
            "omitidos_asig_inv": 0
        }
        
        mapa_carreras = self._repo.mapear_carreras()
        mapa_asignaturas = self._repo.mapear_asignaturas()
        
        mallas_a_insertar = []
        vistos = set()
        
        for _, row in df.iterrows():
            asig_raw = str(row.get("asignatura", "")).strip()
            carrera_raw = str(row.get("carrera", "")).strip().upper()
            
            if not asig_raw or asig_raw.lower() in ("nan", ""):
                continue
                
            stats["procesados"] += 1
            
            if carrera_raw not in mapa_carreras:
                stats["omitidos_carrera_inv"] += 1
                continue
                
            asig_norm = normalizar_titulo_asignatura(asig_raw).lower()
            
            if asig_norm not in mapa_asignaturas:
                stats["omitidos_asig_inv"] += 1
                continue
                
            c_id = mapa_carreras[carrera_raw]
            a_id = mapa_asignaturas[asig_norm]
            semestre = 0
            try:
                semestre = int(float(row.get("semestre", 0)))
            except (ValueError, TypeError):
                pass
                
            clave = (c_id, a_id, semestre)
            if clave in vistos: continue
            
            vistos.add(clave)
            mallas_a_insertar.append(Malla(
                asignatura_id=a_id,
                carrera_id=c_id,
                semestre=semestre
            ))
            
        insertadas = self._repo.insertar_bulk(mallas_a_insertar)
        stats["insertadas"] = insertadas
        
        return stats
