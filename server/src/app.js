/**
 * Builds the Express application without opening a port, so tests can exercise
 * the full HTTP stack in-process. Dependencies are injected explicitly.
 */

import express from 'express';
import helmet from 'helmet';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { analyticsLimiter, globalApiLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { createErrorHandler } from './middleware/errorHandler.js';
import { createAnalyticsRouter } from './routes/analyticsRoutes.js';
import { createHealthRouter } from './routes/healthRoutes.js';

export function createApp({
  analyticsService,
  campaignConfig,
  logger,
  readinessCheck = null,
  rateLimitEnabled = true,
}) {
  if (!analyticsService || !campaignConfig || !logger) {
    throw new Error('createApp requires analyticsService, campaignConfig, and logger.');
  }

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', campaignConfig.trustProxy);

  app.use(helmet());
  app.use(requestId);
  app.use(requestLogger(logger));
  app.use(createCorsMiddleware({ allowedOrigins: campaignConfig.allowedOrigins }));

  if (rateLimitEnabled) {
    app.use('/api/analytics', analyticsLimiter);
    app.use('/api', globalApiLimiter);
  }

  app.use(express.json({ limit: '10kb' }));

  app.use(createHealthRouter({ readinessCheck, logger }));
  app.use(
    '/api/analytics',
    createAnalyticsRouter({ analyticsService, campaignConfig }),
  );

  app.use(notFound);
  app.use(createErrorHandler({ logger, isProduction: campaignConfig.isProduction }));

  return app;
}
