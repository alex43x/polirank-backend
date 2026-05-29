import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comentario = sequelize.define(
  'Comentario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    revcab: { type: DataTypes.INTEGER, allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    is_banned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    banned_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'comentarios',
    timestamps: false,
  }
);

export default Comentario;
