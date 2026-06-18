from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from core.models import Docente, Asignatura, Seccion, Curso, Usuario, Malla


class IDocenteRepository(ABC):
    @abstractmethod
    def buscar_por_nombre_normalizado(self, nombre: str) -> Optional[Docente]: ...
    @abstractmethod
    def buscar_por_correo(self, correo: str) -> Optional[Docente]: ...
    @abstractmethod
    def insertar_bulk(self, docentes: List[Docente]) -> int: ...


class IAsignaturaRepository(ABC):
    @abstractmethod
    def buscar_por_titulo_normalizado(self, titulo: str) -> Optional[tuple[int, Asignatura]]: ...
    @abstractmethod
    def insertar_bulk(self, asignaturas: List[Asignatura]) -> int: ...


class ISeccionRepository(ABC):
    @abstractmethod
    def buscar(self, docente_id: int, asignatura_id: int) -> Optional[int]: ...
    @abstractmethod
    def insertar_bulk_and_return_ids(self, secciones: List[Seccion]) -> dict[tuple[int, int], int]: ...


class ICursoRepository(ABC):
    @abstractmethod
    def buscar(self, seccion_id: int, anio: int, periodo: int) -> Optional[int]: ...
    @abstractmethod
    def insertar_bulk(self, cursos: List[Curso]) -> int: ...


class IUsuarioRepository(ABC):
    @abstractmethod
    def obtener_existentes_por_correo(self, correos: List[str]) -> dict[str, int]: ...
    @abstractmethod
    def mapear_carreras(self) -> dict[str, int]: ...
    @abstractmethod
    def insertar_bulk(
        self,
        usuarios: List[Usuario],
        user_carreras: List[Tuple[str, int]]
    ) -> Tuple[int, int]:
        # BUG-07 fix: firma alineada con UsuarioRepository.insertar_bulk.
        # Antes declaraba (self, usuarios) -> int, cuando la implementación real
        # requiere user_carreras y devuelve Tuple[int,int]. LSP violado.
        ...


class IMallaRepository(ABC):
    @abstractmethod
    def mapear_carreras(self) -> dict[str, int]: ...
    @abstractmethod
    def mapear_asignaturas(self) -> dict[str, int]: ...
    @abstractmethod
    def insertar_bulk(self, mallas: List[Malla]) -> int: ...
