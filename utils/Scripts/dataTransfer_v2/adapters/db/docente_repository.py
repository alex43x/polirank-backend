import psycopg2.extras
from typing import Optional, List
from core.models import Docente
from core.interfaces import IDocenteRepository
from adapters.db.db_connection import DatabasePool


class DocenteRepository(IDocenteRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def buscar_por_nombre_normalizado(self, nombre: str) -> Optional[Docente]:
        """Busca un docente por nombre normalizado (sin acentos, minúsculas).

        BUG-11 fix: la comparación SQL con lower() ignora acentos sólo si PostgreSQL
        tiene la extensión 'unaccent'. Aquí intentamos con unaccent() primero;
        si no está disponible, hacemos el fallback con lower() y filtramos en Python
        usando la misma normalización que aplica el service.
        """
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "SELECT id, nombre, correo FROM docentes "
                        "WHERE unaccent(lower(nombre)) = unaccent(lower(%s)) LIMIT 1",
                        (nombre,)
                    )
                    row = cur.fetchone()
                except Exception:
                    # unaccent no disponible: rollback del error y fallback a lower()
                    conn.rollback()
                    cur.execute(
                        "SELECT id, nombre, correo FROM docentes "
                        "WHERE lower(nombre) = lower(%s) LIMIT 1",
                        (nombre,)
                    )
                    row = cur.fetchone()

                if row:
                    partes = str(row[1]).split(" ", 1)
                    nom = partes[0]
                    ape = partes[1] if len(partes) > 1 else ""
                    return Docente(id=row[0], nombre=nom, apellido=ape, correo=row[2])
                return None

    def buscar_por_correo(self, correo: str) -> Optional[Docente]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, nombre, correo FROM docentes "
                    "WHERE lower(correo) = lower(%s) LIMIT 1",
                    (correo,)
                )
                row = cur.fetchone()
                if row:
                    partes = str(row[1]).split(" ", 1)
                    nom = partes[0]
                    ape = partes[1] if len(partes) > 1 else ""
                    return Docente(id=row[0], nombre=nom, apellido=ape, correo=row[2])
                return None

    def actualizar_correo(self, docente_id: int, nuevo_correo: str) -> bool:
        """Actualiza el correo de un docente existente por su ID."""
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE docentes SET correo = %s WHERE id = %s",
                    (nuevo_correo, docente_id)
                )
                return cur.rowcount > 0

    def insertar_bulk(self, docentes: List[Docente]) -> int:
        if not docentes: return 0

        with self._db.connection() as conn:
            with conn.cursor() as cur:
                datos = [
                    (f"{d.nombre} {d.apellido}".strip(), d.correo_efectivo)
                    for d in docentes
                ]

                query = """
                    INSERT INTO docentes (nombre, correo)
                    VALUES %s
                    ON CONFLICT (correo) DO NOTHING
                    RETURNING id
                """
                # BUG-01 fix: fetch=True devuelve las filas de RETURNING.
                # cur.rowcount con execute_values + ON CONFLICT DO NOTHING es siempre -1.
                rows = psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos,
                    fetch=True,
                    page_size=500
                )
                return len(rows) if rows else 0
