/**
 * Central error boundary: stable response envelope, no internals in
 * production, request ID always included.
 */

import { AppError } from '../errors/AppError.js';

export function createErrorHandler({ logger, isProduction }) {
  return function handleError(error, req, res, next) {
    if (res.headersSent) {
      next(error);
      return;
    }

    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (error && error.type === 'entity.parse.failed') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Request body must be valid JSON.';
    }

    const logFields = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: statusCode,
      code,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    };

    if (statusCode >= 500) {
      logger.error(logFields, 'request failed');
    } else {
      logger.warn(logFields, 'request rejected');
    }

    const body = {
      error: {
        code,
        message,
        requestId: req.requestId,
      },
    };

    if (!isProduction && error?.stack) {
      body.error.stack = error.stack;
    }

    res.status(statusCode).json(body);
  };
}
