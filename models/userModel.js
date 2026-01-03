import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../db/pool.js";

export const loginUser = async (email, password) => {
  try {
    const query = `query sql para obtener el usuario por email`;

    const { rows } = await pool.query(query, [email]);

    // Credenciales inválidas (no filtra si existe o no)
    if (rows.length === 0) {
      const err = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    const user = rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const err = new Error("Credenciales inválidas");
      err.status = 401;
      throw err;
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
        carrera: user.carrera
      }
    };
  } catch (err) {
    throw err;  // Re-lanzar para que lo capture el errorHandler
  }
};
