import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Seccion = sequelize.define(
  "Seccion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    docente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "docente",
    },
    asignatura: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "asignatura",
    },
  },
  {
    tableName: "secciones",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["docente", "asignatura"],
      },
    ],
  }
);

export default Seccion;
