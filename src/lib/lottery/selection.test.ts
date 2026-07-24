import { describe, it, expect } from 'vitest';
import {
  cycleDezena,
  dezenaState,
  emptySelection,
  MAX_FIXED,
  MAX_EXCLUDED,
} from './selection';

describe('cycleDezena', () => {
  it('cicla neutra → fixa → excluída → neutra', () => {
    let sel = emptySelection();
    sel = cycleDezena(sel, 7);
    expect(dezenaState(sel, 7)).toBe('fixed');
    sel = cycleDezena(sel, 7);
    expect(dezenaState(sel, 7)).toBe('excluded');
    sel = cycleDezena(sel, 7);
    expect(dezenaState(sel, 7)).toBe('neutral');
  });

  it('mantém as listas ordenadas', () => {
    let sel = emptySelection();
    for (const n of [10, 3, 25, 1]) sel = cycleDezena(sel, n);
    expect(sel.fixed).toEqual([1, 3, 10, 25]);
  });

  it('ignora dezenas fora de 1..25', () => {
    const sel = cycleDezena(emptySelection(), 30);
    expect(sel).toEqual(emptySelection());
  });

  it('respeita o teto de fixas (pula direto para excluída)', () => {
    let sel = emptySelection();
    // fixa 1..14 (MAX_FIXED)
    for (let n = 1; n <= MAX_FIXED; n++) sel = cycleDezena(sel, n);
    expect(sel.fixed).toHaveLength(MAX_FIXED);
    // a 15ª dezena não vira fixa: vai para excluída
    sel = cycleDezena(sel, 15);
    expect(dezenaState(sel, 15)).toBe('excluded');
  });

  it('respeita o teto de excluídas', () => {
    let sel = emptySelection();
    // exclui 1..10 (cada uma: neutra→fixa→excluída = 2 toques)
    for (let n = 1; n <= MAX_EXCLUDED; n++) {
      sel = cycleDezena(sel, n); // fixa
      sel = cycleDezena(sel, n); // excluída
    }
    expect(sel.excluded).toHaveLength(MAX_EXCLUDED);
    // a 11ª tentativa de excluir não entra: fica fixa (fila cheia de excluídas)
    sel = cycleDezena(sel, 11); // fixa
    sel = cycleDezena(sel, 11); // tentaria excluída, mas está cheio → continua fixa
    expect(dezenaState(sel, 11)).toBe('fixed');
  });

  it('remover uma fixa/excluída libera espaço', () => {
    let sel = emptySelection();
    sel = cycleDezena(sel, 5); // fixa
    sel = cycleDezena(sel, 5); // excluída
    sel = cycleDezena(sel, 5); // neutra
    expect(sel).toEqual(emptySelection());
  });
});
