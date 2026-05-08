import json
import pandas as pd
from pathlib import Path
from core.exceptions import ConfigError

class ExcelParser:
    """Carga un Excel y expone DataFrames con nombres de columna semánticos."""

    def __init__(self, archivo: Path, mapping_path: Path):
        try:
            with open(mapping_path, encoding='utf-8') as f:
                self.mapping = json.load(f)
        except Exception as e:
            raise ConfigError(f"Error cargando column_mapping.json: {e}")
            
        self.archivo = archivo
        self._workbook: dict[str, pd.DataFrame] = {}

    def _cargar_hoja(self, entidad: str) -> pd.DataFrame:
        if entidad not in self.mapping:
            raise ConfigError(f"Entidad '{entidad}' no configurada en column_mapping.json")

        cfg = self.mapping[entidad]
        hoja_nombre = cfg["hoja"]
        
        if hoja_nombre not in self._workbook:
            try:
                # pandas read_excel for the specific sheet
                df = pd.read_excel(
                    self.archivo,
                    sheet_name=hoja_nombre,
                    header=cfg.get("fila_inicio", 0),
                    dtype=str,  # Todo como string para evitar coerciones silenciosas
                )
                self._workbook[hoja_nombre] = df.fillna("")
            except Exception as e:
                raise ValueError(f"Error leyendo hoja '{hoja_nombre}' del Excel: {e}")

        df = self._workbook[hoja_nombre]
        
        # Validar que existan las columnas configuradas en el excel (por valor real de la cabecera)
        columnas_requeridas_excel = list(cfg["columnas"].values())
        columnas_faltantes = [c for c in columnas_requeridas_excel if c not in df.columns]
        
        if columnas_faltantes:
            raise ConfigError(f"No se encontraron las columnas {columnas_faltantes} en la hoja '{hoja_nombre}'")

        # Renombrar columnas del Excel a nombres internos
        rename = {v: k for k, v in cfg["columnas"].items()}
        return df.rename(columns=rename)[[*cfg["columnas"].keys()]]

    def get_docentes(self) -> pd.DataFrame:
        return self._cargar_hoja("docentes")

    def get_asignaturas(self) -> pd.DataFrame:
        return self._cargar_hoja("asignaturas")

    def get_usuarios(self) -> pd.DataFrame:
        df = self._cargar_hoja("usuarios")
        dominio = self.mapping.get("usuarios", {}).get("dominio_permitido", "@fpuna.edu.py")
        if not df.empty:
            # Filtro básico por dominio
            return df[df["correo"].str.endswith(dominio).fillna(False)]
        return df

    def get_secciones(self) -> pd.DataFrame:
        return self._cargar_hoja("secciones")

    def get_malla(self) -> pd.DataFrame:
        return self._cargar_hoja("malla")
