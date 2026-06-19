import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('comentarios', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    revcab: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // FK → reviewcab
  await queryInterface.addConstraint('comentarios', {
    fields: ['revcab'],
    type: 'foreign key',
    name: 'fk_comentarios_revcab',
    references: { table: 'reviewcab', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Un solo comentario por review
  await queryInterface.addConstraint('comentarios', {
    fields: ['revcab'],
    type: 'unique',
    name: 'uq_comentarios_revcab',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('comentarios');
}
