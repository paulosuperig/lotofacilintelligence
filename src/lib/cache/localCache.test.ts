import { describe, it, expect, beforeEach } from 'vitest';
import { readCache, writeCache } from './localCache';

describe('localCache', () => {
  beforeEach(() => localStorage.clear());

  it('grava e lê o mesmo dado', () => {
    writeCache('k', { a: 1, b: [2, 3] });
    expect(readCache<{ a: number; b: number[] }>('k')?.data).toEqual({ a: 1, b: [2, 3] });
  });

  it('retorna null para chave ausente', () => {
    expect(readCache('nao-existe')).toBeNull();
  });

  it('retorna null para JSON corrompido', () => {
    localStorage.setItem('bad', '{não é json');
    expect(readCache('bad')).toBeNull();
  });

  it('marca stale quando passa do maxAge', () => {
    writeCache('k', 42);
    const fresh = readCache<number>('k', 60_000);
    expect(fresh?.stale).toBe(false);
    // maxAge 0 → qualquer idade é considerada expirada
    const stale = readCache<number>('k', 0);
    expect(stale?.stale).toBe(true);
    expect(stale?.data).toBe(42); // ainda utilizável como fallback
  });

  it('sem maxAge nunca é stale (dado imutável)', () => {
    writeCache('imut', 'x');
    expect(readCache<string>('imut')?.stale).toBe(false);
  });
});
