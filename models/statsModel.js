import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Estadistica = sequelize.define(
    "Estadistica",
    {
        id:{
            type:DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        curso:{
            type:DataTypes.INTEGER,
            allowNull: false,
            field: "curso"
        },
        aspecto:{
            type:DataTypes.INTEGER,
            allowNull: false,
            field: "aspecto"
        },
        promedio:{
            type:DataTypes.INTEGER,
            allowNull: false,
            field: "promedio"
        },
        cantidad:{
            type:DataTypes.INTEGER,
            allowNull: false,
            field: "cantidad"
        },
        fecha:{
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "estadisticas",
        timestamps: false,
    }
);

export default Estadistica;