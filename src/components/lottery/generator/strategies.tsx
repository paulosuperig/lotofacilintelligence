import React from 'react';
import { Dice5, Flame, Orbit, Repeat, Scale, Shuffle, Snowflake } from 'lucide-react';
import { STRATEGY_DEFINITIONS } from '@/lib/lottery/strategies';
import type { GenStrategy } from '@/lib/lottery/generator';

export interface StrategyOption {
  value: GenStrategy;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const STRATEGY_ICONS: Record<GenStrategy, React.ReactNode> = {
  equilibrada: <Scale size={15} />,
  quentes: <Flame size={15} />,
  atrasadas: <Snowflake size={15} />,
  repetidas: <Repeat size={15} />,
  ciclo: <Orbit size={15} />,
  agressiva: <Dice5 size={15} />,
  surpresinha: <Shuffle size={15} />,
};

export const STRATEGIES: StrategyOption[] = STRATEGY_DEFINITIONS.map((definition) => ({
  ...definition,
  icon: STRATEGY_ICONS[definition.value],
}));
export { STRATEGIES_SEM_FILTRO } from '@/lib/lottery/strategies';

/** Quantidades disponíveis para geração em lote. */
export const BATCH_SIZES = [3, 5, 10, 15] as const;

export interface QualityInfo {
  pct: number;
  label: string;
  cls: string;
}

/**
 * Rótulo honesto da qualidade do jogo. É ADERÊNCIA às faixas estatísticas
 * (equilíbrio), NÃO chance de ganhar — a probabilidade do sorteio é fixa.
 */
export const qualityInfo = (q?: number): QualityInfo | null => {
  if (q == null) return null;
  const pct = Math.round(Math.max(0, Math.min(1, q)) * 100);
  if (pct >= 90)
    return { pct, label: 'Excelente aderência', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' };
  if (pct >= 75)
    return { pct, label: 'Ótima aderência', cls: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' };
  if (pct >= 60)
    return { pct, label: 'Boa aderência', cls: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' };
  return { pct, label: 'Aderência moderada', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };
};

/** Estilo compartilhado pelos botões de opção (estratégia e tamanho do lote). */
export const pickerButtonClass = (active: boolean) =>
  active
    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700';
