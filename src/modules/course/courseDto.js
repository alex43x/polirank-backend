export const toCourseDto = (c) => ({
  id: c.id,
  year: c.year,
  periodo: c.periodo,
  seccion: c.Seccion
    ? {
        id: c.Seccion.id,
        docente: c.Seccion.Docente ?? null,
        materia: c.Seccion.Materia ?? null,
      }
    : null,
});
