import sequelize from "../db/connection.js";
import ReviewCab from "../models/reviewCab.js";
import ReviewCont from "../models/reviewCont.js";
import Aspecto from "../models/aspectModel.js";
import Stats from "../models/statsModel.js";

const recalculateCourseStats = async (reviewCab) => {
    const reviewExists = await ReviewCab.findOne({ where: { id: reviewCab } });
    if (!reviewExists) {
        throw new Error("ReviewCab no existe");
    }

    const aspectos = await Aspecto.findAll();

    for (const aspecto of aspectos) {
        // Calcular promedio y cantidad para cada aspecto
        const result = await ReviewCont.findOne({
        attributes: [
            [sequelize.fn("AVG", sequelize.col("valor")), "promedio"],
            [sequelize.fn("COUNT", sequelize.col("ReviewCont.id")), "cantidad"],
        ],
        include: [
            {
            model: ReviewCab,
            attributes: [],
            where: { curso: reviewExists.curso },
            required: true,
            },
        ],
        where: {
            aspecto: aspecto.id,
        },
        raw: true,
        });

        const promedio = parseFloat(result.promedio || 0).toFixed(2);
        const cantidad = parseInt(result.cantidad || 0, 10);

        // Upsert en review_stats
        await Stats.upsert({
        curso: reviewExists.curso,
        aspecto: aspecto.id,
        promedio,
        cantidad,
        updated_at: new Date(),
        });
        }
};

export { recalculateCourseStats };
