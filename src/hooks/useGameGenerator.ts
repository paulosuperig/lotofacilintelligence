import { useEffect, useMemo, useRef, useState } from 'react';
import type { GenStrategy } from '@/lib/lottery/generator';
import { useToast } from './use-toast';
import { useLottery } from './useLottery';
import type { SavedGame } from '@/types/lottery';
import { calculateGameStats } from '@/lib/lottery/stats';
import { formatInlinePlain } from '@/lib/whatsapp';
import { trackCustom, trackEvent } from '@/lib/analytics/metaPixel';
import { emptySelection, type Selection } from '@/lib/lottery/selection';
import { filtersFromSelection, hasActiveFilters, EMPTY_FILTER_SELECTION, type FilterSelection } from '@/lib/lottery/generationPresets';
import { STRATEGY_DEFINITIONS, STRATEGIES_SEM_FILTRO } from '@/lib/lottery/strategies';

export const useGameGenerator = () => {
  const { saveToHistory, generateSmartGame, generateSmartBatch } = useLottery();
  const [currentResult, setCurrentResult] = useState<SavedGame | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [strategy, setStrategy] = useState<GenStrategy>('equilibrada');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [selection, setSelection] = useState<Selection>(emptySelection());
  const [showBoard, setShowBoard] = useState(false);
  const [filterSel, setFilterSel] = useState<FilterSelection>(EMPTY_FILTER_SELECTION);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const calculation = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>();
  useEffect(() => () => { calculation.current?.abort(); clearTimeout(copyTimer.current); }, []);
  const busy = isGenerating || isBatchGenerating;
  const activeHint = STRATEGY_DEFINITIONS.find((s) => s.value === strategy)?.hint ?? '';
  const hasConstraints = selection.fixed.length > 0 || selection.excluded.length > 0;
  const filtersActive = hasActiveFilters(filterSel);
  const ignoraFiltros = STRATEGIES_SEM_FILTRO.has(strategy);

  const smartOpts = useMemo(
    () => ({
      strategy,
      fixed: selection.fixed,
      excluded: selection.excluded,
      // Surpresinha é aleatória pura: não aplica os filtros soft.
      ...(ignoraFiltros ? {} : filtersFromSelection(filterSel)),
    }),
    [strategy, selection.fixed, selection.excluded, ignoraFiltros, filterSel],
  );

  const stats = useMemo(
    () => (currentResult ? calculateGameStats(currentResult.numbers) : null),
    [currentResult],
  );

  const handleGenerate = async () => {
    if (busy) return;
    setIsGenerating(true);
    setIsCopied(false);

    const controller = new AbortController();
    calculation.current = controller;
    try {

      const newGame = await generateSmartGame(smartOpts, controller.signal);
      if (controller.signal.aborted) return;
      setCurrentResult(newGame);
      await saveToHistory([newGame]);

      trackEvent('Lead', {
        content_name: 'Jogo Lotofácil Gerado',
        content_category: 'game_generator',
        content_type: 'lottery_game',
        content_ids: [newGame.id],
        value: 3.5, // valor médio de aposta Lotofácil (BRL)
        currency: 'BRL',
        num_items: 1,
        sum: newGame.sum,
      });
      trackCustom('GerarJogo', {
        content_category: 'game_generator',
        sum: newGame.sum,
        type: newGame.type,
      });

    } catch (error) {
      if (!controller.signal.aborted) toast({ title: 'Erro ao gerar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      if (!controller.signal.aborted) setIsGenerating(false);
      if (calculation.current === controller) calculation.current = null;
    }
  };

  const handleGenerateBatch = async () => {
    if (busy) return;
    setIsBatchGenerating(true);
    setIsCopied(false);

    const controller = new AbortController();
    calculation.current = controller;
    try {

      const games = await generateSmartBatch(batchSize, smartOpts, controller.signal);
      if (controller.signal.aborted) return;
      if (games.length > 0) setCurrentResult(games[0]);
      const { success } = await saveToHistory(games);

      const qualities = games.map((g) => g.quality).filter((q): q is number => q != null);
      const avgQuality = qualities.length
        ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 100)
        : null;

      trackCustom('GerarLote', {
        content_category: 'game_generator',
        num_items: games.length,
        avg_quality: avgQuality,
      });

      toast({
        title: success ? `${games.length} jogos gerados!` : 'Lote gerado',
        description: success
          ? avgQuality != null
            ? `Lote diversificado salvo · aderência média ${avgQuality}%.`
            : 'Jogos diversificados salvos no seu histórico.'
          : 'Alguns jogos já existiam no histórico.',
      });

    } catch (error) {
      if (!controller.signal.aborted) toast({ title: 'Erro ao gerar lote', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    } finally {
      if (!controller.signal.aborted) setIsBatchGenerating(false);
      if (calculation.current === controller) calculation.current = null;
    }
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(formatInlinePlain(currentResult.numbers));
    setIsCopied(true);
    toast({ title: 'Copiado!', description: 'Números copiados com sucesso.' });
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setIsCopied(false), 2000);
  };

  return { currentResult, isGenerating, isBatchGenerating, isCopied, showDuplicateModal, setShowDuplicateModal, strategy, setStrategy, batchSize, setBatchSize, selection, setSelection, showBoard, setShowBoard, filterSel, setFilterSel, showFilters, setShowFilters, busy, activeHint, hasConstraints, filtersActive, ignoraFiltros, stats, handleGenerate, handleGenerateBatch, copyToClipboard };
};
