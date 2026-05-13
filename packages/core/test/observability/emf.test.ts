import { describe, expect, it } from 'vitest';
import { assertNoPiiInLogObject, buildEmf } from '../../src';

describe('EMF helper', () => {
  it('emits stdout-compatible pii-safe metric objects', () => {
    const emf = buildEmf({ namespace: 'HealthcareRagPoc', dimensions: { Profile: 'local' }, metrics: [{ name: 'PassRate', unit: 'Percent', value: 100 }], timestamp: 1 });
    expect(emf).toMatchObject({ Profile: 'local', PassRate: 100 });
    expect(assertNoPiiInLogObject(emf)).toBe(true);
  });
});
