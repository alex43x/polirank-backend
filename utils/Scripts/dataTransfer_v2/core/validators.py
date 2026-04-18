from typing import Any, Callable

def validar_requerido(valor: Any, nombre_campo: str) -> list[str]:
    if valor is None or str(valor).strip() == "" or str(valor).lower() == "nan":
        return [f"El campo '{nombre_campo}' es requerido."]
    return []

def validar_correo(correo: str, nombre_campo: str = "correo") -> list[str]:
    if not correo or str(correo).strip() == "" or str(correo).lower() == "nan":
        return [] # Se permite vacío, se generará genérico o no aplica
    if "@" not in str(correo):
        return [f"El campo '{nombre_campo}' debe ser un correo válido. Valor actual: '{correo}'."]
    return []

def ejecutar_validadores(*validadores: Callable[[], list[str]]) -> list[str]:
    errores = []
    for validador in validadores:
        errores.extend(validador())
    return errores
