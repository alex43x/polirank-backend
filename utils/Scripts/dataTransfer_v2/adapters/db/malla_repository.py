import psycopg2.extras
from typing import List, Dict
from core.models import Malla
from core.interfaces import IMallaRepository
from adapters.db.db_connection import DatabasePool

class MallaRepository(IMallaRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def mapear_carreras(self) -> Dict[str, int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT nombre, id FROM carreras")
                return {row[0].strip().upper(): row[1] for row in cur.fetchall() if row[0]}

    def mapear_asignaturas(self) -> Dict[str, int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                # Retorna {nombre_normalizado_minuscula: id}
                cur.execute("SELECT nombre, id FROM asignaturas")
                return {row[0].strip().lower(): row[1] for row in cur.fetchall() if row[0]}

    def insertar_bulk(self, mallas: List[Malla]) -> int:
        if not mallas: return 0
        
        datos = [(m.carrera_id, m.asignatura_id, m.semestre) for m in mallas]
        
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                query = """
                    INSERT INTO malla (carrera, asignatura, semestre)
                    VALUES %s
                    ON CONFLICT (carrera, asignatura, semestre) DO NOTHING
                """
                psycopg2.extras.execute_values(cur, query, datos, page_size=500)
                return cur.rowcount
