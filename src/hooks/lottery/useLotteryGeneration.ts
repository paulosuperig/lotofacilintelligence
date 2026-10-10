import { useCallback } from 'react';
import { generateSecureId } from '@/lib/security/utils';
import { gameSignature, type GenStrategy } from '@/lib/lottery/generator';
import { runLotteryTask } from '@/lib/lottery/runTask';
import { normalizeDraw, type HistoryAnalysis } from '@/lib/lottery/analysis';
import { LotteryResult, SmartOptions, SavedGame } from '@/types/lottery';

const STRATEGY_LABEL: Record<GenStrategy, string> = {
  equilibrada: 'Equilibrada',
  quentes: 'Quentes',
  atrasadas: 'Atrasadas',
  repetidas: 'Repetidas',
  ciclo: 'Ciclo',
  agressiva: 'Agressiva',
  surpresinha: 'Surpresinha',
};

const pickFilters = (o: SmartOptions) => ({
  sumMin: o.sumMin,
  sumMax: o.sumMax,
  paresMin: o.paresMin,
  paresMax: o.paresMax,
  primosMin: o.primosMin,
  primosMax: o.primosMax,
  seqMax: o.seqMax,
});

export const useLotteryGeneration = (
  history: SavedGame[],
  latestResult: LotteryResult | null,
  analysis: HistoryAnalysis | null
) => {
  const generateSmartGame = useCallback(async (opts: SmartOptions = {}, signal?: AbortSignal) => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const result = await runLotteryTask({ kind: 'game', options: {
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    } }, signal);

    const label = STRATEGY_LABEL[strategy];
    return {
      id: generateSecureId(),
      numbers: result.numbers,
      timestamp: Date.now(),
      sum: result.sum,
      quality: result.score,
      type: result.dataDriven ? `Gerador ${label} (dados)` : `Gerador ${label}`,
    };
  }, [history, analysis, latestResult]);

  const generateSmartBatch = useCallback(async (count: number, opts: SmartOptions = {}, signal?: AbortSignal): Promise<SavedGame[]> => {
    const avoid = new Set(history.map(g => gameSignature(g.numbers)));
    const previousDraw = latestResult ? normalizeDraw(latestResult.dezenas) : null;
    const strategy = opts.strategy ?? 'equilibrada';

    const games = await runLotteryTask({ kind: 'batch', options: {
      count,
      analysis,
      previousDraw,
      avoid,
      strategy,
      fixed: opts.fixed,
      excluded: opts.excluded,
      ...pickFilters(opts),
    } }, signal);
    const label = STRATEGY_LABEL[strategy];
    return games.map((g) => ({
      id: generateSecureId(),
      numbers: g.numbers,
      timestamp: Date.now(),
      sum: g.sum,
      quality: g.score,
      type: g.dataDriven ? `Lote ${label} (dados)` : `Lote ${label}`,
    }));
  }, [history, analysis, latestResult]);

  return {
    generateSmartGame,
    generateSmartBatch,
  };
};
