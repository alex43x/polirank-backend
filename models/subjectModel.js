import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Materia = sequelize.define(
  "Materia",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    depto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "depto",
    },
  },
  {
    tableName: "asignaturas",
    timestamps: false,
  }
);

export default Materia;
