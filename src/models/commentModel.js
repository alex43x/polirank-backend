import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comentario = sequelize.define(
  'Comentario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    revcab: { type: DataTypes.INTEGER, allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'comentarios',
    timestamps: false,
  }
);

export default Comentario;
