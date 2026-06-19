import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth) {
      try {
        const token = auth.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.id) return `user:${payload.id}`;
      } catch { /* fallthrough */ }
    }
    return ipKeyGenerator(req.ip);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again later.' },
});

export const requestAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.correo?.toLowerCase() || ipKeyGenerator(req.ip),
  message: { message: 'Too many attempts, please try again later.' },
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { message: 'Too many password reset attempts, please try again later.' },
});
