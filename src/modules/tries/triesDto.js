export const toTryDto = (t) => ({
  id: t.id,
  asignatura: t.Materia
    ? { id: t.Materia.id, nombre: t.Materia.nombre }
    : { id: t.asignatura },
  valor: t.valor,
});
