from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Docente:
    nombre: str
    apellido: str
    id: Optional[int] = None
    correo: Optional[str] = None
    correo_institucional: Optional[str] = None
    nombre_normalizado: str = field(init=False)

    def __post_init__(self):
        self.nombre_normalizado = f"{self.nombre} {self.apellido}".lower().strip()

    @property
    def correo_efectivo(self) -> str:
        """Prioriza institucional sobre genérico."""
        if self.correo_institucional:
            return self.correo_institucional
        return self.correo if self.correo else ""

@dataclass
class Asignatura:
    titulo: str
    id: Optional[int] = None
    codigo: Optional[str] = None
    departamento: Optional[str] = None
    titulo_normalizado: str = field(init=False)
    depto_id: Optional[int] = None # Nuevo campo para el ID del depto

    def __post_init__(self):
        self.titulo_normalizado = self.titulo.strip().lower()

@dataclass
class Seccion:
    docente_id: int
    asignatura_id: int

@dataclass
class Curso:
    seccion_id: int
    anio: int
    periodo: int

@dataclass
class Usuario:
    nombre: str
    correo: str                     # Solo @fpuna.edu.py
    password_hash: str
    carrera_sigla: str              # Ej: "IIN", "ICI"
    ci: Optional[str] = None

@dataclass
class Malla:
    asignatura_id: int
    carrera_id: int
    semestre: int

@dataclass
class ValidationReport:
    entidad: str
    errores: list[str] = field(default_factory=list)
    advertencias: list[str] = field(default_factory=list)

    @property
    def es_valido(self) -> bool:
        return len(self.errores) == 0
