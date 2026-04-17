import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { recalculateCourseStats } from "../services/statsService.js";

const ReviewCont = sequelize.define("ReviewCont", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  revcab: { type: DataTypes.INTEGER, allowNull: false },
  aspecto: { type: DataTypes.INTEGER, allowNull: false },
  valor: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "reviewcont",
  timestamps: false,
  hooks: {
      afterCreate: async (reviewCont, options) => {
        await recalculateCourseStats(reviewCont.revcab);
      },

      afterBulkUpdate: async (options) => {
        if (options.where && options.where.revcab) {
          await recalculateCourseStats(options.where.revcab);
        }
      },

      afterBulkDestroy: async (options) => {
        if (options.where && options.where.revcab) {
          await recalculateCourseStats(options.where.revcab);
        }
      },
    },
});

export default ReviewCont;
