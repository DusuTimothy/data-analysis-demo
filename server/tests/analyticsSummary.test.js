import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createLogger } from '../src/utils/logger.js';
import { ACTIVITY_TYPES } from '../src/config/campaign.js';

const silentLogger = createLogger({ sink: { write() {} } });

const campaignConfig = {
  candidateName: 'Test Candidate',
  partyName: 'APC',
  senatorialDistrict: 'Plateau',
  electionYear: 2027,
  lgas: ['Test LGA A', 'Test LGA B'],
  activityTypes: ACTIVITY_TYPES,
  allowedOrigins: ['http://localhost:5173'],
  isProduction: false,
  trustProxy: false,
};

const successfulResult = {
  rows: [
    {
      group: 'Test LGA A',
      totalActivities: 2,
      totalContacts: 100,
      totalSpend: 2500,
      costPerContact: 25,
    },
  ],
  totals: {
    totalActivities: 2,
    totalContacts: 100,
    totalSpend: 2500,
    costPerContact: 25,
  },
};

const successfulTrend = {
  rows: [
    {
      period: '2026-06-01',
      totalActivities: 2,
      totalContacts: 100,
      totalSpend: 2500,
      costPerContact: 25,
    },
  ],
  totals: successfulResult.totals,
};

const successfulCoverage = {
  rows: [
    {
      lga: 'Test LGA A',
      activityType: 'rally',
      totalActivities: 2,
      totalContacts: 100,
      totalSpend: 2500,
      costPerContact: 25,
    },
  ],
  totals: successfulResult.totals,
};

function buildApp({
  service = {
    async getSummary() {
      return successfulResult;
    },
    async getTrend() {
      return successfulTrend;
    },
    async getCoverage() {
      return successfulCoverage;
    },
  },
  config = campaignConfig,
  readinessCheck = null,
} = {}) {
  return createApp({
    analyticsService: service,
    campaignConfig: config,
    logger: silentLogger,
    readinessCheck,
    rateLimitEnabled: false,
  });
}

test('returns the summary contract and echoes a caller request ID', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .set('x-request-id', 'test-request-1')
    .expect(200);

  assert.equal(response.headers['x-request-id'], 'test-request-1');
  assert.equal(response.body.context.candidate, 'Test Candidate');
  assert.equal(response.body.context.party, 'APC');
  assert.deepEqual(response.body.context.lgas, ['Test LGA A', 'Test LGA B']);
  assert.equal(response.body.currency, 'NGN');
  assert.equal(response.body.filters.group_by, 'lga');
  assert.equal(response.body.filters.lga, null);
  assert.equal(response.body.data[0].total_contacts, 100);
  assert.equal(response.body.data[0].cost_per_contact, 25);
  assert.equal(response.body.totals.total_spend, 2500);
  assert.ok(response.body.generated_at);
});

test('passes validated filters to the service', async () => {
  let received;
  const app = buildApp({
    service: {
      async getSummary(query) {
        received = query;
        return successfulResult;
      },
    },
  });

  await request(app)
    .get('/api/analytics/summary')
    .query({
      group_by: 'ward',
      lga: 'Test LGA A',
      ward: 'Ward A',
      activity_type: 'rally',
      from: '2026-01-01',
      to: '2027-02-01',
    })
    .expect(200);

  assert.deepEqual(received, {
    groupBy: 'ward',
    lga: 'Test LGA A',
    ward: 'Ward A',
    activityType: 'rally',
    from: '2026-01-01',
    to: '2027-02-01',
  });
});

test('rejects an invalid group_by', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .query({ group_by: 'region' })
    .expect(400);

  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.match(response.body.error.message, /group_by/);
  assert.ok(response.body.error.requestId);
});

test('rejects an LGA outside the configured district', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .query({ lga: 'Unknown LGA' })
    .expect(400);

  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('rejects unknown query parameters', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .query({ candidate: 'someone' })
    .expect(400);

  assert.match(response.body.error.message, /Unknown query parameter/);
});

test('rejects array-shaped query parameters', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary?lga=Test+LGA+A&lga=Test+LGA+B')
    .expect(400);

  assert.match(response.body.error.message, /must be provided once/);
});

test('rejects an impossible date', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .query({ from: '2027-02-30' })
    .expect(400);

  assert.match(response.body.error.message, /valid date/);
});

test('rejects a reversed date range', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/summary')
    .query({ from: '2027-02-01', to: '2026-01-01' })
    .expect(400);

  assert.match(response.body.error.message, /earlier than or equal/);
});

test('returns a 404 envelope for unknown routes', async () => {
  const response = await request(buildApp()).get('/api/does-not-exist').expect(404);

  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.ok(response.body.error.requestId);
});

test('hides internal error details in production', async () => {
  const app = buildApp({
    service: {
      async getSummary() {
        throw new Error('database password leaked here');
      },
    },
    config: { ...campaignConfig, isProduction: true },
  });

  const response = await request(app).get('/api/analytics/summary').expect(500);

  assert.equal(response.body.error.code, 'INTERNAL_ERROR');
  assert.equal(response.body.error.message, 'An unexpected error occurred.');
  assert.equal(response.body.error.stack, undefined);
  assert.doesNotMatch(JSON.stringify(response.body), /password leaked/);
});

test('exposes a stack trace in development for debugging', async () => {
  const app = buildApp({
    service: {
      async getSummary() {
        throw new Error('development detail');
      },
    },
  });

  const response = await request(app).get('/api/analytics/summary').expect(500);

  assert.match(response.body.error.stack, /development detail/);
});

test('returns campaign context and filter options', async () => {
  const response = await request(buildApp()).get('/api/analytics/context').expect(200);

  assert.equal(response.body.context.candidate, 'Test Candidate');
  assert.equal(response.body.context.party, 'APC');
  assert.deepEqual(response.body.context.lgas, ['Test LGA A', 'Test LGA B']);
  assert.equal(response.body.currency, 'NGN');
});

test('returns trend data with a default monthly bucket', async () => {
  const response = await request(buildApp()).get('/api/analytics/trends').expect(200);

  assert.equal(response.body.filters.bucket, 'month');
  assert.equal(response.body.filters.group_by, undefined);
  assert.equal(response.body.data[0].period, '2026-06-01');
  assert.equal(response.body.data[0].total_contacts, 100);
  assert.equal(response.body.totals.total_spend, 2500);
});

test('passes a weekly bucket and filters to the trend service', async () => {
  let received;
  const app = buildApp({
    service: {
      async getTrend(query) {
        received = query;
        return successfulTrend;
      },
    },
  });

  const response = await request(app)
    .get('/api/analytics/trends')
    .query({ bucket: 'week', lga: 'Test LGA A', activity_type: 'rally' })
    .expect(200);

  assert.equal(received.bucket, 'week');
  assert.equal(received.lga, 'Test LGA A');
  assert.equal(received.activityType, 'rally');
  assert.equal(received.groupBy, 'lga');
  assert.equal(response.body.filters.bucket, 'week');
  assert.equal(response.body.filters.lga, 'Test LGA A');
});

test('rejects an invalid trend bucket', async () => {
  const response = await request(buildApp())
    .get('/api/analytics/trends')
    .query({ bucket: 'quarter' })
    .expect(400);

  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.match(response.body.error.message, /bucket/);
});

test('returns coverage rows without a grouping dimension', async () => {
  const response = await request(buildApp()).get('/api/analytics/coverage').expect(200);

  assert.equal(response.body.data[0].lga, 'Test LGA A');
  assert.equal(response.body.data[0].activity_type, 'rally');
  assert.equal(response.body.filters.group_by, undefined);
  assert.equal(response.body.totals.total_contacts, 100);
});

test('health endpoint responds without touching the database', async () => {
  const response = await request(buildApp()).get('/health').expect(200);
  assert.equal(response.body.status, 'ok');
});

test('readiness reports a database failure as 503', async () => {
  const app = buildApp({
    readinessCheck: async () => {
      throw new Error('connection refused');
    },
  });

  const response = await request(app).get('/ready').expect(503);

  assert.equal(response.body.error.code, 'DATABASE_UNAVAILABLE');
});
