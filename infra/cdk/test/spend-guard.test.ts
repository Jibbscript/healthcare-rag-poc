import { describe, expect, it } from 'vitest';
import { defaultSmokeFlags, assertSmokeFlags } from '../lib/config/profiles';

describe('spend guard', () => {
  it('rejects expensive smoke flags', () => {
    expect(() => assertSmokeFlags(defaultSmokeFlags)).not.toThrow();
    expect(() => assertSmokeFlags({ ...defaultSmokeFlags, enableOpenSearch: true })).toThrow(/forbidden/);
    expect(() => assertSmokeFlags({ ...defaultSmokeFlags, enableBedrockRuntimeEndpoint: true } as typeof defaultSmokeFlags)).toThrow(/forbidden/);
  });
});
