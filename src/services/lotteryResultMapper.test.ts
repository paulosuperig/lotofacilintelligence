import { describe, expect, it } from 'vitest';
import { extractDezenas, normalizeResult } from './lotteryResultMapper';

describe('lottery response mapping compatibility', () => {
  it('preserves primary aliases and schema field stripping', () => {
    expect(normalizeResult({ concurso: 3000, data: '10/10/2026', dezenas: ['01'], valor_estimado: 100, proximo_concurso: 3001, unrelated: true })).toEqual({
      concurso: 3000, data: '10/10/2026', dezenas: ['01'], valorEstimadoProximoConcurso: 100, valor_estimado: 100, proximoConcurso: 3001,
    });
  });
  it('preserves official field mapping without adding fields', () => {
    expect(normalizeResult({ numero: 3000, dataApuracao: '10/10/2026', listaDezenas: ['01'], acumulado: false, numeroConcursoProximo: 3001, valorEstimadoProximoConcurso: 100 })).toEqual({
      concurso: 3000, data: '10/10/2026', dezenas: ['01'], acumulou: false, proximoConcurso: 3001, valorEstimadoProximoConcurso: 100,
    });
  });
  it('extracts both draw formats and retains malformed response failures', () => {
    expect(extractDezenas({ dezenas: ['01', 2] })).toEqual(['01', 2]);
    expect(extractDezenas({ listaDezenas: ['03'] })).toEqual(['03']);
    expect(extractDezenas(null)).toEqual([]);
    expect(() => normalizeResult(null)).toThrow();
  });
});