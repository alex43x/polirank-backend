import Aspecto from "../models/aspectModel.js";
import ReviewCab from "../models/reviewCab.js";
import ReviewCont from "../models/reviewCont.js";
import Rol from "../models/roleModel.js";
import Alumno from "../models/studentModel.js";
import Carrera from "../models/careerModel.js";
import { Op } from "sequelize";

const getAllStudents = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Parámetros de búsqueda y filtrado
    const search = req.query.search || "";
    const carrera_id = req.query.carrera_id;
    const rol_id = req.query.rol_id;

    // Construir condiciones de búsqueda
    const whereConditions = {};

    // Búsqueda por nombre o correo
    if (search) {
      whereConditions[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { correo: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por carrera
    if (carrera_id) {
      whereConditions.carrera_id = carrera_id;
    }

    // Filtro por rol
    if (rol_id) {
      whereConditions.rol_id = rol_id;
    }

    const students = await Alumno.findAndCountAll({
      where: whereConditions,
      order: [["id", "ASC"]],
      limit,
      offset,
    });

    return res.json({
      total: students.count,
      totalPages: Math.ceil(students.count / limit),
      currentPage: page,
      limit,
      students: students.rows
    });
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).send("Error al obtener los usuarios");
  }
};

const getStudentbyId = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Alumno.findByPk(id,
      {
      include: [{ model: Rol }, { model: Carrera }]
    });

    if (!student) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).send("Error al obtener el usuario");
  }
};

const getStudentReviews = async (req, res) => {
  const { id } = req.params;
  
  try {
    const reviews = await ReviewCab.findAndCountAll({
      where: { alumno: id },
      include: [
        {
          model: ReviewCont,
          include: [
            {
              model: Aspecto,
            },
          ],
        },
      ],
    });
    if (reviews.count === 0) {
      return res.status(404).json({ error: "No se encontraron reseñas para este usuario" });
    }
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener las reseñas del usuario:", error);
    res.status(500).send("Error al obtener las reseñas del usuario");
  }
};

const createStudent = async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const newStudent = await Alumno.create({
      nombre,
      correo,
      password,
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res.status(500).send("Error al crear el usuario");
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo } = req.body;

  try {
    const student = await Alumno.findByPk(id);

    if (!student) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await student.update({
      nombre,
      correo,
    });

    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar el usuario");
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Alumno.findByPk(id);

    if (!student) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await student.destroy();

    res.status(200).json("Usuario eliminado");
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).send("Error al eliminar el usuario");
  }
};

export default {
  getAllStudents,
  getStudentbyId,
  getStudentReviews,
  createStudent,
  updateStudent,
  deleteStudent,
};
