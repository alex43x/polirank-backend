import psycopg2.extras
from typing import Optional, List
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
        """Retorna {sigla_upper: id}. Abre su propia conexión (uso externo en validación)."""
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT siglas, id FROM departamentos")
                return {row[0].strip().upper(): row[1] for row in cur.fetchall() if row[0]}

    def insertar_bulk(self, asignaturas: List[Asignatura]) -> int:
        if not asignaturas: return 0

        # BUG-10 fix: departamentos e INSERT dentro de la misma conexión/transacción.
        # Así se evita el riesgo de leer datos stale y se reduce el uso del pool a 1 conexión.
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT siglas, id FROM departamentos")
                deptos = {row[0].strip().upper(): row[1] for row in cur.fetchall() if row[0]}

                datos_insert = []
                for asig in asignaturas:
                    id_dept = (
                        deptos.get(asig.departamento.strip().upper())
                        if asig.departamento
                        else asig.depto_id
                    )
                    if id_dept:
                        datos_insert.append((asig.titulo, id_dept))

                if not datos_insert: return 0

                query = """
                    INSERT INTO asignaturas (nombre, depto)
                    VALUES %s
                    ON CONFLICT (nombre, depto) DO NOTHING
                    RETURNING id
                """
                # BUG-01 fix: execute_values con fetch=True devuelve las filas RETURNING.
                # cur.rowcount siempre sería -1 con execute_values + ON CONFLICT DO NOTHING.
                rows = psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos_insert,
                    fetch=True,
                    page_size=500
                )
                return len(rows) if rows else 0
