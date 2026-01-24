import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Intento = sequelize.define(
    "Intento",
    {
        alumno: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'alumnos',
                key: 'id'
            }
        },
        asignatura: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'asignaturas',
                key: 'id'
            }
        },
        valor: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

    },
    {
        tableName: "intentos",
        timestamps: false
    }
);



export default Intento;
