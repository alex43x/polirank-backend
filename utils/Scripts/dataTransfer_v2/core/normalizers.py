import re
import unicodedata
from thefuzz import fuzz

# Diccionario de typos conocidos en títulos de asignaturas
TYPO_MAP = {
    "sotfware": "Software", 
    "sofware": "Software", 
    "programcion": "Programación",
    "datamining": "Data Mining",
    "Tecnologia": "Tecnología",
    "lenguajes": "Lenguajes",
    "Electiva I - ": "", 
    "Electiva II - ": "",
}

# Conversión de ordinales a números romanos
ROMANO_MAP = {"1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI", "7": "VII", "8": "VIII", "9": "IX", "10": "X"}

# Normalización de carreras a siglas
CARRERA_MAP = {
    "ingenieria informatica": "IIN",
    "ingenieria de sistemas de produccion": "ISP",
    "ingenieria en marketing": "IMK",
    "ingenieria electrica": "IEL",
    "ingenieria en electonica": "IEK",
    "ingenieria aeronautica": "IAE",
    "ingenieria en ciencias de los materiales": "ICM",
    "ingenieria en energia": "IEN",
    "licenciatura en ciencias informaticas": "LCIK",
    "lick": "LCIK",
    "licenciatura en electricidad": "LEL",
    "licenciatura en ciencias atmosfericas": "LCA",
    "licenciatura en gestion de la hospitalidad": "LGH",
    "lhg": "LGH",
    "iif": "IIN",
}

def normalizar_texto(texto: str) -> str:
    """Elimina acentos, convierte a minúsculas, colapsa espacios."""
    if not texto: return ""
    nfkd = unicodedata.normalize("NFKD", str(texto))
    sin_acentos = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sin_acentos).strip().lower()

def normalizar_titulo_asignatura(titulo: str) -> str:
    """Corrige typos, elimina prefijos, convierte ordinales a romanos."""
    if not titulo: return ""
    
    # 1. Limpieza inicial: Remover texto entre paréntesis y corchetes
    titulo = re.sub(r'\s*[\(\[].*?[\)\]]', '', str(titulo))
    titulo = ' '.join(titulo.split())
    
    # 2. Corregir typos (insensible a mayúsculas usando replace)
    for typo, correcto in TYPO_MAP.items():
        # Usar re.IGNORECASE para typps
        titulo = re.sub(re.escape(typo), correcto, titulo, flags=re.IGNORECASE)
    
    # "Programación 1" → "Programación I"
    titulo = re.sub(
        r"\b(\d+)\b",
        lambda m: ROMANO_MAP.get(m.group(), m.group()),
        titulo
    )
    
    # Caso: Electiva/Optativa en medio + romanos
    titulo = re.sub(r'(Electiva|Optativa)\s+(\d+)', 
                    lambda m: f"{m.group(1)} {ROMANO_MAP.get(m.group(2), m.group(2))}", 
                    titulo, flags=re.IGNORECASE)

    # Arreglo de guiones pegados a romanos
    titulo = re.sub(r'\b([IVX]+)-', r'\1 - ', titulo)
    
    return titulo.strip()

def es_duplicado_fuzzy(nombre_a: str, nombre_b: str, umbral: int = 92) -> bool:
    """Fuzzy matching estricto para detección de docentes duplicados."""
    if not nombre_a or not nombre_b: return False
    # token_sort_ratio ordena las palabras y evalúa la similitud
    return fuzz.token_sort_ratio(normalizar_texto(nombre_a), normalizar_texto(nombre_b)) >= umbral

DOMINIO_GENERADO = "noemail.pol.una.py"

def generar_correo_generico(nombre: str, apellido: str) -> str:
    """Genera nombre.apellido@noemail.pol.una.py para distinguirlos de correos reales."""
    if not nombre or not apellido: return ""
    
    p_nombre = normalizar_texto(nombre.split()[0] if nombre else "docente")
    p_apellido = normalizar_texto(apellido.split()[-1] if apellido else "")
    
    base = f"{p_nombre}.{p_apellido}".strip('.')
    # Remover caracteres especiales que no son válidos en emails
    base = re.sub(r'[^a-z0-9.]', '', base)
    
    return f"{base}@{DOMINIO_GENERADO}"

def normalizar_carrera(carrera_raw: str) -> list[str]:
    """Convierte cadena de carreras (posiblemente con formato 'c1, c2') a lista de siglas."""
    if not carrera_raw: return []
    
    partes = [p.strip() for p in re.split(r'[;,/]+', str(carrera_raw)) if p.strip()]
    resultados = []
    
    for parte in partes:
        clave = normalizar_texto(parte)
        if clave in CARRERA_MAP:
            resultados.append(CARRERA_MAP[clave])
        elif parte.upper() in CARRERA_MAP.values(): # Ya es sigla válida
            resultados.append(parte.upper())
        else:
            # Fallback a 3 o 4 letras principales
            sigla_intentada = parte.upper()[:4].strip()
            if sigla_intentada in CARRERA_MAP.values():
                resultados.append(sigla_intentada)
            else:
                resultados.append(parte.upper()[:3]) # as default
                
    return list(set(resultados))

def extraer_docentes_de_celda(celda: str) -> list[str]:
    """Soporta múltiples docentes separados por newline en una misma celda."""
    if not celda or str(celda).strip() in ("nan", "", "None"):
        return []
    return [d.strip() for d in str(celda).split("\n") if d.strip()]

def es_correo_institucional(correo: str) -> bool:
    """Correo real de la institución. Excluye correos generados."""
    if not correo: return False
    correo_lower = correo.lower()
    return correo_lower.endswith("@pol.una.py") and not correo_lower.endswith(f"@{DOMINIO_GENERADO}")

def es_correo_generado(correo: str) -> bool:
    """True si el correo fue generado automáticamente por el sistema."""
    if not correo: return False
    return correo.lower().endswith(f"@{DOMINIO_GENERADO}")

def es_correo_estudiante(correo: str) -> bool:
    if not correo: return False
    return "@fpuna.edu.py" in correo.lower()
