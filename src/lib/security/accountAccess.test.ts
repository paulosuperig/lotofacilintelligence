import { describe, expect, it } from 'vitest';
import { hasActiveAccount } from '../../../supabase/functions/_shared/accountAccess';

describe('AUD-001: privileged account access', () => {
  it('denies blocked accounts even when a lookup succeeds', async () => {
    expect(await hasActiveAccount(async () => ({ data: { status: 'blocked' }, error: null }))).toBe(false);
  });
  it('allows an active account', async () => {
    expect(await hasActiveAccount(async () => ({ data: { status: 'active' }, error: null }))).toBe(true);
  });
  it('fails closed for missing accounts and unavailable status lookups', async () => {
    expect(await hasActiveAccount(async () => ({ data: null, error: null }))).toBe(false);
    expect(await hasActiveAccount(async () => ({ data: { status: 'active' }, error: new Error('unavailable') }))).toBe(false);
    expect(await hasActiveAccount(async () => { throw new Error('offline'); })).toBe(false);
  });
});