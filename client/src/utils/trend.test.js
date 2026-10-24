import { describe, expect, it } from 'vitest';
import { fillTrendPeriods } from './trend.js';

const april = {
  period: '2026-04-01',
  total_activities: 1,
  total_contacts: 719,
  total_spend: '444332.00',
  cost_per_contact: '617.99',
};
const june = {
  period: '2026-06-01',
  total_activities: 3,
  total_contacts: 2263,
  total_spend: '542834.00',
  cost_per_contact: '239.87',
};

describe('fillTrendPeriods', () => {
  it('inserts zero months between recorded months', () => {
    const filled = fillTrendPeriods([april, june], 'month');

    expect(filled.map((row) => row.period)).toEqual([
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
    ]);
    expect(filled[1]).toEqual({
      period: '2026-05-01',
      total_activities: 0,
      total_contacts: 0,
      total_spend: 0,
      cost_per_contact: null,
    });
    expect(filled[2]).toBe(june);
  });

  it('fills weekly gaps without changing week alignment', () => {
    const weeks = [
      { ...april, period: '2026-04-06' },
      { ...june, period: '2026-04-27' },
    ];

    const filled = fillTrendPeriods(weeks, 'week');

    expect(filled.map((row) => row.period)).toEqual([
      '2026-04-06',
      '2026-04-13',
      '2026-04-20',
      '2026-04-27',
    ]);
    expect(filled[1].total_contacts).toBe(0);
  });

  it('returns an empty array for no rows', () => {
    expect(fillTrendPeriods([], 'month')).toEqual([]);
  });
});
