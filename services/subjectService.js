import Intento from "../models/triesModel.js";

const calculateSubjectTriesStats = async (subjectId) => {
    const intentos = await Intento.findAll({
        where: { asignatura: subjectId },
    });

    const emptyStats = {
        "1_intento": 0,
        "2_intentos": 0,
        "3_intentos": 0,
        "mas_intentos": 0,
    };

    if (intentos.length === 0) {
        return emptyStats;
    }

    // Agrupar por estudiante tomando el máximo valor de intentos
    const studentTriesMap = {};

    for (const intento of intentos) {
        if (!studentTriesMap[intento.alumno]) {
            studentTriesMap[intento.alumno] = intento.valor;
        } else {
            studentTriesMap[intento.alumno] = Math.max(studentTriesMap[intento.alumno], intento.valor);
        }
    }

    // Agrupar por número de intentos
    const triesStats = { ...emptyStats };

    Object.values(studentTriesMap).forEach((valor) => {
        if (valor === 1) {
            triesStats["1_intento"]++;
        } else if (valor === 2) {
            triesStats["2_intentos"]++;
        } else if (valor === 3) {
            triesStats["3_intentos"]++;
        } else {
            triesStats["mas_intentos"]++;
        }
    });

    return triesStats;
};

export {
    calculateSubjectTriesStats,
};