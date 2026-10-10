import { describe, expect, it } from 'vitest';
import { executeLotteryTask } from './workerTasks';
import { runBacktest } from './backtest';

describe('lottery task execution preserves existing algorithms', () => {
  it('preserves fixed and excluded numbers in a single game', () => {
    const result = executeLotteryTask({ kind: 'game', options: { fixed: Array.from({ length: 15 }, (_, i) => i + 1), excluded: [25] } });
    if (!('numbers' in result)) throw new Error('Unexpected result');
    expect(result.numbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(result.sum).toBe(120);
  });
  it('keeps batch size and composition constraints unchanged', () => {
    const result = executeLotteryTask({ kind: 'batch', options: { count: 5, strategy: 'surpresinha', fixed: [5, 10], excluded: [23] } });
    if (!Array.isArray(result)) throw new Error('Unexpected result');
    expect(result).toHaveLength(5);
    for (const game of result) {
      expect(new Set(game.numbers).size).toBe(15);
      expect(game.numbers).toEqual(expect.arrayContaining([5, 10]));
      expect(game.numbers).not.toContain(23);
    }
  });
  it('returns exactly the same deterministic backtest report', () => {
    const draws = Array.from({ length: 70 }, (_, draw) => Array.from({ length: 15 }, (_, i) => (i + draw) % 25 + 1));
    const options = { gamesPerDraw: 2, minHistory: 50, maxDraws: 10, candidates: 18 };
    expect(executeLotteryTask({ kind: 'backtest', draws, options })).toEqual(runBacktest(draws, options));
  });
});