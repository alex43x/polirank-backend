import bcrypt

def generar_hash_password(password_plana: str) -> str:
    """Hashea una contraseña usando bcrypt."""
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(password_plana.encode('utf-8'), salt).decode('utf-8')

def extraer_primer_nombre_apellido(full_name: str) -> str:
    """Extrae el primer nombre y el primer apellido de una cadena. Soporta 'Apellidos, Nombres'."""
    if not full_name:
        return ""
    
    full_name = " ".join(str(full_name).split()).title()
    
    if "," in full_name:
        partes = full_name.split(",", 1)
        apellidos = partes[0].strip().split()
        nombres = partes[1].strip().split()
        p_nombre = nombres[0] if nombres else ""
        p_apellido = apellidos[0] if apellidos else ""
        return f"{p_nombre} {p_apellido}".strip()
    
    partes = full_name.split()
    if len(partes) < 2:
        return full_name
        
    if len(partes) == 4:
        return f"{partes[0]} {partes[2]}"
    
    return f"{partes[0]} {partes[1]}"
