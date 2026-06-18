import psycopg2.extras
from typing import List, Dict, Tuple
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
        # BUG-09 fix: Mapear desde el nombre en BD a la sigla en memoria
        from core.normalizers import normalizar_texto, CARRERA_MAP
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT nombre, id FROM carreras")
                mapa = {}
                for row in cur.fetchall():
                    if row[0]:
                        nombre_norm = normalizar_texto(row[0])
                        sigla = CARRERA_MAP.get(nombre_norm)
                        if sigla:
                            mapa[sigla] = row[1]
                return mapa

    def insertar_bulk(
        self,
        usuarios: List[Usuario],
        user_carreras: List[Tuple[str, int]]
    ) -> Tuple[int, int]:
        """
        Inserta en 'alumnos' y 'matriculaciones'.
        Retorna (alumnos_insertados_o_actualizados, matriculaciones_insertadas).

        BUG-07 fix: firma alineada con IUsuarioRepository — ambos parámetros declarados
        explícitamente en la interfaz (ver interfaces.py).
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
                    RETURNING id
                """
                rows_alumnos = psycopg2.extras.execute_values(
                    cur, query_alumnos, alumnos_data, fetch=True
                )
                filas_alumnos = len(rows_alumnos) if rows_alumnos else 0

                # Obtener mapeo correo → id_alumno
                correos_query = [u.correo for u in usuarios]
                cur.execute(
                    "SELECT correo, id FROM alumnos WHERE correo = ANY(%s)",
                    (correos_query,)
                )
                mapa_ids = {r[0]: r[1] for r in cur.fetchall()}

                # 2. Matriculaciones
                matriculas_data = [
                    (mapa_ids[correo], id_carr)
                    for correo, id_carr in user_carreras
                    if correo in mapa_ids
                ]

                filas_matriculaciones = 0
                if matriculas_data:
                    query_mat = """
                        INSERT INTO matriculaciones (alumno, carrera)
                        VALUES %s
                        ON CONFLICT (alumno, carrera) DO NOTHING
                        RETURNING id
                    """
                    rows_mat = psycopg2.extras.execute_values(
                        cur, query_mat, matriculas_data, fetch=True
                    )
                    filas_matriculaciones = len(rows_mat) if rows_mat else 0

                return filas_alumnos, filas_matriculaciones
