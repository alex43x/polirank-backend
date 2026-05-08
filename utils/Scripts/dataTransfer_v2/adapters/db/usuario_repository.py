import psycopg2.extras
from typing import Optional, List, Dict, Tuple
from core.models import Usuario
from core.interfaces import IUsuarioRepository
from adapters.db.db_connection import DatabasePool

class UsuarioRepository(IUsuarioRepository):
    def __init__(self):
        self._db = DatabasePool.get_instance()

    def obtener_existentes_por_correo(self, correos: List[str]) -> Dict[str, int]:
        if not correos: return {}
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT correo, rol FROM alumnos WHERE correo = ANY(%s)",
                    (correos,)
                )
                return {row[0]: row[1] for row in cur.fetchall()}

    def mapear_carreras(self) -> Dict[str, int]:
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT nombre, id FROM carreras")
                # Almacena en UPPER por conveniencia de normalización
                return {row[0].strip().upper(): row[1] for row in cur.fetchall() if row[0]}

    def insertar_bulk(self, usuarios: List[Usuario], user_carreras: List[Tuple[str, int]]) -> Tuple[int, int]:
        """
        Inserta en 'alumnos' y 'matriculaciones'. Retorna (alumnos_insertados_updateados, mats_insertadas).
        """
        if not usuarios: return 0, 0
        
        alumnos_data = [(u.correo, u.nombre, u.password_hash, 4) for u in usuarios]
        
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                # 1. UPSERT Alumnos
                query_alumnos = """
                    INSERT INTO alumnos (correo, nombre, password, rol)
                    VALUES %s
                    ON CONFLICT (correo) DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        password = CASE
                            WHEN alumnos.rol = 4 THEN EXCLUDED.password
                            ELSE alumnos.password
                        END
                """
                psycopg2.extras.execute_values(cur, query_alumnos, alumnos_data)
                filas_alumnos = cur.rowcount
                
                # Obtener mapeo correo -> id_alumno
                correos_query = [u.correo for u in usuarios]
                cur.execute("SELECT correo, id FROM alumnos WHERE correo = ANY(%s)", (correos_query,))
                mapa_ids = {r[0]: r[1] for r in cur.fetchall()}

                # 2. Matriculaciones
                matriculas_data = []
                for correo, id_carr in user_carreras:
                    if correo in mapa_ids:
                        matriculas_data.append((mapa_ids[correo], id_carr))
                
                filas_matriculaciones = 0
                if matriculas_data:
                    query_mat = """
                        INSERT INTO matriculaciones (alumno, carrera)
                        VALUES %s
                        ON CONFLICT (alumno, carrera) DO NOTHING
                    """
                    psycopg2.extras.execute_values(cur, query_mat, matriculas_data)
                    filas_matriculaciones = cur.rowcount

                return filas_alumnos, filas_matriculaciones
