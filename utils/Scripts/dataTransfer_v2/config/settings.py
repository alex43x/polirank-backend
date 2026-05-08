import os
from dotenv import load_dotenv

# Cargar variables (.env asume estar en polirank-backend raíz o en config/)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

DB_CONFIG = {
    'host': os.getenv('PG_HOST', 'localhost'),
    'user': os.getenv('PG_USER', 'postgres'),
    'password': os.getenv('PG_PASSWORD', ''),
    'database': os.getenv('PG_DATABASE', 'polirankDB'),
    'port': os.getenv('PG_PORT', '5432'),
}
