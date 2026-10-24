/**
 * Analytics routes: validate input, then delegate to the controller.
 */

import { Router } from 'express';
import { createAnalyticsController } from '../controllers/analyticsController.js';
import { validateAnalyticsQuery } from '../middleware/validateAnalyticsQuery.js';

export function createAnalyticsRouter({ analyticsService, campaignConfig }) {
  const router = Router();
  const controller = createAnalyticsController({ analyticsService, campaignConfig });

  router.get('/context', controller.getContext);
  router.get('/summary', validateAnalyticsQuery(campaignConfig), controller.getSummary);
  router.get(
    '/trends',
    validateAnalyticsQuery(campaignConfig, { allowBucket: true }),
    controller.getTrend,
  );
  router.get('/coverage', validateAnalyticsQuery(campaignConfig), controller.getCoverage);

  return router;
}
