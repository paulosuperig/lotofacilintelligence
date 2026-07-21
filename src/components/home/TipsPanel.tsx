import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Ball } from "@/components/lottery/Ball";
import { useLotteryStats } from "@/hooks/useLotteryStats";
import { BANDS } from "@/lib/lottery/constants";

interface TipsPanelProps {
  onBack: () => void;
}

const FALLBACK_HOT = [13, 20, 24, 10, 1, 11, 25, 4];
const rangeLabel = (b: { idealMin: number; idealMax: number }) => `${b.idealMin} ou ${b.idealMax}`;

export const TipsPanel = ({ onBack }: TipsPanelProps) => {
  const { analysis } = useLotteryStats();
  const hot = analysis?.quentes.slice(0, 8) ?? FALLBACK_HOT;
  const totalConcursos = analysis?.totalConcursos ?? 0;
  const topPct = analysis
    ? Math.round((analysis.porNumero[hot[0]]?.percentual ?? 0) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between mb-10 gap-6 text-center lg:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-2">Dicas do Especialista</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {totalConcursos > 0
                ? `Análises estatísticas dos últimos ${totalConcursos} concursos`
                : 'Análises estatísticas baseadas no histórico de resultados'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar ao Início
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 border border-purple-100 dark:border-zinc-700 rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Números "Quentes"</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              {totalConcursos > 0
                ? `Dezenas mais frequentes nos últimos ${totalConcursos} concursos${topPct != null ? ` — a mais quente saiu em ~${topPct}% deles.` : '.'}`
                : 'Dezenas historicamente mais frequentes da Lotofácil.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {hot.map(num => (
                <Ball key={num} number={num.toString().padStart(2, '0')} active size="md" />
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Estratégia de Quadrantes</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Q1 (01-05)</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Alta Frequência</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Q3 (11-15)</span>
                <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400">Equilibrado</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Q5 (21-25)</span>
                <span className="text-sm font-bold text-amber-500 dark:text-amber-400">Padrão de Repetição</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 sm:p-10 bg-zinc-900 rounded-[2.5rem] text-white overflow-hidden relative group">
          <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
            <Target size={200} />
          </div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Sparkles className="text-purple-400" /> Insight Premium
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Historicamente, a maior parte dos concursos concentra a soma das 15 dezenas na faixa
            de {BANDS.soma.idealMin} a {BANDS.soma.idealMax}. Jogos com soma muito abaixo
            de {BANDS.soma.min} ou acima de {BANDS.soma.max} são estatisticamente raros. Lembre-se: a
            Lotofácil é um jogo de sorte — estes filtros aumentam o equilíbrio do jogo, não garantem prêmios.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pares Ideal</p>
              <p className="text-lg font-bold">{rangeLabel(BANDS.pares)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Primos Ideal</p>
              <p className="text-lg font-bold">{rangeLabel(BANDS.primos)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Repetidos</p>
              <p className="text-lg font-bold">{rangeLabel(BANDS.repetidas)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Moldura</p>
              <p className="text-lg font-bold">{rangeLabel(BANDS.moldura)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
