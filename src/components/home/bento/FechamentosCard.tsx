import React from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

interface FechamentosCardProps {
  onNavigate: () => void;
}

export const FechamentosCard = ({ onNavigate }: FechamentosCardProps) => (
  <div
    onClick={onNavigate}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(); }}
    aria-label="Abrir Fechamentos"
    className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-4 group cursor-pointer hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all shadow-sm h-full outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
  >
    <div className="flex justify-between items-start">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shrink-0">
        <ShieldCheck size={22} />
      </div>
      <ArrowUpRight size={18} className="text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
    </div>
    <div>
      <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-1 leading-tight">Fechamentos</h4>
      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">Redução com garantia verificada.</p>
    </div>
  </div>
);
