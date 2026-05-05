import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ball } from "@/components/lottery/Ball";
import { getLatestResult } from "@/services/lotteryApi";
import { LotteryResult } from "@/types/lottery";
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

  return (
    <div className="min-h-screen bg-premium-gradient text-slate-100 font-sans selection:bg-purple-500/30">
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <aside className="fixed bottom-0 left-0 w-full h-16 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 z-50 md:top-0 md:left-0 md:w-24 md:h-full md:border-r md:border-t-0 flex md:flex-col items-center justify-around md:justify-center gap-8 py-4">
        <div className="hidden md:flex absolute top-8 left-0 w-full justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Trophy className="text-white" size={24} />
          </div>
        </div>
        
        <NavIcon icon={<LayoutDashboard size={24} />} active label="Home" />
        <NavIcon icon={<Zap size={24} />} label="Gerador" />
        <NavIcon icon={<TrendingUp size={24} />} label="Stats" />
        <NavIcon icon={<History size={24} />} label="Histórico" />
        
        <div className="hidden md:flex flex-col gap-6 mt-auto mb-8">
           <NavIcon icon={<Settings size={24} />} label="Ajustes" />
           <NavIcon icon={<LogOut size={24} />} label="Sair" />
        </div>
      </aside>

      <main className="pb-24 md:pb-8 md:pl-24 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Apostador Premium</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">Bem-vindo à sua central de inteligência Lotofácil.</p>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <BellIcon size={20} className="text-slate-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-slate-900" />
              </button>
              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-300">João Silva</p>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Membro Pro</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold"> JS </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Main Result Card */}
            <div className="lg:col-span-8 space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-slate-900/40 border-white/5 backdrop-blur-md overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Trophy size={120} />
                  </div>
                  <CardContent className="p-8">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-3 uppercase tracking-wider">
                          <History size={12} /> Último Concurso
                        </div>
                        <h2 className="text-4xl font-black text-white">
                          Concurso {latestResult?.concurso || "---"}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {latestResult ? formatDate(latestResult.data) : "---"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-indigo-400 font-medium">Sorteio Oficial Caixa</span>
                        </div>
                      </div>
                      
                      <div className="text-right bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Prêmio Estimado</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {latestResult ? formatCurrency(latestResult.valor_estimado_proximo_concurso) : "R$ ---"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 md:gap-4 mb-8">
                      {isLoading ? (
                        Array(15).fill(0).map((_, i) => (
                          <div key={i} className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                        ))
                      ) : (
                        latestResult?.dezenas.map((num, i) => (
                          <motion.div
                            key={num}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Ball number={num} active size="lg" />
                          </motion.div>
                        ))
                      )}
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-wrap gap-6 items-center justify-between">
                      <div className="flex gap-4">
                        <StatBrief label="Pares" value="08" />
                        <StatBrief label="Ímpares" value="07" />
                        <StatBrief label="Primos" value="05" />
                      </div>
                      <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 group">
                        Ver detalhes completos <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions / Featured */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ActionCard 
                    title="Simulador de Inteligência"
                    desc="Gere jogos baseados em tendências e estatísticas avançadas de paridade."
                    icon={<Zap className="text-amber-400" />}
                    gradient="from-amber-500/10 to-orange-500/10"
                    borderColor="border-amber-500/20"
                 />
                 <ActionCard 
                    title="Conferidor Automático"
                    desc="Suba seus jogos e deixe que o sistema valide cada acerto instantaneamente."
                    icon={<Sparkles className="text-indigo-400" />}
                    gradient="from-indigo-500/10 to-purple-500/10"
                    borderColor="border-indigo-500/20"
                 />
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-4 space-y-8">
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.3 }}
               >
                 <Card className="bg-slate-900/40 border-white/5 backdrop-blur-md">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-400" /> Frequência Quente
                      </h3>
                      
                      <div className="space-y-4">
                        {[
                          { num: "20", freq: 154, color: "bg-emerald-500" },
                          { num: "10", freq: 148, color: "bg-emerald-500/80" },
                          { num: "25", freq: 142, color: "bg-emerald-500/60" },
                          { num: "01", freq: 139, color: "bg-emerald-500/40" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <Ball number={item.num} active size="sm" />
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-400">Sorteado {item.freq} vezes</span>
                                <span className="text-slate-200 font-bold">{Math.round((item.freq/3150)*100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.freq/160)*100}%` }}
                                  className={cn("h-full rounded-full", item.color)} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300">
                        Ver Relatório Completo
                      </Button>
                    </CardContent>
                 </Card>
               </motion.div>

               {/* Upcoming Draw */}
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.4 }}
               >
                 <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none shadow-xl shadow-purple-900/20 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Zap size={80} />
                    </div>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <Zap size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Gerador Inteligente</h3>
                      <p className="text-indigo-100/70 text-sm mb-6">
                        Crie agora 5 jogos competitivos baseados no fechamento matemático atual.
                      </p>
                      <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-6 rounded-xl shadow-lg shadow-indigo-950/20">
                        CRIAR MEUS JOGOS
                      </Button>
                    </CardContent>
                 </Card>
               </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavIcon = ({ icon, active = false, label }: { icon: React.ReactNode, active?: boolean, label: string }) => (
  <button className="flex flex-col items-center gap-1 group relative">
    <div className={cn(
      "p-3 rounded-2xl transition-all duration-300",
      active 
        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
    )}>
      {icon}
    </div>
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-widest mt-1 md:hidden",
      active ? "text-purple-400" : "text-slate-500"
    )}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden md:block absolute -left-1 w-1 h-8 bg-purple-500 rounded-r-full"
      />
    )}
  </button>
);

const StatBrief = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</span>
    <span className="text-lg font-bold text-slate-200">{value}</span>
  </div>
);

const ActionCard = ({ title, desc, icon, gradient, borderColor }: { title: string, desc: string, icon: React.ReactNode, gradient: string, borderColor: string }) => (
  <motion.div whileHover={{ y: -5 }} className="cursor-pointer h-full">
    <Card className={cn("bg-slate-900/40 border-white/5 backdrop-blur-md hover:border-white/10 transition-all h-full overflow-hidden relative")}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
      <CardContent className="p-6 relative z-10 flex flex-col h-full">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 border bg-slate-900/50", borderColor)}>
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 flex-grow">{desc}</p>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider group">
          Explorar ferramenta <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default Index;
