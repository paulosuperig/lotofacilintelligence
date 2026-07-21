import { describe, it, expect } from 'vitest';
import { sanitizeAiGamesDetailed, INCOMPLETE_MARKER } from './sanitizeGames';

// Jogo plenamente saudável (soma 181, 6 pares, 5 primos, moldura 10, seq 3).
const HEALTHY = 'Jogo 01: 01, 03, 04, 06, 07, 09, 10, 11, 13, 14, 16, 18, 21, 23, 25';
// Jogo com soma muito alta (todas as dezenas altas) — fora da faixa saudável.
const HIGH_SUM = 'Jogo 02: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25';

describe('sanitizeAiGamesDetailed', () => {
  it('detecta os jogos e anexa a conferência automática do sistema', () => {
    const res = sanitizeAiGamesDetailed(`### JOGOS\n${HEALTHY}\n${HIGH_SUM}`);
    expect(res.gamesFound).toBe(2);
    expect(res.content).toContain('Conferência automática');
    expect(res.content).toContain('| 1 |');
    expect(res.content).toContain('| 2 |');
  });

  it('marca ✅ o jogo saudável e ⚠️ o fora da faixa', () => {
    const res = sanitizeAiGamesDetailed(`${HEALTHY}\n${HIGH_SUM}`);
    expect(res.unhealthy).toBe(1);
    expect(res.content).toContain('✅');
    expect(res.content).toContain('⚠️');
  });

  it('não confunde linhas de análise (menos de 15 dezenas) com jogos', () => {
    const res = sanitizeAiGamesDetailed('Dezenas quentes: 05, 10, 18, 23, 25 e atrasadas: 03, 07.');
    expect(res.gamesFound).toBe(0);
    expect(res.content).not.toContain('Conferência automática');
  });

  it('mantém o jogo LIMPO dentro do code block (só dezenas + soma)', () => {
    const res = sanitizeAiGamesDetailed(HEALTHY);
    // dentro do bloco não deve haver texto de métrica que poluiria a extração
    const block = res.content.split('```')[1];
    expect(block).toContain('01, 03, 04');
    expect(block).toContain('soma 181');
    expect(block).not.toMatch(/primos|moldura/i);
  });

  it('sinaliza resposta incompleta quando faltam jogos', () => {
    const res = sanitizeAiGamesDetailed(HEALTHY, { quantidade: 3 });
    expect(res.incomplete).toBe(true);
    expect(res.content).toContain(INCOMPLETE_MARKER);
  });

  it('conta jogos fora do filtro de soma do usuário', () => {
    // soma do jogo saudável é 181; pedimos mínimo 190 → fora do filtro
    const res = sanitizeAiGamesDetailed(HEALTHY, { somaMin: 190 });
    expect(res.outOfRangeSums).toBe(1);
    expect(res.content).toContain('fora do filtro de soma');
  });

  it('computa repetidas quando o último concurso é informado', () => {
    const previousDraw = [1, 3, 4, 6, 7, 9, 10, 11, 13, 14, 16, 18, 21, 23, 25];
    const res = sanitizeAiGamesDetailed(HEALTHY, undefined, previousDraw);
    // com todas as 15 repetidas, a coluna Rep aparece e o jogo vira ⚠️
    expect(res.content).toContain('Rep');
    expect(res.unhealthy).toBe(1);
  });

  it('não fabrica dezenas: string vazia retorna sem jogos', () => {
    const res = sanitizeAiGamesDetailed('');
    expect(res.gamesFound).toBe(0);
    expect(res.content).toBe('');
  });
});
