import { describe, expect, it } from 'vitest';
import { gameSignature } from './gameSignature';
import { gameSignature as compatibilitySignature } from './generator';

describe('canonical game identity', () => {
  it('is order independent and never changes the original numbers', () => {
    const numbers = [25, 2, 11, 1];
    expect(gameSignature(numbers)).toBe('1,2,11,25');
    expect(numbers).toEqual([25, 2, 11, 1]);
    expect(gameSignature([1, 2, 11, 25])).toBe(gameSignature(numbers));
  });
  it('preserves the existing generator export and distinct combinations', () => {
    expect(compatibilitySignature).toBe(gameSignature);
    expect(gameSignature([1, 2])).not.toBe(gameSignature([1, 3]));
  });
});