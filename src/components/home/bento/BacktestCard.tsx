import React from 'react';
import { FlaskConical } from 'lucide-react';

interface BacktestCardProps {
  onNavigate: () => void;
}

export const BacktestCard = ({ onNavigate }: BacktestCardProps) => (
  <div
    onClick={onNavigate}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(); }}
    aria-label="Ver a Prova Real (backtest)"
    className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-purple-500/5 cursor-pointer h-full outline-none focus-visible:ring-2 focus-visible:ring-purple-400 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
  >
    <div className="absolute top-0 right-0 p-6 text-purple-100 dark:text-purple-900/40 opacity-80 group-hover:rotate-12 transition-transform duration-700">
      <FlaskConical size={72} />
    </div>
    <div className="relative z-10">
      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
        <FlaskConical size={18} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Transparência</p>
      <h4 className="text-sm xs:text-base md:text-xl font-display font-bold leading-tight text-zinc-900 dark:text-zinc-100 mb-4">
        Prova Real: inteligente vs. aleatório
      </h4>
    </div>
    <button className="relative z-10 w-full py-3.5 md:py-4 bg-purple-600 text-white font-display font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-colors active:scale-95">
      Rodar Prova Real
    </button>
  </div>
);
