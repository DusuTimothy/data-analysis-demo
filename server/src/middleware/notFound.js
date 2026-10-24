/**
 * Converts unmatched routes into the standard JSON error envelope.
 */

import { AppError } from '../errors/AppError.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}
