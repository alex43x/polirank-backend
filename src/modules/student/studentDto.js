export const toStudentDto = (s) => ({
  id: s.id,
  nombre: s.nombre,
  correo: s.correo,
  rol: s.Rol ? { id: s.Rol.id, nombre: s.Rol.nombre } : null,
  matriculaciones: (s.matriculaciones ?? []).map((m) => ({
    id: m.id,
    carrera: m.Carrera ? { id: m.Carrera.id, nombre: m.Carrera.nombre } : null,
  })),
});
