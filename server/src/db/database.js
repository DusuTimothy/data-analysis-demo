/**
 * Creates the Sequelize connection and owns connect/close lifecycle.
 * Runtime credentials are read-only and scoped to the analytics view.
 */

import { Sequelize } from 'sequelize';
import { logger as defaultLogger } from '../utils/logger.js';

export function createSequelize({
  databaseUrl,
  ssl,
  logging = false,
  logger = defaultLogger,
}) {
  if (!databaseUrl) {
    throw new Error('createSequelize requires a databaseUrl.');
  }

  return new Sequelize(databaseUrl, {
    dialect: 'postgres',
    // Query text can contain bound values, so SQL logging is intentionally
    // reduced to an event marker even when DB_LOGGING is enabled.
    logging: logging
      ? () => logger.debug({ event: 'db.query' }, 'Database query executed')
      : false,
    dialectOptions: ssl.enabled
      ? { ssl: { require: true, rejectUnauthorized: ssl.rejectUnauthorized } }
      : undefined,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

export async function connectDatabase(sequelize, logger = defaultLogger) {
  await sequelize.authenticate();
  logger.info({ event: 'db.connected' }, 'Database connection established');
}

export async function closeDatabase(sequelize) {
  await sequelize.close();
}
