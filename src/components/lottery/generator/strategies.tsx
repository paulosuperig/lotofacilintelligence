import React from 'react';
import { Dice5, Flame, Orbit, Repeat, Scale, Shuffle, Snowflake } from 'lucide-react';
import type { GenStrategy } from '@/lib/lottery/generator';

export interface StrategyOption {
  value: GenStrategy;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

/** Estratégias disponíveis no gerador — espelham as do Intelligence AI. */
export const STRATEGIES: StrategyOption[] = [
  { value: 'equilibrada', label: 'Equilibrada', hint: 'Todas as métricas na faixa ideal', icon: <Scale size={15} /> },
  { value: 'quentes', label: 'Quentes', hint: 'Prioriza as dezenas mais frequentes', icon: <Flame size={15} /> },
  { value: 'atrasadas', label: 'Atrasadas', hint: 'Peso às dezenas de maior atraso', icon: <Snowflake size={15} /> },
  { value: 'repetidas', label: 'Repetidas', hint: 'Âncora forte no último concurso', icon: <Repeat size={15} /> },
  { value: 'ciclo', label: 'Ciclo', hint: 'Cobre as ausentes do último concurso', icon: <Orbit size={15} /> },
  { value: 'agressiva', label: 'Agressiva', hint: 'Mais diversificação e risco', icon: <Dice5 size={15} /> },
  {
    value: 'surpresinha',
    label: 'Surpresinha',
    hint: 'Aleatório puro, como a geração oficial da Caixa',
    icon: <Shuffle size={15} />,
  },
];

/** Estratégias que ignoram os filtros avançados (geração puramente aleatória). */
export const STRATEGIES_SEM_FILTRO = new Set<GenStrategy>(['surpresinha']);

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
