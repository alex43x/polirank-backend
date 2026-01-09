import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Carrera = sequelize.define(
    "Carrera",
    {
        nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        },
        semestres: {
        type: DataTypes.INTEGER,
        allowNull: false,
        },
    },
    {
        tableName: "carreras",
        timestamps: false
    }
    );

export default Carrera;
