/**
 * Applies the local development schema using SEED_DATABASE_URL.
 * Production schema changes are explicitly out of scope for this application.
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { loadEnv } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  const env = loadEnv();
  if (!env.seedDatabaseUrl) {
    throw new Error('SEED_DATABASE_URL is required to apply the local schema.');
  }

  const sqlPath = new URL('../setup/create-local-schema.sql', import.meta.url);
  const sql = await readFile(sqlPath, 'utf8');
  const client = new Client({
    connectionString: env.seedDatabaseUrl,
    ssl: env.dbSsl ? { rejectUnauthorized: env.dbSslRejectUnauthorized } : undefined,
  });

  await client.connect();
  try {
    await client.query(sql);
    logger.info({ event: 'schema.applied' }, 'Local schema and analytics view are ready');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  logger.error(
    { event: 'schema.failed', errorName: error.name, errorMessage: error.message },
    'Could not apply the local schema',
  );
  process.exit(1);
});
