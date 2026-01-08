import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Teacher = sequelize.define(
  "Teacher",
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
    tableName: "Docentes",
    timestamps: false,
  }
);

export default Teacher;
