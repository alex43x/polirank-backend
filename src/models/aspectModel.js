import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Aspecto = sequelize.define(
    "Aspecto",
    {
        nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        },
    },
    {
        tableName: "aspectos",
        timestamps: false
    }

    );

export default Aspecto;
