/**
 * Rate limiters protect the API from brute-force and accidental DoS.
 * The analytics endpoints get a stricter budget than the rest of /api.
 */

import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/AppError.js';

function createLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(_req, _res, next) {
      next(AppError.rateLimited());
    },
  });
}

export const globalApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

export const analyticsLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
});
