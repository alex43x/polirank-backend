import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seccionFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "seccionFK",
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "año",
    },
    periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Cursos",
    timestamps: false,
  }
);

export default Course;
