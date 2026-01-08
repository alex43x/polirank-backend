import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Subject = sequelize.define(
  "Subject",
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
    deptoFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "deptoFK",
    },
  },
  {
    tableName: "Asignaturas",
    timestamps: false,
  }
);

export default Subject;
