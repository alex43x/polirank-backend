import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.addColumn('comentarios', 'is_banned', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await queryInterface.addColumn('comentarios', 'banned_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('comentarios', 'is_banned');
  await queryInterface.removeColumn('comentarios', 'banned_at');
}
