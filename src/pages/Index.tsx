import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  History, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Bell as BellIcon,
  ChevronRight,
  Trophy,
  Calendar,
  Sparkles,
  ArrowUpRight,
  PieChart,
  Target,
  ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Ball } from "@/components/lottery/Ball";
import { getLatestResult } from "@/services/lotteryApi";
import { LotteryResult } from "@/types/lottery";
import { GameGenerator } from "@/components/lottery/GameGenerator";
import { cn, formatDate, formatCurrency } from "@/lib/utils";

const Index = () => {
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLatestResult();
        setLatestResult(data);
      } catch (error) {
        console.error("Error fetching latest result:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-zinc-900 selection:bg-purple-500/30 overflow-x-hidden font-sans">
      {/* Sidebar Navigation - Apple Style */}
      <aside className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md h-16 bg-white/80 backdrop-blur-xl border border-purple-100 rounded-2xl z-50 md:top-1/2 md:left-8 md:-translate-x-0 md:-translate-y-1/2 md:w-20 md:h-[600px] md:flex-col md:rounded-3xl flex items-center justify-around md:justify-center md:gap-8 py-4 px-6 md:px-0 shadow-xl shadow-purple-500/10">
        <div className="hidden md:flex flex-col items-center mb-8">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
             <Trophy size={20} className="text-white" />
           </div>
        </div>
        <NavIcon icon={<LayoutDashboard size={22} strokeWidth={1.5} />} active label="Home" />
        <NavIcon icon={<Zap size={22} strokeWidth={1.5} />} label="Gerador" />
        <NavIcon icon={<TrendingUp size={22} strokeWidth={1.5} />} label="Stats" />
        <NavIcon icon={<History size={22} strokeWidth={1.5} />} label="Histórico" />
        <div className="hidden md:flex flex-col gap-8 mt-auto mb-4 pt-8 border-t border-white/5">
           <NavIcon icon={<Settings size={22} strokeWidth={1.5} />} label="Ajustes" />
           <NavIcon icon={<LogOut size={22} strokeWidth={1.5} />} label="Sair" />
        </div>
      </aside>

      <main className="pb-32 md:pb-12 md:pl-32">
        <div className="max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16">
          
          {/* Top Header - Minimalist */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-purple-600/60">Membro Premium Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-zinc-900">
                Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-200">João Silva</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Pro Analyst</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-sm font-display font-bold group cursor-pointer hover:border-purple-500/50 transition-all duration-300 shadow-sm">
                <span className="group-hover:scale-110 transition-transform duration-500 text-purple-700">JS</span>
              </div>
            </motion.div>
          </header>

          {/* Bento Grid Layout */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
          >
            
            {/* Generator Bento - Main Focus */}
            <motion.div variants={itemVariants} className="lg:col-span-8 lg:row-span-3">
              <div className="h-full bg-white border border-purple-200 rounded-[2rem] p-0 flex flex-col shadow-xl shadow-purple-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-purple-900 pointer-events-none">
                  <Zap size={200} strokeWidth={0.5} />
                </div>
                <GameGenerator />
              </div>
            </motion.div>

            {/* Official Result Bento - Secondary Focus */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-2 bg-white/50 border border-purple-100 rounded-[2rem] p-8 relative group overflow-hidden shadow-sm hover:bg-white transition-colors duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 text-purple-900">
                <Trophy size={180} strokeWidth={0.5} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[8px] font-bold mb-4 uppercase tracking-widest">
                    <History size={10} /> Último Sorteio
                  </div>
                  <h2 className="text-4xl font-display font-bold text-zinc-900 mb-2">
                    Nº {latestResult?.concurso || "---"}
                  </h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={12} strokeWidth={2} /> {latestResult ? latestResult.data : "---"}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-8">
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

                <div className="mt-auto space-y-4 pt-6 border-t border-purple-50">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                    <p className="text-[8px] text-emerald-600/70 uppercase font-bold tracking-[0.2em] mb-1">Próximo Prêmio</p>
                    <p className="text-2xl font-display font-bold text-emerald-500">
                      {latestResult ? formatCurrency(latestResult.valorEstimadoProximoConcurso || 0) : "R$ ---"}
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Pares</p>
                      <p className="text-lg font-display font-bold text-zinc-800">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length : "0"}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Ímpares</p>
                      <p className="text-lg font-display font-bold text-zinc-800">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length : "0"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Frequência Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex flex-col justify-between group overflow-hidden relative shadow-sm">
              <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 text-purple-900">
                <PieChart size={140} strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold mb-1 flex items-center gap-3">
                  <Target size={18} className="text-purple-600" /> Tendências
                </h3>
                <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Top 5 frequentes (10 jogos)</p>
              </div>
              <div className="flex gap-3 mt-6">
                {["20", "10", "25", "01", "13"].map(num => (
                  <Ball key={num} number={num} active size="sm" />
                ))}
              </div>
            </motion.div>

            {/* Quick Insights Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 hover:bg-purple-50/50 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 premium-border flex items-center justify-center text-emerald-400">
                  <TrendingUp size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-premium-text-muted uppercase tracking-widest">Consistência</p>
                  <p className="text-2xl font-display font-bold text-zinc-900">94.2%</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Índice de Acertos</h4>
                <p className="text-xs text-premium-text-muted">Seu desempenho está acima de 85% dos usuários Pro.</p>
              </div>
            </motion.div>

            {/* Fechamentos Card - Elegant Action */}
            <motion.div 
              variants={itemVariants} 
              onClick={() => {
                toast({
                  title: "Fechamentos Pro",
                  description: "Acesse modelos matemáticos na aba Stats.",
                });
              }}
              className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-purple-50/50 transition-all shadow-sm"
            >
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-zinc-900">Fechamentos Pro</h4>
                <p className="text-sm text-premium-text-muted">Acesse 42 modelos matemáticos exclusivos.</p>
              </div>
              <ArrowUpRight size={20} className="ml-auto text-premium-text-muted group-hover:text-purple-600 transition-colors" />
            </motion.div>

             {/* Smart Alerts */}
             <motion.div 
              variants={itemVariants} 
              className="lg:col-span-4 lg:row-span-1 bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-500 rounded-[2rem] p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl shadow-purple-500/10"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                <Sparkles size={80} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Dica do Especialista</p>
              <h4 className="text-xl font-display font-bold leading-tight mt-2 mb-4">
                "Ciclo das dezenas prestes a fechar. Foque no número 08 e 22."
              </h4>
              <button 
                onClick={() => {
                  toast({
                    title: "Dica Premium",
                    description: "Análise completa enviada para seu e-mail de membro.",
                  });
                }}
                className="w-full py-4 bg-white text-purple-900 font-display font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 hover:bg-purple-50 transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Ver Análise Completa
              </button>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
};

const NavIcon = ({ icon, active = false, label }: { icon: React.ReactNode, active?: boolean, label: string }) => (
  <button className="flex flex-col items-center gap-1 group relative outline-none transition-transform active:scale-90">
    <div className={cn(
      "p-3 rounded-xl transition-all duration-300 md:group-hover:bg-purple-100/50",
      active 
        ? "text-purple-600 md:bg-purple-100/50" 
        : "text-zinc-500 hover:text-purple-600"
    )}>
      {icon}
    </div>
    <span className={cn(
      "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 md:hidden",
      active ? "text-purple-600" : "text-zinc-500"
    )}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden md:block absolute -left-4 w-1 h-5 bg-purple-600 rounded-full"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
  </button>
);

const StatDetail = ({ label, value, percentage, color }: { label: string, value: string, percentage: number, color: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] text-premium-text-muted uppercase font-bold tracking-[0.2em]">{label}</span>
      <span className="text-2xl font-display font-bold text-zinc-900">{value}</span>
    </div>
    <div className="w-20 h-1 bg-purple-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
      />
    </div>
  </div>
);

export default Index;
