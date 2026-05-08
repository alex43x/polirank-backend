import json
import pandas as pd
from pathlib import Path
from core.exceptions import ConfigError


class ExcelParser:
    """Carga un Excel de horarios universitarios y expone DataFrames por entidad.
    
    El Excel tiene una hoja por carrera (IIN, IAE, etc.) con headers en fila 11.
    El usuario elige qué hoja procesar.
    """

    def __init__(self, archivo: Path, mapping_path: Path):
        try:
            with open(mapping_path, encoding='utf-8') as f:
                self.mapping = json.load(f)
        except Exception as e:
            raise ConfigError(f"Error cargando column_mapping.json: {e}")
            
        self.archivo = archivo
        self._cache: dict[str, pd.DataFrame] = {}
        self._hoja_seleccionada: str | None = None

    def listar_hojas_carreras(self) -> list[str]:
        """Retorna las hojas del Excel que no están en la lista de ignoradas."""
        xl = pd.ExcelFile(self.archivo)
        hojas_ignorar = set(self.mapping.get("hojas_ignorar", []))
        
        # Simplemente excluimos las que están marcadas para ignorar
        disponibles = [hoja for hoja in xl.sheet_names if hoja not in hojas_ignorar]
        
        return disponibles

    def seleccionar_hoja(self, nombre_hoja: str):
        """Establece la hoja activa para procesar."""
        self._hoja_seleccionada = nombre_hoja

    def _cargar_hoja(self, nombre_hoja: str) -> pd.DataFrame:
        """Carga una hoja específica con el header en la fila configurada."""
        if nombre_hoja in self._cache:
            return self._cache[nombre_hoja]

        fila_header = self.mapping.get("fila_header", 10)
        
        try:
            df = pd.read_excel(
                self.archivo,
                sheet_name=nombre_hoja,
                header=fila_header,
                dtype=str,
            )
            df = df.fillna("")
            # Agregar columna de origen para saber de qué carrera viene
            df["_hoja_origen"] = nombre_hoja
            self._cache[nombre_hoja] = df
        except Exception as e:
            raise ValueError(f"Error leyendo hoja '{nombre_hoja}' del Excel: {e}")

        return self._cache[nombre_hoja]

    def _get_hoja_activa(self) -> pd.DataFrame:
        """Retorna el DataFrame de la hoja seleccionada."""
        if not self._hoja_seleccionada:
            raise ConfigError("No se ha seleccionado ninguna hoja. Usa seleccionar_hoja() primero.")
        return self._cargar_hoja(self._hoja_seleccionada)

    def _renombrar_columnas(self, df: pd.DataFrame, columnas_necesarias: list[str]) -> pd.DataFrame:
        """Renombra columnas del Excel a nombres internos según el mapping."""
        col_map = self.mapping.get("columnas", {})
        
        # Crear mapeo inverso: nombre_excel -> nombre_interno
        rename = {}
        for nombre_interno, nombre_excel in col_map.items():
            if nombre_interno in columnas_necesarias and nombre_excel in df.columns:
                rename[nombre_excel] = nombre_interno
        
        # Verificar columnas faltantes
        faltantes = []
        for col_interna in columnas_necesarias:
            col_excel = col_map.get(col_interna, "")
            if col_excel and col_excel not in df.columns:
                faltantes.append(f"{col_interna} ('{col_excel}')")
        
        if faltantes:
            print(f"  ⚠️  Columnas no encontradas: {', '.join(faltantes)}")
            print(f"  📋 Columnas disponibles: {list(df.columns[:15])}...")
        
        df_renamed = df.rename(columns=rename)
        
        # Retornar solo las columnas que pudimos renombrar + _hoja_origen
        cols_disponibles = [c for c in columnas_necesarias if c in df_renamed.columns]
        if "_hoja_origen" in df_renamed.columns:
            cols_disponibles.append("_hoja_origen")
        
        return df_renamed[cols_disponibles]

    def get_docentes(self) -> pd.DataFrame:
        """Extrae Apellido, Nombre y Correo Institucional de la hoja activa."""
        df = self._get_hoja_activa()
        columnas = ["apellido_docente", "nombre_docente", "correo_docente"]
        return self._renombrar_columnas(df, columnas)

    def get_asignaturas(self) -> pd.DataFrame:
        """Extrae DPTO. y Asignatura de la hoja activa."""
        df = self._get_hoja_activa()
        columnas = ["departamento", "asignatura"]
        return self._renombrar_columnas(df, columnas)

    def get_secciones(self) -> pd.DataFrame:
        """Extrae Asignatura, Apellido, Nombre y Correo del docente de la hoja activa."""
        df = self._get_hoja_activa()
        columnas = ["asignatura", "departamento", "apellido_docente", "nombre_docente", "correo_docente"]
        return self._renombrar_columnas(df, columnas)

    def get_malla(self) -> pd.DataFrame:
        """Extrae Asignatura, Sigla carrera y Semestre usando la estructura v1.
        
        En v1: Fila inicio 1 (index 0), Columnas [0, 1, 2].
        """
        if not self._hoja_seleccionada:
            raise ConfigError("No se ha seleccionado ninguna hoja. Usa seleccionar_hoja() primero.")
            
        try:
            # Para Malla, cargamos sin usar el header global de la fila 11
            df = pd.read_excel(
                self.archivo,
                sheet_name=self._hoja_seleccionada,
                header=0, # Fila 1 es el header
                dtype=str,
            )
            df = df.fillna("")
            
            # Mapeamos por índice de columna como en v1
            # 0 = materias, 1 = carreras, 2 = semestre
            malla_df = pd.DataFrame()
            malla_df["asignatura"] = df.iloc[:, 0]
            malla_df["sigla_carrera"] = df.iloc[:, 1]
            malla_df["semestre"] = df.iloc[:, 2]
            
            return malla_df
            
        except Exception as e:
            raise ValueError(f"Error leyendo malla (v1) de '{self._hoja_seleccionada}': {e}")
