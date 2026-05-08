export const toSubjectDto = (s) => ({
  id: s.id,
  nombre: s.nombre,
  departamentoId: s.depto,
  departamento: s.Departamento ?? null,
});
