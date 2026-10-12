import type { HistoryAnalysis } from './analysis';

/**
 * Monta um pool de `size` dezenas priorizando as mais quentes e as mais
 * atrasadas do histórico (estratégia data-driven). Sem histórico, usa um pool
 * pseudo-aleatório criptográfico.
 */
export const buildPool = (size: number, analysis: HistoryAnalysis | null): number[] => {
  const pool = new Set<number>();
  if (analysis && analysis.totalConcursos > 0) {
    for (const n of analysis.quentes) { if (pool.size < size) pool.add(n); }
    for (const n of analysis.atrasadas) { if (pool.size < size) pool.add(n); }
    // completa por ranking de frequência
    for (const s of analysis.ranking) { if (pool.size < size) pool.add(s.numero); }
  }
  // fallback: completa aleatoriamente até o tamanho
  while (pool.size < size) {
    const buf = new Uint32Array(1);
    if (typeof globalThis.crypto?.getRandomValues === 'function') globalThis.crypto.getRandomValues(buf);
    else buf[0] = Math.floor(Math.random() * 0x100000000);
    pool.add((buf[0] % 25) + 1);
  }
  return Array.from(pool).sort((a, b) => a - b);
};

