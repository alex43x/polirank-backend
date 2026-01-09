import Alumno from "../models/studentModel.js";
import Rol from "../models/roleModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const login = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    const loginUser = await Alumno.scope('withPassword').findOne({
      where: { correo },
      include: {
        model: Rol,
        attributes: ["id", "nombre"],
      },
    });

    if (!loginUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, loginUser.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const student = await Alumno.findByPk(loginUser.id, {
      include: [
        { model: Rol },
      ]
    });

    const token = jwt.sign(
      {
        id: student.id,
        correo: student.correo,
        rol: {
          id: student.Rol.id,
          nombre: student.Rol.nombre,
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      status: "success",
      token,
      data: { student },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  login,
};
