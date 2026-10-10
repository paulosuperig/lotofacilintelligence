import React from 'react';
import { useGameGenerator } from '@/hooks/useGameGenerator';
import { motion } from 'framer-motion';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/icons';
import {
  BadgeCheck,
  Check,
  Copy,
  Filter,
  RefreshCcw,
  SlidersHorizontal,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsibleGaming } from './ResponsibleGaming';
import { buildSingleGameMessage, openWhatsApp } from '@/lib/whatsapp';
import { NumberBoard } from './NumberBoard';
import { emptySelection } from '@/lib/lottery/selection';
import { GenerationFilters } from './GenerationFilters';
import { EMPTY_FILTER_SELECTION } from '@/lib/lottery/generationPresets';
import { StrategyPicker } from './generator/StrategyPicker';
import { BatchSizePicker } from './generator/BatchSizePicker';
import { DuplicateGameDialog } from './generator/DuplicateGameDialog';
import { GameDisplay } from './generator/GameDisplay';

export const GameGenerator = () => {
  const { currentResult, isGenerating, isBatchGenerating, isCopied, showDuplicateModal, setShowDuplicateModal, strategy, setStrategy, batchSize, setBatchSize, selection, setSelection, showBoard, setShowBoard, filterSel, setFilterSel, showFilters, setShowFilters, busy, activeHint, hasConstraints, filtersActive, ignoraFiltros, stats, quality, handleGenerate, handleGenerateBatch, copyToClipboard } = useGameGenerator();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto pb-24 xs:pb-32 text-zinc-900 dark:text-zinc-100">
      <DuplicateGameDialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal} />

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

          <StrategyPicker value={strategy} onChange={setStrategy} disabled={busy} hint={activeHint} />

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
                  : showBoard
                    ? 'ocultar'
                    : 'opcional'}
              </span>
            </button>

            {showBoard && (
              <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
                <NumberBoard selection={selection} onChange={setSelection} disabled={busy} />
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
                <GenerationFilters value={filterSel} onChange={setFilterSel} disabled={busy || ignoraFiltros} />
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
                  Filtros são preferências: o gerador prioriza jogos na faixa, sem descartar jogos válidos nem alterar a
                  probabilidade do sorteio.
                </p>
              </div>
            )}
          </div>

          <BatchSizePicker value={batchSize} onChange={setBatchSize} disabled={busy} />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={busy}
              className="flex-1 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 h-14 rounded-2xl shadow-xl shadow-purple-500/10 font-bold text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isGenerating ? (
                <RefreshCcw className="animate-spin mr-3" size={18} />
              ) : (
                <Zap className="mr-3" size={18} fill="currentColor" />
              )}
              {isGenerating ? 'Analisando Tendências...' : 'Gerar Jogo Otimizado'}
            </Button>
            <Button
              onClick={handleGenerateBatch}
              disabled={busy}
              variant="outline"
              className="sm:w-auto h-14 px-6 rounded-2xl border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isBatchGenerating ? (
                <RefreshCcw className="animate-spin mr-2" size={18} />
              ) : (
                <Copy className="mr-2" size={18} />
              )}
              {isBatchGenerating ? 'Gerando...' : `Lote de ${batchSize}`}
            </Button>
          </div>
        </div>

        <GameDisplay numbers={currentResult?.numbers ?? null} />
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
            <StatCard label="Pares/Ímpares" value={`${stats.pairs}/${stats.odd}`} icon={<TrendingUp size={14} />} />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14} />} />
            <StatCard label="Moldura" value={stats.mold} icon={<TrendingUp size={14} />} />
            <StatCard label="Números Primos" value={stats.primes} icon={<TrendingUp size={14} />} />
            <StatCard label="Maior Seq." value={stats.sequence} icon={<TrendingUp size={14} />} />
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
              {isCopied ? 'Copiado!' : 'Copiar Números'}
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
