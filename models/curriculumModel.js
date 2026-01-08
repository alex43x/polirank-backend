// para la malla sol
import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Curriculum = sequelize.define(
  "Curriculum",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    carreraFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "carreraFK",
    },
    asignaturaFK: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "asignaturaFK",
    },
    semestre: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Malla",
    timestamps: false,
  }
);

export default Curriculum;
