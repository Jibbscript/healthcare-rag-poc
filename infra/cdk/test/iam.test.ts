import { describe, expect, it } from 'vitest';
import { defaultSmokeFlags } from '../lib/config/profiles';
import { synthTemplate } from '../lib/template';

describe('least privilege policies', () => {
  it('does not grant broad data-plane admin actions', () => {
    const role = synthTemplate('aws-smoke', defaultSmokeFlags).Resources.ChatLambdaRole;
    const text = JSON.stringify(role.Properties);
    expect(text).not.toContain('s3:*');
    expect(text).not.toContain('dynamodb:*');
    expect(text).not.toContain('AdministratorAccess');
  });
});
