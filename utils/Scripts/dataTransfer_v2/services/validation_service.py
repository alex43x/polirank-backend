from dataclasses import dataclass
from adapters.excel.excel_parser import ExcelParser
from services.docente_service import DocenteService
from services.asignatura_service import AsignaturaService
from services.usuario_service import UsuarioService
from core.models import ValidationReport

@dataclass
class FullValidationResult:
    docentes: ValidationReport
    asignaturas: ValidationReport
    usuarios: ValidationReport

    @property
    def es_valido(self) -> bool:
        return all([
            self.docentes.es_valido,
            self.asignaturas.es_valido,
            self.usuarios.es_valido,
        ])

    def imprimir_resumen(self):
        print("\n========================================")
        print("          REPORTE DE DRY-RUN")
        print("========================================")
        for rep in [self.docentes, self.asignaturas, self.usuarios]:
            print(f"\nEntidad: {rep.entidad}")
            print(f"  Errores Críticos: {len(rep.errores)}")
            print(f"  Advertencias:     {len(rep.advertencias)}")
            
            for e in rep.errores[:10]:
                print(f"  ❌ {e}")
            if len(rep.errores) > 10:
                print(f"  ...y {len(rep.errores)-10} errores más.")
                
            for a in rep.advertencias[:5]:
                print(f"  ⚠️  {a}")
            if len(rep.advertencias) > 5:
                print(f"  ...y {len(rep.advertencias)-5} advertencias más.")
