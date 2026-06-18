import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ReporteComentario = sequelize.define(
  'ReporteComentario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    comentario_id: { type: DataTypes.INTEGER, allowNull: false },
    reporter_id: { type: DataTypes.INTEGER, allowNull: false },
    reason_type: { type: DataTypes.STRING, allowNull: false },
    reason_detail: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'reportes_comentarios',
    timestamps: false,
  }
);

export default ReporteComentario;
