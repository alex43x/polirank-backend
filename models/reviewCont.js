import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const ReviewCont = sequelize.define("ReviewCont", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  revcab: { type: DataTypes.INTEGER, allowNull: false },
  aspecto: { type: DataTypes.INTEGER, allowNull: false },
  valor: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "reviewcont",
  timestamps: false,
});

export default ReviewCont;
