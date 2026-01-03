import { loginUser } from "../models/user.model.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validación básica (opcional pero recomendable)
    if (!email || !password) {
      const err = new Error("Email y password son obligatorios");
      err.status = 400;
      throw err;
    }

    const result = await loginUser(email, password);

    res.status(200).json(result);
  } catch (err) {
    next(err); // ← pasa todo al errorHandler
  }
};
