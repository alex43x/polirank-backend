import os
from dotenv import load_dotenv

# Cargar variables (.env asume estar en polirank-backend raíz)
current_dir = os.path.dirname(os.path.abspath(__file__))
# config/ -> dataTransfer_v2/ -> Scripts/ -> utils/ -> polirank-backend/ (4 niveles)
root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))
env_path = os.path.join(root_dir, '.env')

if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # SMELL-04 fix: advertir explícitamente en lugar de continuar en silencio
    # con credenciales por defecto que podrían apuntar a la BD equivocada.
    print(f"⚠️  ADVERTENCIA: No se encontró el archivo .env en '{env_path}'.")
    print("   Se usarán los valores por defecto (host=localhost, user=postgres).")
    print("   Asegúrate de que el .env esté en la raíz de polirank-backend.\n")


DB_CONFIG = {
    'host': os.getenv('PG_HOST', 'localhost'),
    'user': os.getenv('PG_USER', 'postgres'),
    'password': os.getenv('PG_PASSWORD', ''),
    'database': os.getenv('PG_DATABASE', 'polirankDB'),
    'port': os.getenv('PG_PORT', '5432'),
}
