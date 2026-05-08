import os
from dotenv import load_dotenv

# Cargar variables (.env asume estar en polirank-backend raíz)
current_dir = os.path.dirname(os.path.abspath(__file__))
# config/ -> dataTransfer_v2/ -> Scripts/ -> utils/ -> polirank-backend/ (4 niveles)
root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))
env_path = os.path.join(root_dir, '.env')

if os.path.exists(env_path):
    load_dotenv(env_path)


DB_CONFIG = {
    'host': os.getenv('PG_HOST', 'localhost'),
    'user': os.getenv('PG_USER', 'postgres'),
    'password': os.getenv('PG_PASSWORD', ''),
    'database': os.getenv('PG_DATABASE', 'polirankDB'),
    'port': os.getenv('PG_PORT', '5432'),
}
