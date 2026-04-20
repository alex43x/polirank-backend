import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Departamento = sequelize.define(
    "Departamento", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    siglas: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    }, {
    tableName: 'departamentos', 
    timestamps: false,          
    });

export default  Departamento;
