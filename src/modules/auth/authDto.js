export const toUserDto = (student) => ({
  id: student.id,
  nombre: student.nombre,
  correo: student.correo,
  rol: student.Rol ? { id: student.Rol.id, nombre: student.Rol.nombre } : null,
  matriculaciones: (student.matriculaciones ?? []).map((m) => ({
    id: m.id,
    carrera: m.Carrera ? { id: m.Carrera.id, nombre: m.Carrera.nombre } : null,
  })),
});
