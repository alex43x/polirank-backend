import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

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
      unique: true,
    },
  },
  {
    tableName: "docentes",
    timestamps: false,
  }
);

export default Docente;
