import { describe, it, expect } from 'vitest';
import { canPrefetch } from './idlePrefetch';
describe('canPrefetch', () => {
  it('blocks prefetch with Save-Data', () => expect(canPrefetch({ connection: { saveData: true } })).toBe(false));
  it('blocks prefetch on 2g', () => expect(canPrefetch({ connection: { effectiveType: 'slow-2g' } })).toBe(false));
  it('allows prefetch on 4g', () => expect(canPrefetch({ connection: { effectiveType: '4g' } })).toBe(true));
});
