import AppError from './AppError.js';

export class NotFoundError extends AppError {
  constructor(code, message) {
    super(code, 404, message);
  }
}

export class ValidationError extends AppError {
  constructor(code, message, details) {
    super(code, 400, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(code, message) {
    super(code, 409, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code, message) {
    super(code, 401, message);
  }
}
