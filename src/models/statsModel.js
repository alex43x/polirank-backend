import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

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
            type:DataTypes.FLOAT,
            allowNull: false,
            field: "promedio"
        },
        cantidad:{
            type:DataTypes.INTEGER,
            allowNull: false,
            field: "cantidad"
        },
        updated_at:{
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["curso", "aspecto"]
            }
        ],
        tableName: "estadisticas",
        timestamps: false,
    }
);

export default Estadistica;