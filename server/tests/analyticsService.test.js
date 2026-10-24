import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyticsService } from '../src/services/analyticsService.js';
import { ACTIVITY_TYPES } from '../src/config/campaign.js';

const LGAS = ['Test LGA A', 'Test LGA B'];

function buildService(rows, totalsRow = {}, { trendRows = [], coverageRows = [] } = {}) {
  const calls = [];
  const repository = {
    async getGroupedSummary(query) {
      calls.push(['getGroupedSummary', query]);
      return rows;
    },
    async getTotals(query) {
      calls.push(['getTotals', query]);
      return totalsRow;
    },
    async getTrend(query) {
      calls.push(['getTrend', query]);
      return trendRows;
    },
    async getCoverage(query) {
      calls.push(['getCoverage', query]);
      return coverageRows;
    },
  };
  return { service: createAnalyticsService({ repository, lgas: LGAS }), calls };
}

const DEFAULT_QUERY = {
  groupBy: 'lga',
  lga: undefined,
  ward: undefined,
  activityType: undefined,
  from: undefined,
  to: undefined,
};

test('normalizes string decimals and computes cost per contact', async () => {
  const { service } = buildService(
    [
      {
        group: 'Test LGA A',
        total_activities: '3',
        total_contacts: '10',
        total_spend: '123.456',
      },
    ],
    { total_activities: '3', total_contacts: '10', total_spend: '123.456' },
  );

  const result = await service.getSummary(DEFAULT_QUERY);

  assert.deepEqual(result.rows, [
    {
      group: 'Test LGA A',
      totalActivities: 3,
      totalContacts: 10,
      totalSpend: 123.46,
      costPerContact: 12.35,
    },
  ]);
  assert.equal(result.totals.totalSpend, 123.46);
  assert.equal(result.totals.costPerContact, 12.35);
});

test('labels a null polling unit bucket instead of failing the report', async () => {
  const { service } = buildService(
    [{ group: null, total_activities: '1', total_contacts: '5', total_spend: '50.00' }],
    { total_activities: '1', total_contacts: '5', total_spend: '50.00' },
  );

  const result = await service.getSummary({ ...DEFAULT_QUERY, groupBy: 'polling_unit' });

  assert.equal(result.rows[0].group, '(not recorded)');
  assert.equal(result.rows[0].costPerContact, 10);
});

test('returns null cost per contact when no contacts were reached', async () => {
  const { service } = buildService(
    [{ group: 'Test LGA A', total_activities: '2', total_contacts: 0, total_spend: '500.00' }],
    { total_activities: '2', total_contacts: 0, total_spend: '500.00' },
  );

  const result = await service.getSummary(DEFAULT_QUERY);

  assert.equal(result.rows[0].costPerContact, null);
  assert.equal(result.totals.costPerContact, null);
});

test('treats empty aggregates as zero without NaN values', async () => {
  const { service } = buildService([], {});

  const result = await service.getSummary(DEFAULT_QUERY);

  assert.deepEqual(result.rows, []);
  assert.deepEqual(result.totals, {
    totalActivities: 0,
    totalContacts: 0,
    totalSpend: 0,
    costPerContact: null,
  });
});

test('rejects an unsupported grouping dimension', async () => {
  const { service } = buildService([], {});

  await assert.rejects(service.getSummary({ ...DEFAULT_QUERY, groupBy: 'region' }), (error) => {
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.equal(error.statusCode, 400);
    return true;
  });
});

test('rejects an LGA outside the configured district', async () => {
  const { service } = buildService([], {});

  await assert.rejects(
    service.getSummary({ ...DEFAULT_QUERY, lga: 'Unknown LGA' }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      return true;
    },
  );
});

test('rejects an unsupported activity type', async () => {
  const { service } = buildService([], {});
  assert.ok(ACTIVITY_TYPES.includes('rally'));

  await assert.rejects(
    service.getSummary({ ...DEFAULT_QUERY, activityType: 'telepathy' }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      return true;
    },
  );
});

test('rejects a reversed date range', async () => {
  const { service } = buildService([], {});

  await assert.rejects(
    service.getSummary({ ...DEFAULT_QUERY, from: '2027-02-01', to: '2026-01-01' }),
    (error) => {
      assert.equal(error.code, 'VALIDATION_ERROR');
      return true;
    },
  );
});

test('normalizes trend periods and aggregates', async () => {
  const { service } = buildService(
    [],
    { total_activities: '2', total_contacts: '30', total_spend: '300.00' },
    {
      trendRows: [
        {
          period: '2026-06-01',
          total_activities: '2',
          total_contacts: '30',
          total_spend: '300.50',
        },
      ],
    },
  );

  const result = await service.getTrend({ ...DEFAULT_QUERY, bucket: 'month' });

  assert.deepEqual(result.rows, [
    {
      period: '2026-06-01',
      totalActivities: 2,
      totalContacts: 30,
      totalSpend: 300.5,
      costPerContact: 10.02,
    },
  ]);
  assert.equal(result.totals.totalSpend, 300);
});

test('rejects an unsupported trend bucket', async () => {
  const { service } = buildService([], {});

  await assert.rejects(service.getTrend({ ...DEFAULT_QUERY, bucket: 'quarter' }), (error) => {
    assert.equal(error.code, 'VALIDATION_ERROR');
    return true;
  });
});

test('normalizes the coverage cross-tab', async () => {
  const { service } = buildService(
    [],
    { total_activities: '1', total_contacts: '10', total_spend: '100.00' },
    {
      coverageRows: [
        {
          lga: 'Test LGA A',
          activity_type: 'rally',
          total_activities: '1',
          total_contacts: '10',
          total_spend: '100.00',
        },
      ],
    },
  );

  const result = await service.getCoverage(DEFAULT_QUERY);

  assert.deepEqual(result.rows, [
    {
      lga: 'Test LGA A',
      activityType: 'rally',
      totalActivities: 1,
      totalContacts: 10,
      totalSpend: 100,
      costPerContact: 10,
    },
  ]);
});
