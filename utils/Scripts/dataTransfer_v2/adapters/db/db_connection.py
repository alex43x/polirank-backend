import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from config.settings import DB_CONFIG
from core.exceptions import DatabaseConnectionError

class DatabasePool:
    _instance: "DatabasePool | None" = None
    _pool: pool.SimpleConnectionPool | None = None

    @classmethod
    def get_instance(cls) -> "DatabasePool":
        if cls._instance is None:
            cls._instance = cls()
            try:
                # Minimum 1 connection, maximum 10
                cls._pool = pool.SimpleConnectionPool(1, 10, **DB_CONFIG)
            except Exception as e:
                raise DatabaseConnectionError(f"Error inicializando Pool DB: {e}")
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
