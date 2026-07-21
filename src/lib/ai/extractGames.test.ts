import { describe, it, expect } from 'vitest';
import { extractGameFromLine, extractGamesFromText, isGameLine } from './extractGames';

describe('extractGameFromLine', () => {
  it('extrai jogo removendo o rótulo "Jogo NN:"', () => {
    const g = extractGameFromLine('Jogo 16: 01, 02, 05, 08, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25 (soma 216)');
    expect(g).toEqual([1, 2, 5, 8, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25]);
    // o "16" do rótulo NÃO entra no jogo (senão dropava a dezena 25)
    expect(g).not.toContain(16);
  });

  it('funciona com string limpa de 15 números (salvar este jogo)', () => {
    const g = extractGameFromLine('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25');
    expect(g).toHaveLength(15);
  });

  it('ignora a soma (3 dígitos) e não polui as dezenas', () => {
    const g = extractGameFromLine('Jogo 01) 03 05 07 08 09 10 12 13 15 18 19 20 22 24 25 (soma 210)');
    expect(g).toHaveLength(15);
    expect(g).not.toContain(21); // 210 não deve virar "21"/"0"
  });

  it('retorna null para linha de análise (menos de 15 dezenas)', () => {
    expect(extractGameFromLine('Dezenas quentes (05, 10, 18, 23, 25) e atrasadas (03, 07, 14).')).toBeNull();
  });

  it('retorna null para texto sem números', () => {
    expect(extractGameFromLine('Boa sorte!')).toBeNull();
  });
});

describe('extractGamesFromText', () => {
  const content = `### ANÁLISE
Soma do último concurso: 195. 8 pares / 7 ímpares. Quentes: 05, 10, 18, 23, 25.

### JOGOS
\`\`\`
Jogo 01: 01, 02, 05, 08, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25 (soma 216)
\`\`\`
\`\`\`
Jogo 02: 02, 03, 04, 06, 07, 09, 11, 12, 15, 16, 18, 19, 20, 24, 25 (soma 191)
\`\`\`
Lembre-se: a Lotofácil é um jogo de azar.`;

  it('extrai exatamente os jogos, ignorando a análise', () => {
    const games = extractGamesFromText(content);
    expect(games).toHaveLength(2);
    expect(games[0]).toEqual([1, 2, 5, 8, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25]);
    games.forEach((g) => expect(new Set(g).size).toBe(15));
  });

  it('deduplica jogos idênticos', () => {
    const dup = content + '\n```\nJogo 03: 01, 02, 05, 08, 10, 11, 13, 14, 17, 20, 21, 22, 23, 24, 25\n```';
    expect(extractGamesFromText(dup)).toHaveLength(2);
  });

  it('retorna vazio quando não há jogos', () => {
    expect(extractGamesFromText('Nenhum jogo aqui, só 05 e 10.')).toEqual([]);
  });
});

describe('isGameLine', () => {
  it('detecta linha de jogo e rejeita análise', () => {
    expect(isGameLine('01 02 05 08 10 11 13 14 17 20 21 22 23 24 25')).toBe(true);
    expect(isGameLine('Soma 195, 8 pares')).toBe(false);
  });
});
