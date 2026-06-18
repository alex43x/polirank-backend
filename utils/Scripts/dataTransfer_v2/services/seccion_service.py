import pandas as pd
from core.models import Seccion, Curso, ValidationReport
from core.interfaces import ISeccionRepository, IDocenteRepository, IAsignaturaRepository
from core.normalizers import (
    normalizar_titulo_con_carrera,
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
        
        secciones_a_crear = []  # List[Seccion]
        
        for _, row in df.iterrows():
            titulo_raw = str(row.get("asignatura", "")).strip()
            if not titulo_raw or titulo_raw.lower() in ("nan", ""):
                continue
                
            carrera_sigla = str(row.get("_hoja_origen", "")).strip().upper()
            titulo_norm = normalizar_titulo_con_carrera(titulo_raw, carrera_sigla)
            asig_tuple = self._asig_repo.buscar_por_titulo_normalizado(titulo_norm)
            
            if not asig_tuple:
                stats["omitidas_asig_no_encontrada"] += 1
                continue
            
            asig_id = asig_tuple[0]
            
            # Columnas del Excel real: apellido y nombre vienen por separado
            apellido = str(row.get("apellido_docente", "")).strip()
            nombre = str(row.get("nombre_docente", "")).strip()
            correo = str(row.get("correo_docente", "")).strip()
            
            if not apellido and not nombre:
                stats["omitidas_doc_no_encontrado"] += 1
                continue
            
            stats["procesados"] += 1
            
            # Buscar docente: primero por correo, luego por nombre, luego por correo genérico
            docente = None
            
            if correo and correo.lower() not in ("nan", "", "none"):
                docente = self._doc_repo.buscar_por_correo(correo)
            
            if not docente and nombre and apellido:
                nom_completo = f"{nombre} {apellido}".strip()
                nom_norm = normalizar_texto(nom_completo)
                docente = self._doc_repo.buscar_por_nombre_normalizado(nom_norm)
            
            if not docente and nombre and apellido:
                c_gen = generar_correo_generico(nombre, apellido)
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
            
            from adapters.db.curso_repository import CursoRepository
            cur_repo = CursoRepository()
            stats["cursos_creados"] = cur_repo.insertar_bulk(cursos_a_insertar)
            
        return stats
