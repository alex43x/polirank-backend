import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ReviewCab = sequelize.define(
  "ReviewCab",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    curso: { type: DataTypes.INTEGER, allowNull: false },
    alumno: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "reviewcab",
    timestamps: false,
  }
);

export default ReviewCab;
