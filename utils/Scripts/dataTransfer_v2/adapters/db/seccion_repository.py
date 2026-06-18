import psycopg2.extras
from typing import Optional, List, Dict, Tuple
from core.models import Seccion
from core.interfaces import ISeccionRepository
from adapters.db.db_connection import DatabasePool


class SeccionRepository(ISeccionRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def buscar(self, docente_id: int, asignatura_id: int) -> Optional[int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM secciones WHERE docente = %s AND asignatura = %s LIMIT 1",
                    (docente_id, asignatura_id)
                )
                row = cur.fetchone()
                return row[0] if row else None

    def obtener_todas(self) -> Dict[Tuple[int, int], int]:
        """Devuelve map {(docente_id, asignatura_id): seccion_id}"""
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, docente, asignatura FROM secciones")
                return {(r[1], r[2]): r[0] for r in cur.fetchall()}

    def insertar_bulk_and_return_ids(self, secciones: List[Seccion]) -> Dict[Tuple[int, int], int]:
        if not secciones: return {}

        datos = [(s.docente_id, s.asignatura_id) for s in secciones]

        with self._db.connection() as conn:
            with conn.cursor() as cur:
                # BUG-03 fix: ON CONFLICT DO NOTHING + RETURNING sólo devuelve las filas
                # NUEVAS. Las secciones ya existentes no se retornan y sus cursos nunca
                # se crearían en una segunda importación.
                #
                # Solución: ON CONFLICT DO UPDATE con un no-op (SET docente = EXCLUDED.docente)
                # fuerza que PostgreSQL siempre ejecute RETURNING, tanto para inserts nuevos
                # como para filas que ya existían.
                query = """
                    INSERT INTO secciones (docente, asignatura)
                    VALUES %s
                    ON CONFLICT (docente, asignatura) DO UPDATE
                        SET docente = EXCLUDED.docente
                    RETURNING id, docente, asignatura
                """
                rows = psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos,
                    fetch=True,
                    page_size=500,
                )
                # Map (doc_id, asig_id) -> seccion_id para todas las secciones (nuevas + existentes)
                return {(r[1], r[2]): r[0] for r in rows} if rows else {}
