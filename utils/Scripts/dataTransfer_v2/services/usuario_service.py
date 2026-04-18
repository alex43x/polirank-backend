import pandas as pd
from core.models import Usuario, ValidationReport
from core.interfaces import IUsuarioRepository
from core.normalizers import normalizar_carrera
from core.utils import generar_hash_password, extraer_primer_nombre_apellido

class UsuarioService:
    def __init__(self, repo: IUsuarioRepository):
        self._repo = repo

    def validar(self, df: pd.DataFrame) -> ValidationReport:
        report = ValidationReport(entidad="Usuarios")
        mapa_carreras = self._repo.mapear_carreras()
        
        for idx, row in df.iterrows():
            carreras_raw = str(row.get("carreras", ""))
            carreras_norm = normalizar_carrera(carreras_raw)
            
            for c in carreras_norm:
                if c not in mapa_carreras:
                    report.errores.append(f"Fila {idx+2}: Carrera no válida en BD '{c}' (original: {carreras_raw})")
                    
        return report

    def filtrar_y_exportar(self, df: pd.DataFrame) -> str:
        """
        Iguala la funcionalidad de Opción [6] del script original:
        Filtra por dominio institucional y normaliza carreras antes de exportar.
        """
        from core.normalizers import es_correo_estudiante
        
        def normalizar_fila(row):
            correo = str(row.get("correo")).strip().lower()
            if not es_correo_estudiante(correo):
                return None
            
            carreras_raw = str(row.get("carreras", ""))
            carreras_norm = normalizar_carrera(carreras_raw)
            if not carreras_norm:
                return None
            
            nombre_raw = str(row.get("nombre", "")).strip()
            nombre = extraer_primer_nombre_apellido(nombre_raw)
            
            return {
                "Nombre": nombre,
                "Correo": correo,
                "CI": str(row.get("ci", "")).strip(),
                "Carreras": ",".join(carreras_norm)
            }

        resultados = []
        for _, row in df.iterrows():
            fila_norm = normalizar_fila(row)
            if fila_norm:
                resultados.append(fila_norm)
        
        if not resultados:
            return ""

        output_df = pd.DataFrame(resultados)
        output_path = "alumnos_normalizados.xlsx"
        output_df.to_excel(output_path, index=False)
        return output_path

    def importar(self, df: pd.DataFrame) -> dict:
        stats = {
            "procesados": 0,
            "omitidos_sin_carrera": 0
        }
        
        mapa_carreras = self._repo.mapear_carreras()
        usuarios: list[Usuario] = []
        user_carreras: list[tuple[str, int]] = []
        
        for _, row in df.iterrows():
            correo = str(row.get("correo")).strip().lower()
            if not correo or "@" not in correo: continue
            
            carreras_raw = str(row.get("carreras", ""))
            carreras_norm = normalizar_carrera(carreras_raw)
            
            carreras_validas_ids = [mapa_carreras[c] for c in carreras_norm if c in mapa_carreras]
            
            if not carreras_validas_ids:
                stats["omitidos_sin_carrera"] += 1
                continue
                
            stats["procesados"] += 1
            
            nombre_raw = str(row.get("nombre", "")).strip()
            nombre = extraer_primer_nombre_apellido(nombre_raw)
            ci = str(row.get("ci", "")).strip() if "ci" in row else None
            
            # Contraseña inicial = prefijo correo
            pwd_raw = correo.split("@")[0]
            pwd_hash = generar_hash_password(pwd_raw)
            
            usuarios.append(Usuario(
                nombre=nombre,
                correo=correo,
                password_hash=pwd_hash,
                carrera_sigla=carreras_norm[0] if carreras_norm else "UNK",
                ci=ci
            ))
            
            for c_id in carreras_validas_ids:
                user_carreras.append((correo, c_id))
                
        # Bulk Insert
        u_ins, m_ins = self._repo.insertar_bulk(usuarios, user_carreras)
        stats["alumnos_procesados_bd"] = u_ins
        stats["matriculaciones_insertadas"] = m_ins
        
        return stats
