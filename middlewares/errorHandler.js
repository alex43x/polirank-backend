const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor';

  /* JWT  */
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
  }

  /*  MySQL  */

  // Entrada duplicada (UNIQUE)
  if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Registro duplicado';
  }

  // Clave foránea inválida
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'Referencia inválida';
  }

  // No se puede borrar / actualizar por FK
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 400;
    message = 'El registro está siendo utilizado';
  }

  // Error de sintaxis SQL
  if (err.code === 'ER_PARSE_ERROR') {
    status = 500;
    message = 'Error en la consulta SQL';
  }

  /* LOG */
  console.error(`[${status}]`, err.code, err.sqlMessage);

  /*  RESPONSE  */
  res.status(status).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      mysqlCode: err.code,
      mysqlMessage: err.sqlMessage,
      stack: err.stack,
    }),
  });
};

export default errorHandler;
