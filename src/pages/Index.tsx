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
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lottery_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setHistory(parsed.filter((g: any) => g.timestamp > sevenDaysAgo));
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeTab]);
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
      <aside className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md h-16 bg-white/80 backdrop-blur-xl border border-purple-100 rounded-2xl z-50 md:top-1/2 md:left-8 md:-translate-x-0 md:-translate-y-1/2 md:w-20 md:h-[600px] md:flex-col md:rounded-[2.5rem] flex items-center justify-around md:justify-start md:gap-8 py-4 px-6 md:px-0 md:py-10 shadow-xl shadow-purple-500/10 transition-all duration-300">
        <div className="hidden md:flex flex-col items-center mb-4">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-300">
             <Trophy size={22} className="text-white" />
           </div>
        </div>
        <div className="flex items-center justify-around w-full md:flex-col md:gap-8">
          <NavIcon icon={<LayoutDashboard size={22} strokeWidth={1.5} />} active={activeTab === 'home'} label="Home" onClick={() => setActiveTab('home')} />
          <NavIcon icon={<Zap size={22} strokeWidth={1.5} />} active={activeTab === 'gerador'} label="Gerador" onClick={() => {
            setActiveTab('gerador');
            document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
          }} />
          <NavIcon icon={<TrendingUp size={22} strokeWidth={1.5} />} active={activeTab === 'stats'} label="Stats" onClick={() => {
            setActiveTab('stats');
            toast({ title: "Módulo de Estatísticas", description: "Carregando análises detalhadas..." });
          }} />
          <NavIcon icon={<History size={22} strokeWidth={1.5} />} active={activeTab === 'historico'} label="Histórico" onClick={() => {
            setActiveTab('historico');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        </div>
        <div className="hidden md:flex flex-col gap-8 mt-auto mb-2 pt-8 border-t border-purple-50 w-full items-center">
           <NavIcon icon={<Settings size={22} strokeWidth={1.5} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
           <NavIcon icon={<LogOut size={22} strokeWidth={1.5} />} label="Sair" onClick={() => toast({ title: "Sair", description: "Encerrando sessão..." })} />
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
          <AnimatePresence mode="wait">
            {activeTab === 'historico' ? (
              <motion.div
                key="history-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">Seu Histórico</h2>
                      <p className="text-zinc-500 text-sm">Jogos salvos nos últimos 7 dias</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar ao Início
                    </Button>
                  </div>

                  {history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map((item, idx) => (
                        <div key={idx} className="p-6 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                              {new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.numbers.map((num: number, i: number) => (
                              <span key={i} className="w-8 h-8 rounded-lg bg-white border border-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shadow-sm">
                                {num.toString().padStart(2, '0')}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-200 mb-6">
                        <History size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">Nenhum jogo encontrado</h3>
                      <p className="text-zinc-500 max-w-xs">Gere novos jogos no Gerador Inteligente para vê-los aqui.</p>
                      <Button 
                        onClick={() => setActiveTab('gerador')}
                        className="mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-8"
                      >
                        Ir para Gerador
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'stats' ? (
              <motion.div
                key="fechamentos-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">Fechamentos PRO</h2>
                      <p className="text-zinc-500 text-sm">Modelos matemáticos exclusivos para aumentar suas chances</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar ao Início
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: "R7 - 14 Pontos", desc: "Fechamento garantindo 14 pontos se acertar 15 números.", numbers: 15 },
                      { title: "Especial Ímpares", desc: "Foco total na tendência de 8 ou 9 ímpares.", numbers: 20 },
                      { title: "Redução de Quadrantes", desc: "Distribuição inteligente em todos os quadrantes.", numbers: 18 },
                      { title: "Ciclo Mestre", desc: "Modelos baseados no ciclo das dezenas.", numbers: 22 },
                      { title: "VIP 25-15-14", desc: "Sistema premium de alta performance.", numbers: 25 },
                      { title: "Filtro de Soma", desc: "Jogos balanceados por soma de dezenas.", numbers: 15 }
                    ].map((model, i) => (
                      <div key={i} className="p-8 bg-purple-50/50 border border-purple-100 rounded-[2rem] hover:border-purple-300 transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                          <ShieldCheck size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 mb-2">{model.title}</h4>
                        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">{model.desc}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{model.numbers} dezenas</span>
                          <Button className="h-8 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest">
                            Usar Modelo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">Dicas do Especialista</h2>
                      <p className="text-zinc-500 text-sm">Análises estratégicas baseadas nos últimos 5 anos de resultados</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar ao Início
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-[2.5rem]">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                          <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Números "Quentes" (5 Anos)</h3>
                      </div>
                      <p className="text-sm text-zinc-600 mb-8 leading-relaxed">Dezenas que apareceram em mais de 65% dos sorteios desde 2021.</p>
                      <div className="flex flex-wrap gap-3">
                        {[13, 20, 24, 10, 01, 11, 25, 04].map(num => (
                          <Ball key={num} number={num} active size="md" />
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-white border border-purple-100 rounded-[2.5rem] shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                          <TrendingUp size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Estratégia de Quadrantes</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q1 (01-05)</span>
                          <span className="text-sm font-bold text-purple-600">Alta Frequência</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q3 (11-15)</span>
                          <span className="text-sm font-bold text-emerald-500">Equilibrado</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q5 (21-25)</span>
                          <span className="text-sm font-bold text-amber-500">Padrão de Repetição</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-8 bg-zinc-900 rounded-[2.5rem] text-white">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <Sparkles className="text-purple-400" /> Insight Premium
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      A análise histórica mostra que jogos com soma entre 180 e 210 representam 72% dos ganhadores da faixa principal nos últimos 5 anos. Evite jogos com soma inferior a 150 ou superior a 240.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pares Ideal</p>
                        <p className="text-lg font-bold">7 ou 8</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Primos Ideal</p>
                        <p className="text-lg font-bold">5 ou 6</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Repetidos</p>
                        <p className="text-lg font-bold">9 ou 10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Moldura</p>
                        <p className="text-lg font-bold">10 ou 11</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                key="home-page"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
              >
                
                {/* Generator Bento - Main Focus */}
                <motion.div id="generator-section" variants={itemVariants} className="lg:col-span-8 lg:row-span-3">
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
                setActiveTab('stats');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

const NavIcon = ({ icon, active = false, label, onClick }: { icon: React.ReactNode, active?: boolean, label: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1 group relative outline-none transition-transform active:scale-90"
  >
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
