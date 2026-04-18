import psycopg2.extras
from typing import Optional, List
from core.models import Docente
from core.interfaces import IDocenteRepository
from adapters.db.db_connection import DatabasePool

class DocenteRepository(IDocenteRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def buscar_por_nombre_normalizado(self, nombre: str) -> Optional[Docente]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                # Usamos una búsqueda simple por ILIKE o similar ya que fuzzy se hace en Service si es necesario
                cur.execute(
                    "SELECT id, nombre, correo FROM docentes "
                    "WHERE lower(nombre) = lower(%s) LIMIT 1",
                    (nombre,)
                )
                row = cur.fetchone()
                if row:
                    # Dividimos el nombre para el modelo
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
                    ON CONFLICT (correo) DO UPDATE SET
                    correo = EXCLUDED.correo
                    WHERE docentes.correo NOT LIKE '%@pol.una.py' AND EXCLUDED.correo LIKE '%@pol.una.py'
                    RETURNING id
                """
                
                # psycopg2 no soporta RETURNING con execute_values tan fácilmente para asignar a objetos individuales
                # pero podemos usarlo para saber qué se insertó o usar RETURNING en casos unitarios.
                # Para bulk insert, el orquestador de V2 acepta el conteo.
                psycopg2.extras.execute_values(
                    cur,
                    query,
                    datos,
                    page_size=500
                )
                return cur.rowcount
