import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
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
}

const NavIcon = ({ 
  icon, 
  active = false, 
  label, 
  onClick, 
  highlight = false 
}: NavIconProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex h-full flex-1 flex-col items-center justify-center gap-1 group relative outline-none transition-transform active:scale-90 md:h-12 md:w-12 md:flex-none md:p-0",
      highlight && !active && "relative"
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
      active 
        ? "text-purple-600 md:bg-purple-100/50" 
        : highlight 
          ? "text-purple-500 bg-purple-50 md:bg-transparent" 
          : "text-zinc-500 hover:text-purple-600"
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
      "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 md:hidden",
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
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[5rem] flex-col items-center py-8 bg-white/80 backdrop-blur-xl border-r border-purple-100 z-50 shadow-xl shadow-purple-500/5">
      <div className="mb-12">
         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-300">
           <Trophy size={20} className="text-white" />
         </div>
      </div>
      <nav className="flex flex-col gap-4 flex-grow">
        <NavIcon icon={<LayoutDashboard size={20} strokeWidth={1.5} />} active={activeTab === 'home'} label="Home" onClick={() => setActiveTab('home')} />
        <NavIcon icon={<Zap size={20} strokeWidth={1.5} />} active={activeTab === 'gerador'} label="Gerador" onClick={() => {
          setActiveTab('gerador');
          document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
        }} />
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
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-xl border-t border-purple-100 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_25px_-5px_rgba(168,85,247,0.1)] md:hidden">
      <NavIcon icon={<LayoutDashboard size={22} />} active={activeTab === 'home'} label="Início" onClick={() => setActiveTab('home')} />
      <NavIcon icon={<Zap size={22} />} active={activeTab === 'gerador'} label="Gerar" onClick={() => setActiveTab('gerador')} />
      <NavIcon icon={<History size={22} />} active={activeTab === 'historico'} label="Histórico" onClick={() => setActiveTab('historico')} />
      <NavIcon 
        icon={<Cpu size={22} />} 
        active={activeTab === 'ia'} 
        label="IA" 
        onClick={() => setActiveTab('ia')} 
        highlight
      />
      {role === 'admin' ? (
        <NavIcon icon={<Settings size={22} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
      ) : (
        <NavIcon icon={<LogOut size={22} />} label="Sair" onClick={onLogout} />
      )}
    </nav>
  );
};
