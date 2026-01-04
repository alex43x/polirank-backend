const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Error interno del servidor";

  /* JWT */
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Token inválido";
  }
  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expirado";
  }

  /* express-validator */
  if (err.errors && Array.isArray(err.errors)) {
    status = 400;
    message = err.errors.map(e => e.msg).join(", ");
  }

  /* PostgreSQL */
  switch (err.code) {
    case "23505": // unique_violation
      status = 409;
      message = "Registro duplicado";
      break;
    case "23503": // foreign_key_violation
      status = 400;
      message = "Referencia inválida";
      break;
    case "42601": // syntax_error
      status = 500;
      message = "Error en la consulta SQL";
      break;
    default:
      break;
  }

  /* Autorización */
  if (status === 403) {
    message = message || "No tiene permisos para esta acción";
  }

  console.error(`[${status}]`, err.code || "", err.sqlMessage || err.message, err.stack);

  res.status(status).json({
    status,
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack,
      errors: err.errors || null,
    }),
  });
};

export default errorHandler;
