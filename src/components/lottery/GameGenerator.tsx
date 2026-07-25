import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ball } from './Ball';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/icons';
import {
  Zap,
  RefreshCcw,
  TrendingUp,
  Copy,
  Check,
  AlertCircle,
  Scale,
  Flame,
  Snowflake,
  Repeat,
  Orbit,
  Dice5,
  BadgeCheck,
  Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenStrategy } from '@/lib/lottery/generator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import { SavedGame } from '@/types/lottery';
import { calculateGameStats } from '@/lib/lottery/stats';
import { ResponsibleGaming } from './ResponsibleGaming';
import { buildSingleGameMessage, formatInlinePlain, openWhatsApp } from '@/lib/whatsapp';
import { trackCustom, trackEvent } from '@/lib/analytics/metaPixel';
import { NumberBoard } from './NumberBoard';
import { emptySelection, type Selection } from '@/lib/lottery/selection';
import { GenerationFilters } from './GenerationFilters';
import {
  filtersFromSelection,
  hasActiveFilters,
  EMPTY_FILTER_SELECTION,
  type FilterSelection,
} from '@/lib/lottery/generationPresets';
import { SlidersHorizontal, Filter, X } from 'lucide-react';

const BATCH_SIZES = [3, 5, 10, 15] as const;

interface StrategyOption {
  value: GenStrategy;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

// Estratégias disponíveis no gerador — espelham as do Intelligence AI.
const STRATEGIES: StrategyOption[] = [
  { value: 'equilibrada', label: 'Equilibrada', hint: 'Todas as métricas na faixa ideal', icon: <Scale size={15} /> },
  { value: 'quentes', label: 'Quentes', hint: 'Prioriza as dezenas mais frequentes', icon: <Flame size={15} /> },
  { value: 'atrasadas', label: 'Atrasadas', hint: 'Peso às dezenas de maior atraso', icon: <Snowflake size={15} /> },
  { value: 'repetidas', label: 'Repetidas', hint: 'Âncora forte no último concurso', icon: <Repeat size={15} /> },
  { value: 'ciclo', label: 'Ciclo', hint: 'Cobre as ausentes do último concurso', icon: <Orbit size={15} /> },
  { value: 'agressiva', label: 'Agressiva', hint: 'Mais diversificação e risco', icon: <Dice5 size={15} /> },
  { value: 'surpresinha', label: 'Surpresinha', hint: 'Aleatório puro, como a geração oficial da Caixa', icon: <Shuffle size={15} /> },
];

/** Estratégias que ignoram os filtros avançados (geração puramente aleatória). */
const STRATEGIES_SEM_FILTRO = new Set<GenStrategy>(['surpresinha']);

/**
 * Rótulo honesto da qualidade do jogo. É ADERÊNCIA às faixas estatísticas
 * (equilíbrio), NÃO chance de ganhar — a probabilidade do sorteio é fixa.
 */
const qualityInfo = (q?: number): { pct: number; label: string; cls: string } | null => {
  if (q == null) return null;
  const pct = Math.round(Math.max(0, Math.min(1, q)) * 100);
  if (pct >= 90) return { pct, label: 'Excelente aderência', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' };
  if (pct >= 75) return { pct, label: 'Ótima aderência', cls: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' };
  if (pct >= 60) return { pct, label: 'Boa aderência', cls: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' };
  return { pct, label: 'Aderência moderada', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };
};

export const GameGenerator = () => {
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

  const activeHint = STRATEGIES.find((s) => s.value === strategy)?.hint ?? '';
  const hasConstraints = selection.fixed.length > 0 || selection.excluded.length > 0;
  const filtersActive = hasActiveFilters(filterSel);
  const ignoraFiltros = STRATEGIES_SEM_FILTRO.has(strategy);
  const smartOpts = {
    strategy,
    fixed: selection.fixed,
    excluded: selection.excluded,
    // Surpresinha é aleatória pura: não aplica os filtros soft.
    ...(ignoraFiltros ? {} : filtersFromSelection(filterSel)),
  };

  const stats = useMemo(() => {
    if (!currentResult) return null;
    return calculateGameStats(currentResult.numbers);
  }, [currentResult]);

  const quality = useMemo(() => qualityInfo(currentResult?.quality), [currentResult]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsCopied(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newGame = generateSmartGame(smartOpts);
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
    setIsGenerating(false);
  };

  const handleGenerateBatch = async () => {
    if (isGenerating || isBatchGenerating) return;
    setIsBatchGenerating(true);
    setIsCopied(false);

    await new Promise(resolve => setTimeout(resolve, 800));

    const games = generateSmartBatch(batchSize, smartOpts);
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
    setIsBatchGenerating(false);
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    const text = formatInlinePlain(currentResult.numbers);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({
      title: "Copiado!",
      description: "Números copiados com sucesso.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto pb-24 xs:pb-32 text-zinc-900 dark:text-zinc-100">
      <AlertDialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <AlertDialogContent className="rounded-[2rem] border-zinc-100 dark:border-zinc-800 shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-display font-bold text-center text-zinc-900 dark:text-zinc-100">
              Jogo Repetido!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
              Você já possui este jogo salvo em seu histórico. Experimente gerar uma nova combinação otimizada!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction 
              onClick={() => setShowDuplicateModal(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-5 sm:p-8 md:p-12 border-b border-purple-50 dark:border-zinc-800">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <Zap size={14} fill="currentColor" />
              <span className="text-[10px] uppercase font-bold tracking-[0.25em]">Sistemas Premium</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Gerador Inteligente
            </h2>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Estratégia</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">{activeHint}</span>
            </div>
            <div role="radiogroup" aria-label="Estratégia de geração" className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {STRATEGIES.map((s) => {
                const active = s.value === strategy;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={s.hint}
                    onClick={() => setStrategy(s.value)}
                    disabled={isGenerating || isBatchGenerating}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none",
                      active
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700"
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 px-1 sm:hidden">{activeHint}</p>
          </div>

          {/* Fixar & excluir dezenas (opcional) */}
          <div>
            <button
              type="button"
              onClick={() => setShowBoard((v) => !v)}
              aria-expanded={showBoard}
              className="w-full flex items-center justify-between px-1 py-1 group"
            >
              <span className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover:text-purple-500 transition-colors">
                <SlidersHorizontal size={13} /> Fixar & excluir dezenas
              </span>
              <span className="text-[10px] font-bold text-purple-500">
                {hasConstraints
                  ? `${selection.fixed.length} fixas · ${selection.excluded.length} excl.`
                  : showBoard ? 'ocultar' : 'opcional'}
              </span>
            </button>

            {showBoard && (
              <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
                <NumberBoard
                  selection={selection}
                  onChange={setSelection}
                  disabled={isGenerating || isBatchGenerating}
                />
                {hasConstraints && (
                  <button
                    type="button"
                    onClick={() => setSelection(emptySelection())}
                    className="mx-auto mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} /> Limpar seleção
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filtros avançados (opcional) */}
          <div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="w-full flex items-center justify-between px-1 py-1 group"
            >
              <span className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover:text-purple-500 transition-colors">
                <Filter size={13} /> Filtros avançados
              </span>
              <span className="text-[10px] font-bold text-purple-500">
                {ignoraFiltros ? 'não se aplica' : filtersActive ? 'ativos' : showFilters ? 'ocultar' : 'opcional'}
              </span>
            </button>

            {showFilters && (
              <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
                {ignoraFiltros && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-3 text-center">
                    A Surpresinha é aleatória pura (padrão da Caixa) — os filtros abaixo não se aplicam a ela.
                  </p>
                )}
                <GenerationFilters
                  value={filterSel}
                  onChange={setFilterSel}
                  disabled={isGenerating || isBatchGenerating || ignoraFiltros}
                />
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => setFilterSel(EMPTY_FILTER_SELECTION)}
                    className="mx-auto mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} /> Limpar filtros
                  </button>
                )}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 text-center leading-relaxed">
                  Filtros são preferências: o gerador prioriza jogos na faixa, sem descartar jogos válidos nem alterar a probabilidade do sorteio.
                </p>
              </div>
            )}
          </div>

          {/* Quantidade do lote */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1 mb-2 block">Jogos no lote</span>
            <div role="radiogroup" aria-label="Quantidade de jogos no lote" className="flex gap-2">
              {BATCH_SIZES.map((n) => {
                const active = n === batchSize;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setBatchSize(n)}
                    disabled={isGenerating || isBatchGenerating}
                    className={cn(
                      "flex-1 h-10 rounded-xl border text-xs font-bold tabular-nums transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none",
                      active
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700"
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isBatchGenerating}
              className="flex-1 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 h-14 rounded-2xl shadow-xl shadow-purple-500/10 font-bold text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isGenerating ? <RefreshCcw className="animate-spin mr-3" size={18} /> : <Zap className="mr-3" size={18} fill="currentColor" />}
              {isGenerating ? "Analisando Tendências..." : "Gerar Jogo Otimizado"}
            </Button>
            <Button
              onClick={handleGenerateBatch}
              disabled={isGenerating || isBatchGenerating}
              variant="outline"
              className="sm:w-auto h-14 px-6 rounded-2xl border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isBatchGenerating ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <Copy className="mr-2" size={18} />}
              {isBatchGenerating ? "Gerando..." : `Lote de ${batchSize}`}
            </Button>
          </div>
        </div>

        <div className="min-h-[140px] md:min-h-[200px] flex flex-wrap justify-center content-center gap-2 sm:gap-4 md:gap-6 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl md:rounded-[2rem] p-4 sm:p-8 md:p-12 border border-zinc-100 dark:border-zinc-800 shadow-inner relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentResult ? (
              <motion.div 
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-wrap justify-center gap-1.5 sm:gap-3 md:gap-5"
              >
                {currentResult.numbers.map((num, i) => (
                  <motion.div
                    key={`${num}-${i}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                  >
                    <Ball number={num} active size="lg" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4"
              >
                <div className="flex gap-2">
                   {Array(5).fill(0).map((_, i) => (
                     <motion.div 
                        key={i} 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-purple-300 dark:bg-purple-900" 
                      />
                   ))}
                </div>
                <p className="text-xs font-medium tracking-widest uppercase">Pronto para gerar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-5 sm:p-8 md:p-12 flex-grow flex flex-col">
        {quality && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1.5 mb-6"
          >
            <div className={cn('flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold', quality.cls)}>
              <BadgeCheck size={15} />
              {quality.label} · {quality.pct}%
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Aderência às faixas estatísticas — não altera a probabilidade do sorteio
            </span>
          </motion.div>
        )}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 mb-10"
          >
            <StatCard label="Pares/Ímpares" value={`${stats.pairs}/${stats.odd}`} icon={<TrendingUp size={14}/>} />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14}/>} />
            <StatCard label="Moldura" value={stats.mold} icon={<TrendingUp size={14}/>} />
            <StatCard label="Números Primos" value={stats.primes} icon={<TrendingUp size={14}/>} />
            <StatCard label="Maior Seq." value={stats.sequence} icon={<TrendingUp size={14}/>} />
          </motion.div>
        )}

        {currentResult && (
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
            >
              {isCopied ? <Check className="mr-3 text-emerald-500" size={18} /> : <Copy className="mr-3" size={18} />}
              {isCopied ? "Copiado!" : "Copiar Números"}
            </Button>
            <Button
              onClick={() => openWhatsApp(buildSingleGameMessage(currentResult.numbers))}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              <WhatsAppIcon size={18} className="mr-3" />
              Compartilhar
            </Button>
          </div>
        )}

        {currentResult && <ResponsibleGaming />}
      </div>
    </div>
  );
};
