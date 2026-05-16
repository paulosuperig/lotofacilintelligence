import React from 'react';
import { motion } from 'framer-motion';
import { Sidebar, MobileNav } from './Navigation';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'admin' | 'demo';
  onLogout: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const AppLayout = ({
  children,
  activeTab,
  setActiveTab,
  role,
  onLogout,
  isRefreshing,
  onRefresh
}: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f5f3ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex flex-col md:flex-row relative">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-300/10 dark:bg-zinc-800/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} onLogout={onLogout} />
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} role={role} onLogout={onLogout} />

        {role === 'demo' && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[clamp(8px,1.5vw,10px)] font-bold uppercase tracking-[0.2em] py-1.5 text-center z-[100] shadow-sm">
            Modo de Demonstração — Acesso VIP Intelligence
          </div>
        )}

        <main className="flex-grow w-full md:pl-[5rem] pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[min(1600px,95%)] mx-auto p-4 sm:p-6 lg:p-10 transition-all duration-300"
          >
            <Header role={role} isRefreshing={isRefreshing} onRefresh={onRefresh} />
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
