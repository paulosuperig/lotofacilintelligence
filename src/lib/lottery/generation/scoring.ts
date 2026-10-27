import { BANDS, type BandKey } from '../constants';
import { computeGameMetrics } from '../metrics';

/** Distância normalizada de um valor à faixa ideal (0 = dentro do ideal). */
const idealPenalty = (value: number, key: BandKey): number => {
  const b = BANDS[key];
  if (value >= b.idealMin && value <= b.idealMax) return 0;
  const span = Math.max(b.max - b.min, 1);
  if (value < b.idealMin) return (b.idealMin - value) / span;
  return (value - b.idealMax) / span;
};

/**
 * Fitness de um jogo: 1.0 quando todas as métricas estão na faixa IDEAL,
 * caindo proporcionalmente conforme se afastam. Jogos fora da faixa aceitável
 * (min..max) recebem penalidade extra.
 */
export const scoreGame = (nums: number[], previousDraw?: number[] | null): number => {
  const m = computeGameMetrics(nums, previousDraw);
  const checks: Array<[number, BandKey]> = [
    [m.soma, 'soma'],
    [m.pares, 'pares'],
    [m.primos, 'primos'],
    [m.moldura, 'moldura'],
    [m.sequencia, 'sequencia'],
  ];
  if (m.repetidas != null) checks.push([m.repetidas, 'repetidas']);

  let penalty = 0;
  for (const [value, key] of checks) {
    const b = BANDS[key];
    penalty += idealPenalty(value, key);
    if (value < b.min || value > b.max) penalty += 1; // fora do aceitável: pesa mais
  }
  const score = 1 - penalty / checks.length;
  return Math.max(0, Math.min(1, score));
};
