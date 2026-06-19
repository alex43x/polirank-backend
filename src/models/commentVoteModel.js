import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const VotoComentario = sequelize.define(
  'VotoComentario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    comentario: { type: DataTypes.INTEGER, allowNull: false },
    alumno: { type: DataTypes.INTEGER, allowNull: false },
    valor: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'votos_comentarios',
    timestamps: false,
  }
);

export default VotoComentario;
