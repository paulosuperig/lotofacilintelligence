/**
 * Seleção de dezenas fixas/excluídas pelo usuário (estado do volante do gerador).
 * Lógica pura e testável: um toque cicla a dezena por neutra → fixa → excluída.
 *
 * Limites garantem que o gerador sempre consiga formar um jogo válido:
 *  - fixas ≤ 14 (deixa ao menos 1 dezena livre para variar);
 *  - excluídas ≤ 10 (mantém o pool com ≥ 15 dezenas disponíveis).
 */
import { TOTAL_NUMBERS, NUMBERS_PER_GAME } from './constants';

export const MAX_FIXED = NUMBERS_PER_GAME - 1; // 14
export const MAX_EXCLUDED = TOTAL_NUMBERS - NUMBERS_PER_GAME; // 10

export type DezenaState = 'neutral' | 'fixed' | 'excluded';

export interface Selection {
  fixed: number[];
  excluded: number[];
}

export const emptySelection = (): Selection => ({ fixed: [], excluded: [] });

const sorted = (arr: number[]): number[] => [...arr].sort((a, b) => a - b);

/** Estado atual de uma dezena na seleção. */
export const dezenaState = (sel: Selection, n: number): DezenaState => {
  if (sel.fixed.includes(n)) return 'fixed';
  if (sel.excluded.includes(n)) return 'excluded';
  return 'neutral';
};

/**
 * Cicla o estado de uma dezena: neutra → fixa → excluída → neutra.
 * Respeita os limites: se a próxima fase estiver cheia, pula para a seguinte.
 */
export const cycleDezena = (sel: Selection, n: number): Selection => {
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_NUMBERS) return sel;
  const state = dezenaState(sel, n);

  if (state === 'fixed') {
    // fixa → excluída (se houver espaço); se as excluídas estão cheias, mantém
    // a fixa (não "perde" a seleção do usuário silenciosamente).
    if (sel.excluded.length < MAX_EXCLUDED) {
      return { fixed: sel.fixed.filter((x) => x !== n), excluded: sorted([...sel.excluded, n]) };
    }
    return sel;
  }

  if (state === 'excluded') {
    // excluída → neutra
    return { fixed: sel.fixed, excluded: sel.excluded.filter((x) => x !== n) };
  }

  // neutra → fixa (se houver espaço), senão excluída (se houver espaço), senão neutra
  if (sel.fixed.length < MAX_FIXED) {
    return { fixed: sorted([...sel.fixed, n]), excluded: sel.excluded };
  }
  if (sel.excluded.length < MAX_EXCLUDED) {
    return { fixed: sel.fixed, excluded: sorted([...sel.excluded, n]) };
  }
  return sel;
};
