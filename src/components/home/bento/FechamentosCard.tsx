import React from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

interface FechamentosCardProps {
  onNavigate: () => void;
}

export const FechamentosCard = ({ onNavigate }: FechamentosCardProps) => (
  <div 
    onClick={onNavigate}
    className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-6 sm:p-8 flex items-center gap-4 sm:gap-6 group cursor-pointer hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 transition-all shadow-sm h-full"
  >
    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500">
      <ShieldCheck size={32} />
    </div>
    <div>
      <h4 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">Fechamentos Pro</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Modelos matemáticos exclusivos.</p>
    </div>
    <ArrowUpRight size={20} className="ml-auto text-zinc-400 group-hover:text-purple-600 transition-colors" />
  </div>
);
