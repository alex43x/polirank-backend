import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Curso = sequelize.define(
  "Curso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seccion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "seccion",
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "year",
    },
    periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "cursos",
    timestamps: false,
  }
);

export default Curso;
