import React from 'react';
import { motion } from 'framer-motion';
import { Clover, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  role: 'admin' | 'demo';
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Header = ({ role, isRefreshing, onRefresh }: HeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mt-12 md:mt-0 mb-8 md:mb-12 gap-6 relative">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full md:w-auto flex flex-col items-center md:items-start text-center md:text-left"
      >
        <div className="flex flex-col md:flex-row items-center gap-2 mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <Clover size={14} className="text-purple-600 animate-pulse md:order-last" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse hidden md:block" />
          </div>
          <span className="text-[clamp(9px,1.5vw,10px)] uppercase font-bold tracking-[0.2em] md:tracking-[0.25em] text-purple-600/60">Membro Premium Intelligence</span>
        </div>
        <h1 className="text-[clamp(1.75rem,5vw,3.5rem)] font-display font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-100">
          Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
        </h1>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end"
      >
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:flex w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 items-center justify-center text-purple-600 dark:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all active:scale-95"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="hidden md:flex w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 items-center justify-center text-purple-600 dark:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
            <Sparkles size={20} />
          </motion.div>
        </button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{role === 'admin' ? 'Administrador' : 'Membro VIP'}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{role === 'admin' ? 'Acesso Total' : 'Acesso Demonstrativo'}</p>
        </div>
        <div className="hidden md:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 border border-purple-100 dark:border-zinc-700 items-center justify-center text-xs font-display font-bold text-white group cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
          <span className="group-hover:scale-110 transition-transform duration-500">VIP</span>
        </div>
      </motion.div>
    </header>
  );
};
