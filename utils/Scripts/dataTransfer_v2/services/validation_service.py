from dataclasses import dataclass
from adapters.excel.excel_parser import ExcelParser
from services.docente_service import DocenteService
from services.asignatura_service import AsignaturaService
from core.models import ValidationReport

@dataclass
class FullValidationResult:
    docentes: ValidationReport
    asignaturas: ValidationReport

    @property
    def es_valido(self) -> bool:
        return all([
            self.docentes.es_valido,
            self.asignaturas.es_valido,
        ])

    def imprimir_resumen(self):
        print("\n========================================")
        print("          REPORTE DE DRY-RUN")
        print("========================================")
        for rep in [self.docentes, self.asignaturas]:
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

class ValidationService:
    def __init__(
        self, 
        parser: ExcelParser, 
        docente_svc: DocenteService, 
        asignatura_svc: AsignaturaService
    ):
        self._parser = parser
        self._docente_svc = docente_svc
        self._asignatura_svc = asignatura_svc

    def ejecutar(self) -> FullValidationResult:
        """
        Ejecuta la validación de docentes y asignaturas de la hoja seleccionada.
        """
        df_docentes = self._parser.get_docentes()
        df_asignaturas = self._parser.get_asignaturas()

        return FullValidationResult(
            docentes=self._docente_svc.validar(df_docentes),
            asignaturas=self._asignatura_svc.validar(df_asignaturas),
        )
