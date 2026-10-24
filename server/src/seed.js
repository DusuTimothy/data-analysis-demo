/**
 * Deterministic, idempotent synthetic seed for local development only.
 * Writes to the base table with the admin connection, then the API reads the
 * restricted analytics view.
 */

import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createCampaignConfig } from './config/campaign.js';
import { closeDatabase, createSequelize } from './db/database.js';
import { logger } from './utils/logger.js';

const WARDS_PER_LGA = 3;
const ACTIVITIES_PER_WARD = 3;
const CAMPAIGN_START = new Date('2026-03-01T00:00:00.000Z');
const CAMPAIGN_DAY_SPAN = 360;

const PROFILE_BY_TYPE = Object.freeze({
  rally: { contacts: [500, 5000], spend: [500000, 3000000] },
  door_to_door: { contacts: [50, 400], spend: [20000, 200000] },
  town_hall: { contacts: [100, 800], spend: [100000, 600000] },
  market_outreach: { contacts: [100, 1000], spend: [50000, 300000] },
  radio: { contacts: [1000, 10000], spend: [300000, 2000000] },
  social_media: { contacts: [500, 5000], spend: [50000, 500000] },
  billboard: { contacts: [0, 0], spend: [200000, 1500000] },
});

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildActivities(lgas) {
  const rng = createRng(2027);
  const activityTypes = Object.keys(PROFILE_BY_TYPE);
  const rows = [];
  let sequence = 0;

  lgas.forEach((lga, lgaIndex) => {
    for (let wardIndex = 0; wardIndex < WARDS_PER_LGA; wardIndex += 1) {
      for (let activityIndex = 0; activityIndex < ACTIVITIES_PER_WARD; activityIndex += 1) {
        const activityType = activityTypes[(sequence + lgaIndex) % activityTypes.length];
        const profile = PROFILE_BY_TYPE[activityType];
        const dayOffset = randomInt(rng, 0, CAMPAIGN_DAY_SPAN);
        const activityDate = new Date(CAMPAIGN_START);
        activityDate.setUTCDate(activityDate.getUTCDate() + dayOffset);

        rows.push({
          activity_type: activityType,
          lga,
          ward: `Ward ${String.fromCharCode(65 + wardIndex)}`,
          polling_unit: `PU-${String(sequence + 1).padStart(4, '0')}`,
          contact_count: randomInt(rng, profile.contacts[0], profile.contacts[1]),
          amount_spent: randomInt(rng, profile.spend[0], profile.spend[1]).toFixed(2),
          activity_date: isoDate(activityDate),
        });
        sequence += 1;
      }
    }
  });

  return rows;
}

function summarize(rows) {
  const byLga = new Map();
  const byType = new Map();
  let totalContacts = 0;
  let totalSpend = 0;

  for (const row of rows) {
    const spend = Number(row.amount_spent);
    totalContacts += row.contact_count;
    totalSpend += spend;

    const lga = byLga.get(row.lga) ?? { activities: 0, contacts: 0, spend: 0 };
    lga.activities += 1;
    lga.contacts += row.contact_count;
    lga.spend += spend;
    byLga.set(row.lga, lga);

    const type = byType.get(row.activity_type) ?? { activities: 0, contacts: 0, spend: 0 };
    type.activities += 1;
    type.contacts += row.contact_count;
    type.spend += spend;
    byType.set(row.activity_type, type);
  }

  return { byLga, byType, totalContacts, totalSpend };
}

async function main() {
  const env = loadEnv();
  const campaignConfig = createCampaignConfig(env);
  const seedUrl = env.seedDatabaseUrl || env.databaseUrl;

  const sequelize = createSequelize({
    databaseUrl: seedUrl,
    ssl: { enabled: env.dbSsl, rejectUnauthorized: env.dbSslRejectUnauthorized },
    logging: false,
    logger,
  });

  const rows = buildActivities(campaignConfig.lgas);

  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();

    await sequelize.query('TRUNCATE TABLE campaign_activities RESTART IDENTITY CASCADE');
    await queryInterface.bulkInsert('campaign_activities', rows);

    const summary = summarize(rows);
    logger.info(
      {
        event: 'seed.completed',
        activities: rows.length,
        lgas: [...summary.byLga.entries()].map(([lga, value]) => ({ lga, ...value })),
        activityTypes: [...summary.byType.entries()].map(([type, value]) => ({
          activityType: type,
          ...value,
        })),
        totalContacts: summary.totalContacts,
        totalSpend: Number(summary.totalSpend.toFixed(2)),
      },
      'Synthetic campaign data seeded',
    );
  } finally {
    await closeDatabase(sequelize);
  }
}

main().catch((error) => {
  logger.error(
    { event: 'seed.failed', errorName: error.name, errorMessage: error.message },
    'Seeding failed',
  );
  process.exit(1);
});
