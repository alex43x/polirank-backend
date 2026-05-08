import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again later.' },
});

export const requestAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.correo?.toLowerCase() || req.ip,
  message: { message: 'Too many attempts, please try again later.' },
});
