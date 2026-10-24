/**
 * Liveness and readiness probes. Readiness verifies the database connection
 * without exposing connection details.
 */

import { Router } from 'express';

export function createHealthRouter({ readinessCheck, logger }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', requestId: req.requestId });
  });

  router.get('/ready', async (req, res) => {
    if (!readinessCheck) {
      res.json({ status: 'ready', requestId: req.requestId });
      return;
    }

    try {
      await readinessCheck();
      res.json({ status: 'ready', requestId: req.requestId });
    } catch {
      logger.warn(
        { requestId: req.requestId, event: 'readiness.failed' },
        'Database readiness check failed',
      );
      res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database is not ready.',
          requestId: req.requestId,
        },
      });
    }
  });

  return router;
}
