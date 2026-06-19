import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('reportes_comentarios', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    comentario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason_detail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // FK → comentarios
  await queryInterface.addConstraint('reportes_comentarios', {
    fields: ['comentario_id'],
    type: 'foreign key',
    name: 'fk_reportes_comentario',
    references: { table: 'comentarios', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // FK → alumnos (reporter)
  await queryInterface.addConstraint('reportes_comentarios', {
    fields: ['reporter_id'],
    type: 'foreign key',
    name: 'fk_reportes_reporter',
    references: { table: 'alumnos', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // FK → alumnos (reviewer admin)
  await queryInterface.addConstraint('reportes_comentarios', {
    fields: ['reviewed_by'],
    type: 'foreign key',
    name: 'fk_reportes_reviewed_by',
    references: { table: 'alumnos', field: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  // Un reporte por usuario por comentario
  await queryInterface.addConstraint('reportes_comentarios', {
    fields: ['comentario_id', 'reporter_id'],
    type: 'unique',
    name: 'uq_reporte_comentario_reporter',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('reportes_comentarios');
}
