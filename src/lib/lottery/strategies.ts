import type { GenStrategy } from './generator';

export const STRATEGY_DEFINITIONS: { value: GenStrategy; label: string; hint: string }[] = [
  { value: 'equilibrada', label: 'Equilibrada', hint: 'Todas as métricas na faixa ideal' },
  { value: 'quentes', label: 'Quentes', hint: 'Prioriza as dezenas mais frequentes' },
  { value: 'atrasadas', label: 'Atrasadas', hint: 'Peso às dezenas de maior atraso' },
  { value: 'repetidas', label: 'Repetidas', hint: 'Âncora forte no último concurso' },
  { value: 'ciclo', label: 'Ciclo', hint: 'Cobre as ausentes do último concurso' },
  { value: 'agressiva', label: 'Agressiva', hint: 'Mais diversificação e risco' },
  { value: 'surpresinha', label: 'Surpresinha', hint: 'Aleatório puro, como a geração oficial da Caixa' },
];

export const STRATEGIES_SEM_FILTRO = new Set<GenStrategy>(['surpresinha']);

export const strategyLabel = (strategy: GenStrategy): string =>
  STRATEGY_DEFINITIONS.find((definition) => definition.value === strategy)?.label ?? '';
