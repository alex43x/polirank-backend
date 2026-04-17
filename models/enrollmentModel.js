import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Matriculacion = sequelize.define(
    "Matriculacion",
    {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        },
        alumno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        },
        carrera: {
        type: DataTypes.INTEGER,
        allowNull: false,
        },
    },
    {
        tableName: "matriculaciones",
        timestamps: false,
    }
);

export default Matriculacion;
