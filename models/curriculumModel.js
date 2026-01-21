// para la malla sol
import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Malla = sequelize.define(
  "Malla",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    carrera: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "carrera",
    },
    asignatura: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "asignatura",
    },
    semestre: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "malla",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["carrera", "asignatura", "semestre"],
      },
    ],
  }
);

export default Malla;
