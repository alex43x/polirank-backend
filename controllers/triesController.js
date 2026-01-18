import Materia from "../models/subjectModel.js";
import Intento from "../models/triesModel.js";
import Alumno from "../models/studentModel.js";
import { Op } from "sequelize";

const getAllTries = async (req, res) => {
    const usuario = req.user;
    try {

    const tries = await Intento.findAndCountAll({
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

    if (!tries) {
        return res.status(404).json({ error: "No se encontraron intentos" });
    }

    if (usuario.role.nombre !== 'ADMIN') {
      return res.status(403).json({ error: "No tienes permisos para los intentos" });
    }

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
    const usuario = req.user;

    try {
        const tryInstance = await Intento.findByPk(id);
    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    if (tryInstance.alumno !== usuario.id) {
      return res.status(403).json({ error: "No tienes permisos para ver este intento" });
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
        const newTry = await Intento.create({
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
  const usuario = req.user;
  const { asignatura, valor } = req.body;

  try {
    const tryInstance = await Intento.findByPk(id);

    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    if (tryInstance.alumno !== usuario.id) {
      return res.status(403).json({ error: "No tienes permisos para actualizar este intento" });
    }

    await tryInstance.update({
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
  const usuario = req.user;
  
  try {
    const tryInstance = await Intento.findByPk(id);

    if (!tryInstance) {
      return res.status(404).json({ error: "Intento no encontrado" });
    }

    if (tryInstance.alumno !== usuario.id) {
      return res.status(403).json({ error: "No tienes permisos para eliminar este intento" });
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
