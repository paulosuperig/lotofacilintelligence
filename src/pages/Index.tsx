import React, { useState, useEffect } from 'react';
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
              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-[1.1] text-zinc-900">
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
            
            {/* Main Result Bento - Large */}
            <motion.div variants={itemVariants} className="lg:col-span-8 lg:row-span-2 bg-white border border-purple-100 rounded-[2rem] p-8 md:p-10 relative group overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-purple-900">
                <Trophy size={280} strokeWidth={0.5} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex flex-wrap justify-between items-start gap-6 mb-12">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[9px] font-bold mb-6 uppercase tracking-widest">
                      <History size={10} /> Resultado Oficial
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-zinc-900 mb-6">
                      {latestResult?.concurso || "---"}
                    </h2>
                    <div className="flex items-center gap-6 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-2"><Calendar size={14} strokeWidth={2} /> {latestResult ? formatDate(latestResult.data) : "---"}</span>
                      <span className="w-1 h-1 rounded-full bg-purple-500/30" />
                      <span className="flex items-center gap-2"><ShieldCheck size={14} strokeWidth={2} /> Verificado</span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50/50 p-6 md:p-8 rounded-[1.5rem] border border-purple-100 backdrop-blur-xl">
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Próximo Prêmio</p>
                    <p className="text-3xl md:text-4xl font-display font-black text-emerald-400">
                      {latestResult ? formatCurrency(latestResult.valor_estimado_proximo_concurso || latestResult.estimativa_proximo_concurso || 0) : "R$ ---"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 md:gap-5 mb-12">
                  {isLoading ? (
                    Array(15).fill(0).map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded-full bg-purple-100/50 animate-pulse" />
                    ))
                  ) : (
                    latestResult?.dezenas.map((num, i) => (
                      <Ball key={num} number={num} active size="lg" />
                    ))
                  )}
                </div>

                <div className="mt-auto pt-8 border-t border-purple-50 flex flex-wrap gap-8 md:gap-12 items-center">
                  <StatDetail label="Pares" value={latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length.toString().padStart(2, '0') : "00"} percentage={latestResult ? (latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length / 15) * 100 : 0} color="from-purple-500 to-purple-400" />
                  <StatDetail label="Ímpares" value={latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length.toString().padStart(2, '0') : "00"} percentage={latestResult ? (latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length / 15) * 100 : 0} color="from-purple-400 to-fuchsia-400" />
                  
                  <Button variant="ghost" className="ml-auto text-zinc-500 hover:text-purple-600 transition-all gap-2 group text-[10px] font-black uppercase tracking-widest">
                    Explorar Dados <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Generator Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-3">
              <div className="h-full glass-morphism premium-border rounded-[2rem] p-0 flex flex-col">
                <GameGenerator />
              </div>
            </motion.div>

            {/* Frequência Bento */}
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 glass-morphism premium-border rounded-[2rem] p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                <PieChart size={140} strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-xl font-display font-black mb-1 flex items-center gap-3">
                  <Target size={18} className="text-indigo-400" /> Tendências
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
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 glass-morphism premium-border rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 hover:bg-white/[0.03]">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 premium-border flex items-center justify-center text-emerald-400">
                  <TrendingUp size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-premium-text-muted uppercase tracking-widest">Consistência</p>
                  <p className="text-2xl font-display font-bold text-white">94.2%</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Índice de Acertos</h4>
                <p className="text-xs text-premium-text-muted">Seu desempenho está acima de 85% dos usuários Pro.</p>
              </div>
            </motion.div>

            {/* Fechamentos Card - Elegant Action */}
            <motion.div 
              variants={itemVariants} 
              className="lg:col-span-4 lg:row-span-1 glass-morphism premium-border rounded-[2rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-white/[0.03] transition-all"
            >
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 premium-border flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-white">Fechamentos Pro</h4>
                <p className="text-sm text-premium-text-muted">Acesse 42 modelos matemáticos exclusivos.</p>
              </div>
              <ArrowUpRight size={20} className="ml-auto text-premium-text-muted group-hover:text-white transition-colors" />
            </motion.div>

             {/* Smart Alerts */}
             <motion.div 
              variants={itemVariants} 
              className="lg:col-span-4 lg:row-span-1 bg-gradient-to-br from-indigo-600 to-indigo-900 premium-border rounded-[2rem] p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl shadow-indigo-500/10"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                <Sparkles size={80} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Dica do Especialista</p>
              <h4 className="text-xl font-display font-bold leading-tight mt-2 mb-4">
                "Ciclo das dezenas prestes a fechar. Foque no número 08 e 22."
              </h4>
              <button className="w-full py-4 bg-white text-premium-dark font-display font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-transform active:scale-95">
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
      "p-3 rounded-xl transition-all duration-300 md:group-hover:bg-white/5",
      active 
        ? "text-indigo-400 md:bg-white/5" 
        : "text-zinc-500 hover:text-zinc-200"
    )}>
      {icon}
    </div>
    <span className={cn(
      "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 md:hidden",
      active ? "text-indigo-400" : "text-zinc-500"
    )}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden md:block absolute -left-4 w-1 h-5 bg-indigo-500 rounded-full"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
  </button>
);

const StatDetail = ({ label, value, percentage, color }: { label: string, value: string, percentage: number, color: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] text-premium-text-muted uppercase font-bold tracking-[0.2em]">{label}</span>
      <span className="text-2xl font-display font-bold text-white">{value}</span>
    </div>
    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
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
