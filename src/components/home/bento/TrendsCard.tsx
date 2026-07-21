import React from 'react';
import { Target, PieChart, Flame, Snowflake } from 'lucide-react';
import { Ball } from "@/components/lottery/Ball";
import { useLotteryStats } from "@/hooks/useLotteryStats";

const pad = (n: number) => String(n).padStart(2, '0');

// Fallback estático apenas enquanto o histórico carrega ou em modo offline.
const FALLBACK_HOT = [20, 10, 25, 1, 13];
const FALLBACK_COLD = [4, 7, 12, 18, 22];

export const TrendsCard = () => {
  const { analysis } = useLotteryStats();

  const hot = (analysis?.quentes.slice(0, 5) ?? FALLBACK_HOT);
  // "Frias" aqui = mais atrasadas (maior tempo sem sair), leitura mais útil.
  const cold = (analysis?.atrasadas.slice(0, 5) ?? FALLBACK_COLD);
  const isLive = !!analysis && analysis.totalConcursos > 0;
  const janela = analysis?.totalConcursos ?? 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-7 flex flex-col group overflow-hidden relative shadow-sm h-full">
      <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 text-purple-900 pointer-events-none hidden md:block">
        <PieChart size={160} strokeWidth={1} />
      </div>

      <div className="flex flex-col items-center justify-between mb-4 md:mb-5 relative z-10 text-center md:text-left md:flex-row md:items-start">
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg md:text-xl font-display font-bold mb-1 flex items-center gap-2">
            <Target size={18} className="text-purple-600 dark:text-purple-400" /> Tendências
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
            {isLive ? `Últimos ${janela} concursos` : 'Carregando histórico…'}
          </p>
        </div>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
          isLive
            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/50'
            : 'text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700'
        }`}>
          {isLive ? 'Live' : '—'}
        </span>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
              <Flame size={10} /> Mais Quentes
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">↑ Frequência alta</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hot.map(num => (
              <Ball key={`hot-${num}`} number={pad(num)} active size="sm" />
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-purple-50 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
              <Snowflake size={10} /> Mais Atrasadas
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">↓ Maior atraso</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cold.map(num => (
              <span key={`cold-${num}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 text-[11px] font-bold">
                {pad(num)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
