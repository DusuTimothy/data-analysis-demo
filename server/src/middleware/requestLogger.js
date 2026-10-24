/**
 * Emits one structured access log per request. Never logs query values,
 * headers, cookies, or row data.
 */

export function requestLogger(logger) {
  return function logRequest(req, res, next) {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Number(durationMs.toFixed(1)),
        },
        'request completed',
      );
    });

    next();
  };
}
