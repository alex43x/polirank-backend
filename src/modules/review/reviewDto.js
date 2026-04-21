const toCourseDto = (curso) => {
  if (!curso) return null;
  return {
    id: curso.id,
    year: curso.year,
    periodo: curso.periodo,
    seccion: curso.Seccion
      ? {
          id: curso.Seccion.id,
          docente: curso.Seccion.Docente
            ? { id: curso.Seccion.Docente.id, nombre: curso.Seccion.Docente.nombre }
            : null,
          materia: curso.Seccion.Materia
            ? { id: curso.Seccion.Materia.id, nombre: curso.Seccion.Materia.nombre }
            : null,
        }
      : null,
  };
};

const toDetailsDto = (conts = []) =>
  conts.map((rc) => ({
    aspecto: rc.Aspecto ? { id: rc.Aspecto.id, nombre: rc.Aspecto.nombre } : null,
    valor: rc.valor,
  }));

export const toStudentReviewDto = (r) => ({
  id: r.id,
  fecha: r.fecha,
  curso: toCourseDto(r.Curso),
  detalles: toDetailsDto(r.contenidos),
});

export const toAdminReviewDto = (r) => ({
  ...toStudentReviewDto(r),
  alumno: r.Alumno
    ? { id: r.Alumno.id, nombre: r.Alumno.nombre, correo: r.Alumno.correo }
    : null,
});
