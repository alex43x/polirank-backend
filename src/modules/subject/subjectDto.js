export const toSubjectDto = (s) => ({
  id: s.id,
  nombre: s.nombre,
  depto: s.depto,
  Departamento: s.Departamento ?? null,
});
