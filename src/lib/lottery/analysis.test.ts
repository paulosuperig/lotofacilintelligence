import { describe, it, expect } from 'vitest';
import { analyzeHistory, normalizeDraw } from './analysis';

describe('normalizeDraw', () => {
  it('parses strings, dedups and sorts', () => {
    expect(normalizeDraw(['05', '01', '01', 3, '25', '30', '0'])).toEqual([1, 3, 5, 25]);
  });
  it('handles empty/nullish', () => {
    expect(normalizeDraw(undefined)).toEqual([]);
    expect(normalizeDraw([])).toEqual([]);
  });
});

describe('analyzeHistory', () => {
  // 3 concursos (mais recente primeiro). Dezena 1 aparece em todos.
  const draws = [
    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'], // recente
    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '16'],
    ['01', '17', '18', '19', '20', '21', '22', '23', '24', '25', '11', '12', '13', '14', '15'], // antigo
  ];

  it('counts frequency correctly', () => {
    const a = analyzeHistory(draws, { newestFirst: true, topN: 5 });
    expect(a.totalConcursos).toBe(3);
    expect(a.porNumero[1].frequencia).toBe(3);
    expect(a.porNumero[1].percentual).toBe(1);
    expect(a.porNumero[15].frequencia).toBe(2); // recente + antigo
  });

  it('computes atraso (0 means drawn in latest)', () => {
    const a = analyzeHistory(draws, { newestFirst: true });
    expect(a.porNumero[1].atraso).toBe(0); // saiu no mais recente
    // dezena 16 saiu só no penúltimo (index 1 a partir do fim) => atraso 1
    expect(a.porNumero[16].atraso).toBe(1);
    // dezena 17 saiu só no mais antigo => atraso 2
    expect(a.porNumero[17].atraso).toBe(2);
  });

  it('sets ultimoSorteio to the most recent draw', () => {
    const a = analyzeHistory(draws, { newestFirst: true });
    expect(a.ultimoSorteio).toEqual(normalizeDraw(draws[0]));
  });

  it('ranks hot numbers by frequency', () => {
    const a = analyzeHistory(draws, { newestFirst: true, topN: 3 });
    expect(a.quentes).toContain(1);
    expect(a.quentes.length).toBe(3);
  });

  it('handles empty history', () => {
    const a = analyzeHistory([], {});
    expect(a.totalConcursos).toBe(0);
    expect(a.descartados).toBe(0);
    expect(a.ultimoSorteio).toBeNull();
  });

  it('descarta concursos malformados (robustez)', () => {
    const malformado = ['01', '02', '03']; // só 3 dezenas
    const valido = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
    const a = analyzeHistory([valido, malformado, valido], { newestFirst: true });
    expect(a.totalConcursos).toBe(2); // apenas os válidos
    expect(a.descartados).toBe(1);
  });
});
