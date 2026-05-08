import psycopg2.extras
from typing import Optional, List, Tuple
from core.models import Asignatura
from core.interfaces import IAsignaturaRepository
from adapters.db.db_connection import DatabasePool

class AsignaturaRepository(IAsignaturaRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def buscar_por_titulo_normalizado(self, titulo: str) -> Optional[tuple[int, Asignatura]]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, nombre, depto FROM asignaturas "
                    "WHERE lower(trim(nombre)) = lower(%s) LIMIT 1",
                    (titulo,)
                )
                row = cur.fetchone()
                if row:
                    asig = Asignatura(id=row[0], titulo=row[1], depto_id=row[2])
                    return (row[0], asig)
                return None

    def obtener_departamentos(self) -> dict[str, int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT siglas, id FROM departamentos")
                return {row[0].strip().upper(): row[1] for row in cur.fetchall() if row[0]}

    def insertar_bulk(self, asignaturas: List[Asignatura]) -> int:
        if not asignaturas: return 0
        
        deptos = self.obtener_departamentos()
        
        datos_insert = []
        for asig in asignaturas:
            id_dept = deptos.get(asig.departamento.strip().upper()) if asig.departamento else asig.depto_id
            if id_dept:
                datos_insert.append((asig.titulo, id_dept))
        
        if not datos_insert: return 0

        with self._db.connection() as conn:
            with conn.cursor() as cur:
                query = """
                    INSERT INTO asignaturas (nombre, depto)
                    VALUES %s
                    ON CONFLICT (nombre, depto) DO NOTHING
                """
                psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos_insert,
                    page_size=500
                )
                return cur.rowcount
