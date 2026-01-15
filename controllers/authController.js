import Alumno from "../models/studentModel.js";
import Rol from "../models/roleModel.js";
import Carrera from "../models/careerModel.js";
import Aspecto from "../models/aspectModel.js";
import ReviewCont from "../models/reviewCont.js";
import ReviewCab from "../models/reviewCab.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const login = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    const loginUser = await Alumno.scope('withPassword').findOne({
      where: { correo },
    });

    if (!loginUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, loginUser.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const student = await Alumno.findByPk(loginUser.id, {
      include: [{ model: Rol }, { model: Carrera }],
    });

    const token = jwt.sign(
      {
        id: student.id,
        correo: student.correo,
        rol: student.Rol,
        carrera: student.Carrera,
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


const getUserProfile = async (req, res) => {
  const currentUser = req.user;

  try {
    const student = await Alumno.findByPk(currentUser.id, {
      include: [
        { model: Rol }, 
        { model: Carrera }, 
      ], 
    }); 
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }
    const reviews = await ReviewCab.findAndCountAll({
      where: { alumno: currentUser.id },
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

    res.status(200).json({ student, reviews });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export default {
  login,
  getUserProfile
};
