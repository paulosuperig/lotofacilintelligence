import { TOTAL_NUMBERS, BANDS } from '../constants';
import type { Rng } from './rng';
import type { GenStrategy } from './types';

export interface StrategyConfig {
  /** peso da frequência (favorece "quentes") na amostragem */
  freqW: number;
  /** peso do atraso (favorece "atrasadas") na amostragem */
  atrasoW: number;
  /** viés do alvo de repetidas do último concurso */
  repeatBias: 'high' | 'mid' | 'low';
}

const STRATEGY: Record<GenStrategy, StrategyConfig> = {
  equilibrada: { freqW: 0.6, atrasoW: 0.25, repeatBias: 'mid' },
  quentes: { freqW: 1.1, atrasoW: 0.1, repeatBias: 'mid' },
  atrasadas: { freqW: 0.15, atrasoW: 1.1, repeatBias: 'mid' },
  repetidas: { freqW: 0.6, atrasoW: 0.25, repeatBias: 'high' },
  ciclo: { freqW: 0.4, atrasoW: 0.8, repeatBias: 'low' },
  agressiva: { freqW: 0.25, atrasoW: 0.7, repeatBias: 'low' },
  // Surpresinha: pesos uniformes; o caminho dedicado ignora esta config.
  surpresinha: { freqW: 0, atrasoW: 0, repeatBias: 'mid' },
};

/** Alvo de dezenas repetidas do último concurso, conforme o viés da estratégia. */
export const repeatTargetFor = (strategy: GenStrategy, rng: Rng): number => {
  const { idealMin, idealMax } = BANDS.repetidas;
  const span = idealMax - idealMin;
  const bias = STRATEGY[strategy].repeatBias;
  const jitter = Math.floor(rng() * Math.min(2, span + 1));
  if (bias === 'high') return idealMax - jitter;
  if (bias === 'low') return idealMin + jitter;
  return idealMin + Math.floor(rng() * (span + 1));
};

/** Normaliza uma lista de dezenas para inteiros válidos e únicos (1..25). */
export const cleanDezenas = (arr?: number[] | null): number[] =>
  Array.from(new Set((arr ?? []).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMBERS)));
