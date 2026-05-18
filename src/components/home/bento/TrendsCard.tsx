import React from 'react';
import { Target, PieChart, Flame, Snowflake } from 'lucide-react';
import { Ball } from "@/components/lottery/Ball";

export const TrendsCard = () => (
  <div className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-7 flex flex-col group overflow-hidden relative shadow-sm h-full">
    <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 text-purple-900 pointer-events-none hidden md:block">
      <PieChart size={160} strokeWidth={1} />
    </div>

    <div className="flex flex-col items-center justify-between mb-4 md:mb-5 relative z-10 text-center md:text-left md:flex-row md:items-start">
      <div className="flex flex-col items-center md:items-start">
        <h3 className="text-lg md:text-xl font-display font-bold mb-1 flex items-center gap-2">
          <Target size={18} className="text-purple-600" /> Tendências
        </h3>
        <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Últimos 10 jogos</p>
      </div>
      <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
        Live
      </span>
    </div>

    <div className="space-y-4 relative z-10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
            <Flame size={10} /> Mais Quentes
          </span>
          <span className="text-[9px] font-bold text-zinc-400">↑ Frequência alta</span>
        </div>
        <div className="flex gap-2">
          {["20", "10", "25", "01", "13"].map(num => (
            <Ball key={`hot-${num}`} number={num} active size="sm" />
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-purple-50 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
            <Snowflake size={10} /> Mais Frias
          </span>
          <span className="text-[9px] font-bold text-zinc-400">↓ Atrasadas</span>
        </div>
        <div className="flex gap-2">
          {["04", "07", "12", "18", "22"].map(num => (
            <span key={`cold-${num}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 text-[11px] font-bold">
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);
