import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Rol = sequelize.define(
    "Rol",
    {
        nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        },
    },
    {
        tableName: "roles",
        timestamps: false
    }

    );

export default Rol;
