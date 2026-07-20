import { describe, it, expect } from 'vitest';
import { UserSchema, SavedGameSchema, LotteryResultSchema } from './schemas';

/**
 * P1 — Validação de dados externos (perfil de usuário, jogos salvos e resposta
 * da API da loteria). O schema é a fronteira de confiança: dado que não passa
 * aqui nunca deve entrar no estado da aplicação.
 */
describe('UserSchema', () => {
  it('aceita usuário válido', () => {
    const r = UserSchema.safeParse({ email: 'a@b.com', role: 'admin' });
    expect(r.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const r = UserSchema.safeParse({ email: 'not-an-email', role: 'demo' });
    expect(r.success).toBe(false);
  });

  it('rejeita role fora do enum', () => {
    const r = UserSchema.safeParse({ email: 'a@b.com', role: 'superuser' });
    expect(r.success).toBe(false);
  });
});

describe('SavedGameSchema', () => {
  const base = {
    id: 'abc',
    numbers: Array.from({ length: 15 }, (_, i) => i + 1),
    timestamp: Date.now(),
  };

  it('aceita jogo com 15 dezenas válidas', () => {
    expect(SavedGameSchema.safeParse(base).success).toBe(true);
  });

  it('rejeita jogo com menos de 15 dezenas', () => {
    const r = SavedGameSchema.safeParse({ ...base, numbers: [1, 2, 3] });
    expect(r.success).toBe(false);
  });

  it('rejeita dezena fora da faixa [1,25]', () => {
    const bad = [...base.numbers.slice(0, 14), 30];
    const r = SavedGameSchema.safeParse({ ...base, numbers: bad });
    expect(r.success).toBe(false);
  });

  it('rejeita dezena zero', () => {
    const bad = [...base.numbers.slice(0, 14), 0];
    const r = SavedGameSchema.safeParse({ ...base, numbers: bad });
    expect(r.success).toBe(false);
  });
});

describe('LotteryResultSchema', () => {
  it('aceita resultado da API com dezenas', () => {
    const r = LotteryResultSchema.safeParse({
      concurso: 3000,
      data: '20/07/2026',
      dezenas: ['01', '02', '03'],
      acumulou: false,
    });
    expect(r.success).toBe(true);
  });

  it('rejeita resultado sem campo obrigatório "data"', () => {
    const r = LotteryResultSchema.safeParse({ concurso: 3000, dezenas: [] });
    expect(r.success).toBe(false);
  });
});
