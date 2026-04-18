import pandas as pd
from core.models import Seccion, ValidationReport
from core.interfaces import ISeccionRepository, IDocenteRepository, IAsignaturaRepository
from core.normalizers import (
    extraer_docentes_de_celda, 
    normalizar_titulo_asignatura,
    normalizar_texto, 
    generar_correo_generico
)

class SeccionService:
    def __init__(self, sec_repo: ISeccionRepository, doc_repo: IDocenteRepository, asig_repo: IAsignaturaRepository):
        self._sec_repo = sec_repo
        self._doc_repo = doc_repo
        self._asig_repo = asig_repo

    def importar(self, df: pd.DataFrame, anio: int, periodo: int) -> dict:
        stats = {
            "procesados": 0,
            "omitidas_asig_no_encontrada": 0,
            "omitidas_doc_no_encontrado": 0,
            "secciones_nuevas": 0,
            "cursos_creados": 0
        }
        
        secciones_a_crear = [] # List[Seccion]
        
        for _, row in df.iterrows():
            titulo_raw = str(row.get("asignatura", "")).strip()
            if not titulo_raw or titulo_raw.lower() in ("nan", ""):
                continue
                
            titulo_norm = normalizar_titulo_asignatura(titulo_raw)
            asig_tuple = self._asig_repo.buscar_por_titulo_normalizado(titulo_norm)
            
            if not asig_tuple:
                stats["omitidas_asig_no_encontrada"] += 1
                continue
            
            asig_id = asig_tuple[0]
            
            nombres_raw = str(row.get("docente_nombres", "")).strip()
            apellidos_raw = str(row.get("docente_apellidos", "")).strip()
            correos_raw = str(row.get("correo", "")).strip()
            
            l_nom = extraer_docentes_de_celda(nombres_raw)
            l_ap = extraer_docentes_de_celda(apellidos_raw)
            l_cor = extraer_docentes_de_celda(correos_raw)
            
            max_len = max(len(l_nom), len(l_ap), len(l_cor))
            
            for i in range(max_len):
                stats["procesados"] += 1
                n = l_nom[i] if i < len(l_nom) else ""
                a = l_ap[i] if i < len(l_ap) else ""
                c = l_cor[i] if i < len(l_cor) else ""
                
                docente = None
                if c:
                    docente = self._doc_repo.buscar_por_correo(c)
                
                if not docente and n and a:
                    nom_norm = normalizar_texto(f"{n} {a}")
                    docente = self._doc_repo.buscar_por_nombre_normalizado(nom_norm)
                
                if not docente and n and a:
                    c_gen = generar_correo_generico(n, a)
                    docente = self._doc_repo.buscar_por_correo(c_gen)
                
                if not docente:
                    stats["omitidas_doc_no_encontrado"] += 1
                    continue
                    
                doc_id = docente.id
                if doc_id:
                    secciones_a_crear.append(Seccion(docente_id=doc_id, asignatura_id=asig_id))
        
        if secciones_a_crear:
            # Upsert secciones y obtener todos los IDs (existentes + nuevos)
            mapa_secciones = self._sec_repo.insertar_bulk_and_return_ids(secciones_a_crear)
            stats["secciones_nuevas"] = len(mapa_secciones)
            
            # Crear cursos
            cursos_a_insertar = []
            for sec_id in mapa_secciones.values():
                cursos_a_insertar.append(Curso(seccion_id=sec_id, anio=anio, periodo=periodo))
            
            # Repositorio de cursos (asumo que se inyecta o se usa a través del orquestador, 
            # pero aquí lo hacemos directo para paridad con v1)
            from adapters.db.curso_repository import CursoRepository
            cur_repo = CursoRepository()
            stats["cursos_creados"] = cur_repo.insertar_bulk(cursos_a_insertar)
            
        return stats
