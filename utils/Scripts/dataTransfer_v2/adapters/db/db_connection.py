import threading
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from config.settings import DB_CONFIG
from core.exceptions import DatabaseConnectionError


class DatabasePool:
    _instance: "DatabasePool | None" = None
    _pool: pool.SimpleConnectionPool | None = None
    _lock = threading.Lock()  # BUG-04 fix: proteger la inicialización del singleton

    @classmethod
    def get_instance(cls) -> "DatabasePool":
        # BUG-04 fix: double-checked locking para thread safety.
        # Sin esto, dos hilos pueden pasar el `if _instance is None` simultáneamente,
        # crear dos pools independientes, y dejar _instance en estado inconsistente
        # si el constructor del pool lanza una excepción.
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = cls()
                    try:
                        instance._pool = pool.SimpleConnectionPool(1, 10, **DB_CONFIG)
                    except Exception as e:
                        # No asignar _instance si el pool falló — evita retornar
                        # una instancia rota en llamadas posteriores.
                        raise DatabaseConnectionError(f"Error inicializando Pool DB: {e}")
                    cls._instance = instance  # asignar sólo si el pool está OK
        return cls._instance

    @contextmanager
    def connection(self):
        if not self._pool:
            raise DatabaseConnectionError("El pool de conexiones no está inicializado.")

        conn = self._pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)
