import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('comentarios', 'status', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en_revision',
  });
  await queryInterface.addColumn('comentarios', 'banned_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('comentarios', 'status');
  await queryInterface.removeColumn('comentarios', 'banned_at');
}
