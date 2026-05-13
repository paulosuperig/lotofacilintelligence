import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clover, 
  Zap, 
  History, 
  Cpu, 
  Settings, 
  LogOut,
  Trophy
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface NavIconProps {
  icon: React.ReactNode;
  active?: boolean;
  label: string;
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
}

const NavIcon = ({ 
  icon, 
  active = false, 
  label, 
  onClick, 
  highlight = false,
  className
}: NavIconProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex h-full flex-1 flex-col items-center justify-center gap-1 group relative outline-none transition-transform active:scale-90 md:h-12 md:w-12 md:flex-none md:p-0",
      highlight && !active && "relative",
      className
    )}
  >
    {highlight && !active && (
      <motion.div
        layoutId="highlight-pulse"
        className="absolute inset-0 rounded-full bg-purple-400/20 md:hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    )}
    <div className={cn(
      "w-10 h-10 rounded-[1.15rem] flex items-center justify-center transition-all duration-300 md:w-12 md:h-12 md:rounded-[1.25rem] md:group-hover:bg-purple-100/50",
      active && !className 
        ? "text-purple-600 md:bg-purple-100/50" 
        : highlight && !className
          ? "text-purple-500 bg-purple-50 md:bg-transparent" 
          : !className && "text-zinc-500 hover:text-purple-600"
    )}>
      <motion.div
        animate={highlight && !active ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={highlight && !active ? { 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } : {}}
      >
        {icon}
      </motion.div>
    </div>
    <span className={cn(
      "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 hidden md:hidden",
      active ? "text-purple-600" : highlight ? "text-purple-500" : "text-zinc-500"
    )}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden md:block absolute -left-2 w-1 h-5 bg-purple-600 rounded-full"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    {highlight && !active && (
      <span className="absolute top-1 right-1 md:top-0 md:right-0 w-2 h-2 bg-fuchsia-500 rounded-full border-2 border-white animate-bounce" />
    )}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'admin' | 'demo';
  onLogout: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, role, onLogout }: SidebarProps) => {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[5rem] flex-col items-center py-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-purple-100 dark:border-zinc-800 z-50 shadow-xl shadow-purple-500/5">
      <div className="mb-12">
         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-300">
           <Trophy size={20} className="text-white" />
         </div>
      </div>
      <nav className="flex flex-col gap-4 flex-grow">
        <NavIcon icon={<Clover size={20} strokeWidth={1.5} />} active={activeTab === 'home'} label="Home" onClick={() => setActiveTab('home')} />
        <NavIcon icon={<History size={20} strokeWidth={1.5} />} active={activeTab === 'historico'} label="Histórico" onClick={() => setActiveTab('historico')} />
        <NavIcon 
          icon={<Cpu size={20} strokeWidth={1.5} />} 
          active={activeTab === 'ia'} 
          label="IA" 
          onClick={() => setActiveTab('ia')}
          highlight
        />
        {role === 'admin' && (
           <NavIcon icon={<Settings size={20} strokeWidth={1.5} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
        )}
      </nav>
      <div className="mt-auto">
         <NavIcon icon={<LogOut size={20} strokeWidth={1.5} />} label="Sair" onClick={onLogout} />
      </div>
    </aside>
  );
};

export const MobileNav = ({ activeTab, setActiveTab, role, onLogout }: SidebarProps) => {
  return (
    <nav className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 z-[100] flex items-center justify-around px-2 rounded-full shadow-[0_15px_35px_-10px_rgba(168,85,247,0.3)] md:hidden">
      <NavIcon icon={<Clover size={20} />} active={activeTab === 'home'} label="Início" onClick={() => setActiveTab('home')} />
      <NavIcon icon={<History size={20} />} active={activeTab === 'historico'} label="Histórico" onClick={() => setActiveTab('historico')} />
      <div className="relative -top-2">
        <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 rounded-full animate-pulse" />
        <NavIcon 
          icon={<Cpu size={24} className="text-white" />} 
          active={activeTab === 'ia'} 
          label="IA" 
          onClick={() => setActiveTab('ia')} 
          className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full w-14 h-14 shadow-lg shadow-purple-500/40 border-4 border-white dark:border-zinc-900"
        />
      </div>
      {role === 'admin' && (
        <NavIcon icon={<Settings size={20} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
      )}
      <NavIcon icon={<LogOut size={20} />} label="Sair" onClick={onLogout} />
    </nav>
  );
};
