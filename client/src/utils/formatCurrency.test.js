import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency.js';

describe('formatCurrency', () => {
  it('formats naira with two decimals and grouping', () => {
    const result = formatCurrency(1234567.5);
    expect(result).toContain('1,234,567.50');
  });

  it('renders a null cost-per-contact as an em dash', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('renders invalid input as an em dash', () => {
    expect(formatCurrency('not-a-number')).toBe('—');
  });
});
