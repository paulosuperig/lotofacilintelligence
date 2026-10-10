import { describe, expect, it } from 'vitest';
import { mapHistoryRow } from './historyMapper';

describe('saved game mapping parity', () => {
  const row = { id: 'db-id', numbers: [1, 2, 3], created_at: '2026-10-10T18:00:00Z', sum_value: null, model_name: null, type: '' };
  it('preserves nullable fields and the existing default type', () => {
    expect(mapHistoryRow(row)).toEqual({
      id: 'db-id', numbers: [1, 2, 3], timestamp: 1791655200000,
      sum: undefined, model: undefined, type: 'IA Insight',
    });
  });
  it('preserves the model fallback and a zero sum', () => {
    expect(mapHistoryRow({ ...row, model_name: 'modelo', sum_value: 0 })).toMatchObject({
      type: 'Fechamento PRO', model: 'modelo', sum: 0,
    });
  });
  it('keeps an explicit type instead of applying the model fallback', () => {
    expect(mapHistoryRow({ ...row, type: 'Gerador Equilibrada', model_name: 'modelo' }).type).toBe('Gerador Equilibrada');
  });
});