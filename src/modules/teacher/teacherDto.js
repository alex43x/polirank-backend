export const toTeacherDto = (d) => ({
  id: d.id,
  nombre: d.nombre,
  correo: d.correo,
});

export const toSectionStatsDto = ({ section, promedioGeneral, totalReviews }) => ({
  id: section.id,
  materia: {
    id: section.Materia.id,
    nombre: section.Materia.nombre,
  },
  promedioGeneral,
  totalReviews,
});
