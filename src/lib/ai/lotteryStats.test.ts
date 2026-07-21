import { describe, it, expect } from 'vitest';
import { formatAnalysisForPrompt } from './lotteryStats';
import { analyzeHistory } from '@/lib/lottery/analysis';

const draw = (nums: number[]) => nums.map((n) => String(n).padStart(2, '0'));

describe('formatAnalysisForPrompt', () => {
  it('indica indisponibilidade quando não há análise', () => {
    expect(formatAnalysisForPrompt(null)).toContain('indisponíveis');
  });

  it('injeta dados reais (quentes, atrasadas, pares) no prompt', () => {
    const draws = [
      draw([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
      draw([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]),
      draw([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17]),
    ];
    const analysis = analyzeHistory(draws, { newestFirst: true });
    const out = formatAnalysisForPrompt(analysis);

    expect(out).toContain('DADOS_HISTORICOS_REAIS');
    expect(out).toContain('QUENTES');
    expect(out).toContain('ATRASADAS');
    expect(out).toContain('PARES');
    expect(out).toContain('3 concursos'); // total analisado
    // não deve pedir para inventar
    expect(out).toContain('não invente');
  });
});
