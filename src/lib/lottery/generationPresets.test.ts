import { describe, it, expect } from 'vitest';
import {
  filtersFromSelection,
  hasActiveFilters,
  EMPTY_FILTER_SELECTION,
} from './generationPresets';

describe('filtersFromSelection', () => {
  it('sem seleção → nenhum filtro', () => {
    expect(filtersFromSelection(EMPTY_FILTER_SELECTION)).toEqual({});
  });

  it('combina os presets ativos de cada grupo', () => {
    const f = filtersFromSelection({ soma: 'ideal', paridade: 'pares', primos: 'ideal', sequencia: 'curta' });
    expect(f).toEqual({ sumMin: 180, sumMax: 210, paresMin: 8, primosMin: 4, primosMax: 6, seqMax: 3 });
  });

  it('"+ ímpares" limita os pares por cima', () => {
    expect(filtersFromSelection({ ...EMPTY_FILTER_SELECTION, paridade: 'impares' })).toEqual({ paresMax: 7 });
  });

  it('sequência "média" mapeia para seqMax 5', () => {
    expect(filtersFromSelection({ ...EMPTY_FILTER_SELECTION, sequencia: 'media' })).toEqual({ seqMax: 5 });
  });

  it('chave inexistente é ignorada', () => {
    expect(filtersFromSelection({ soma: 'zzz', paridade: 'any', primos: 'any', sequencia: 'any' })).toEqual({});
  });
});

describe('hasActiveFilters', () => {
  it('false quando tudo é "any"', () => {
    expect(hasActiveFilters(EMPTY_FILTER_SELECTION)).toBe(false);
  });
  it('true quando algum grupo está selecionado', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTER_SELECTION, soma: 'alta' })).toBe(true);
  });
});
