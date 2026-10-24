/**
 * CORS allowlist. Browser origins not explicitly trusted are rejected before
 * they can reach an API route. Requests without an Origin header (curl,
 * server-to-server, same-origin proxy) are allowed.
 */

import cors from 'cors';
import { AppError } from '../errors/AppError.js';

export function createCorsMiddleware({ allowedOrigins }) {
  const allowed = new Set(allowedOrigins);

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(AppError.forbidden('This origin is not allowed to access the API.'));
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: false,
    maxAge: 600,
  });
}
