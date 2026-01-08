import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Section = sequelize.define(
  "Section",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    docenteFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "docenteFK",
    },
    asignaturaFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "asignaturaFK",
    },
  },
  {
    tableName: "Secciones",
    timestamps: false,
  }
);

export default Section;
