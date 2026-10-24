/**
 * Operational error with a stable machine-readable code and HTTP status.
 * Only AppError messages are safe to return to clients.
 */
export class AppError extends Error {
  constructor({ statusCode, code, message, details, cause }) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, details) {
    return new AppError({ statusCode: 400, code: 'VALIDATION_ERROR', message, details });
  }

  static notFound(message = 'Route not found.') {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message });
  }

  static forbidden(message, details) {
    return new AppError({ statusCode: 403, code: 'FORBIDDEN', message, details });
  }

  static rateLimited(message = 'Too many requests. Please try again later.') {
    return new AppError({ statusCode: 429, code: 'RATE_LIMITED', message });
  }
}
