import React from 'react';
import { Trophy, History, Calendar } from 'lucide-react';
import { Ball } from "@/components/lottery/Ball";
import { formatCurrency } from "@/lib/utils";
import { LotteryResult } from "@/types/lottery";

interface ResultCardProps {
  latestResult: LotteryResult | null;
  isLoading: boolean;
}

export const ResultCard = ({ latestResult, isLoading }: ResultCardProps) => (
  <div className="bg-white/50 dark:bg-zinc-900/50 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-8 relative group overflow-hidden shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition-colors duration-500 h-full flex flex-col">
    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 text-purple-900 hidden md:block">
      <Trophy size={180} strokeWidth={0.5} />
    </div>
    
    <div className="relative z-10 h-full flex flex-col">
      <div className="mb-4 md:mb-6">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 dark:border-purple-400/20 text-purple-600 dark:text-purple-400 text-[8px] font-bold mb-3 md:mb-4 uppercase tracking-widest">
          <History size={10} /> Sorteio
        </div>
        <h2 className="text-lg xs:text-xl md:text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">
          Nº {latestResult?.concurso || "---"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
          <Calendar size={12} strokeWidth={2} /> {latestResult ? latestResult.data : "---"}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2 mb-4 sm:mb-6 md:mb-8">
        {isLoading ? (
          Array(15).fill(0).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-purple-100/50 animate-pulse" />
          ))
        ) : (
          latestResult?.dezenas.map((num) => (
            <Ball key={num} number={num} active size="sm" />
          ))
        )}
      </div>

      <div className="mt-auto space-y-4 pt-6 border-t border-purple-50 dark:border-zinc-800">
        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 px-4 py-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 text-center">
          <p className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 uppercase font-bold tracking-[0.2em] mb-1.5">Próximo Prêmio</p>
          <p className="text-sm xs:text-base md:text-lg font-display font-bold text-emerald-500 tabular-nums leading-none whitespace-nowrap">
            {latestResult ? formatCurrency(latestResult.valorEstimadoProximoConcurso || 0) : "R$ ---"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center px-2">
            <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Pares</p>
            <p className="text-lg font-display font-bold text-zinc-800 dark:text-zinc-200">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length : "0"}</p>
          </div>
          <div className="text-center px-2">
            <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Ímpares</p>
            <p className="text-lg font-display font-bold text-zinc-800 dark:text-zinc-200">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length : "0"}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
