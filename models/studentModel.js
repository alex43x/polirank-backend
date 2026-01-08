import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    correo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    carreraFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "carreraFK",
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Alumnos",
    timestamps: false,
  }
);

export default Student;
