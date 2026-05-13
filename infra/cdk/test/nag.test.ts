import { describe, expect, it } from 'vitest';
import { defaultSmokeFlags } from '../lib/config/profiles';
import { nag } from '../lib/nag';
import { synthTemplate } from '../lib/template';

describe('nag checks', () => {
  it('has no custom nag findings for smoke template', () => {
    expect(nag(synthTemplate('aws-smoke', defaultSmokeFlags))).toEqual([]);
  });
});
