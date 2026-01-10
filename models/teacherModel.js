import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Docente = sequelize.define(
  "Docente",
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
    correo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "docentes",
    timestamps: false,
  }
);

export default Docente;
