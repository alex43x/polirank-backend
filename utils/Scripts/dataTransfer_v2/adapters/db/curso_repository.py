import psycopg2.extras
from typing import Optional, List
from core.models import Curso
from core.interfaces import ICursoRepository
from adapters.db.db_connection import DatabasePool


class CursoRepository(ICursoRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def buscar(self, seccion_id: int, anio: int, periodo: int) -> Optional[int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM cursos WHERE seccion = %s AND year = %s AND periodo = %s LIMIT 1",
                    (seccion_id, anio, periodo)
                )
                row = cur.fetchone()
                return row[0] if row else None

    def insertar_bulk(self, cursos: List[Curso]) -> int:
        if not cursos: return 0

        datos = [(c.seccion_id, c.anio, c.periodo) for c in cursos]

        with self._db.connection() as conn:
            with conn.cursor() as cur:
                query = """
                    INSERT INTO cursos (seccion, year, periodo)
                    VALUES %s
                    ON CONFLICT (seccion, year, periodo) DO NOTHING
                    RETURNING id
                """
                # BUG-01 fix: fetch=True devuelve filas RETURNING; len(rows) es el conteo real.
                # cur.rowcount con execute_values + ON CONFLICT DO NOTHING siempre es -1.
                rows = psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos,
                    fetch=True,
                    page_size=500
                )
                return len(rows) if rows else 0
