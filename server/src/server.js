/**
 * Process entry point: load configuration, connect the database, start the
 * HTTP server, and shut down cleanly on termination signals.
 */

import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createCampaignConfig } from './config/campaign.js';
import { closeDatabase, connectDatabase, createSequelize } from './db/database.js';
import { initCampaignActivity } from './models/CampaignActivity.js';
import { createCampaignRepository } from './repositories/campaignRepository.js';
import { createAnalyticsService } from './services/analyticsService.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function main() {
  let env;
  try {
    env = loadEnv();
    logger.debug({ event: 'config.loaded' }, 'Environment configuration validated');
  } catch (error) {
    logger.error({ event: 'config.invalid', errorMessage: error.message }, 'Invalid configuration');
    process.exitCode = 1;
    return;
  }

  const campaignConfig = createCampaignConfig(env);
  const sequelize = createSequelize({
    databaseUrl: env.databaseUrl,
    ssl: { enabled: env.dbSsl, rejectUnauthorized: env.dbSslRejectUnauthorized },
    logging: env.dbLogging,
    logger,
  });

  try {
    await connectDatabase(sequelize, logger);
  } catch (error) {
    logger.error(
      { event: 'db.connect_failed', errorName: error.name, errorMessage: error.message },
      'Could not connect to the database',
    );
    await sequelize.close().catch(() => {});
    process.exitCode = 1;
    return;
  }

  const model = initCampaignActivity(sequelize);
  const repository = createCampaignRepository(model);
  const analyticsService = createAnalyticsService({ repository, lgas: campaignConfig.lgas });
  const app = createApp({
    analyticsService,
    campaignConfig,
    logger,
    readinessCheck: () => sequelize.authenticate(),
  });

  const server = app.listen(env.port, () => {
    logger.info({ event: 'server.started', port: env.port }, 'Analytics API listening');
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ event: 'server.shutdown_started', signal }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error({ event: 'server.shutdown_timeout' }, 'Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async () => {
      try {
        await closeDatabase(sequelize);
        logger.info({ event: 'server.stopped' }, 'Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error(
          { event: 'server.shutdown_failed', errorMessage: error.message },
          'Shutdown failed',
        );
        process.exit(1);
      }
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error(
    { event: 'server.unhandled_startup_error', errorName: error.name, errorMessage: error.message },
    'Unhandled startup error',
  );
  process.exit(1);
});
