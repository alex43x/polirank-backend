import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('votos_comentarios', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    comentario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    alumno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // FK → comentarios
  await queryInterface.addConstraint('votos_comentarios', {
    fields: ['comentario'],
    type: 'foreign key',
    name: 'fk_votos_comentario',
    references: { table: 'comentarios', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // FK → alumnos
  await queryInterface.addConstraint('votos_comentarios', {
    fields: ['alumno'],
    type: 'foreign key',
    name: 'fk_votos_alumno',
    references: { table: 'alumnos', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Un voto por alumno por comentario
  await queryInterface.addConstraint('votos_comentarios', {
    fields: ['comentario', 'alumno'],
    type: 'unique',
    name: 'uq_votos_comentario_alumno',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('votos_comentarios');
}
