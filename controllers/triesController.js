import Materia from "../models/subjectModel.js";
import Intentos from "../models/triesModel.js";
import Alumno from "../models/studentModel.js";
import { Op } from "sequelize";

const getAllTries = async (req, res) => {
    try {

    const tries = await Intentos.findAndCountAll({
        order: [["id", "ASC"]],
        include: [
        {
            model: Materia,
        },
        {
          model: Alumno,
        }
        ],
    });

    return res.json({
        total: tries.count,
        tries: tries.rows
    });
    } catch (error) {
    console.error("Error al obtener los intentos:", error);
    res.status(500).send("Error al obtener los intentos");
    }
};

const getTrybyId = async (req, res) => {
    const { id } = req.params;

    try {
        const tryInstance = await Tries.findByPk(id);
    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    return res.status(200).json(tryInstance);
  } catch (error) {
    console.error("Error al obtener el intento:", error);
    res.status(500).send("Error al obtener el intento");
  }
};

const createTry = async (req, res) => {
    const alumno = req.user.id;
    const { asignatura, valor } = req.body;

    if (!alumno || !asignatura || !valor) {
      console.log(alumno, asignatura, valor);
    return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const subjectExists = await Materia.findByPk(asignatura);
    if (!subjectExists) {
        return res.status(404).json({ error: "La asignatura no existe" });
    }

    try {
        const newTry = await Intentos.create({
        alumno,
        asignatura,
        valor,
        });

    res.status(201).json(newTry);
    } catch (error) {
    console.error("Error al crear el intento:", error);
    res.status(500).send("Error al crear el intento");
  }
};

const updateTry = async (req, res) => {
  const { id } = req.params;
  const alumno = req.user;
  const { asignatura, valor } = req.body;

  try {
    const tryInstance = await Intentos.findByPk(id);

    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    await tryInstance.update({
      alumno,
      asignatura,
      valor,
    });

    res.status(200).json(tryInstance);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar el intento");
  }
};

const deleteTry = async (req, res) => {
  const { id } = req.params;
  try {
    const tryInstance = await Intentos.findByPk(id);

    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    await tryInstance.destroy();

    res.status(200).json("Intento eliminado");
  } catch (error) {
    console.error("Error al eliminar el intento:", error);
    res.status(500).send("Error al eliminar el intento");
  }
};

export default {
  getAllTries,
  getTrybyId,
  createTry,
  updateTry,
  deleteTry,
};
