import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  History, 
  Calendar, 
  Target, 
  PieChart, 
  Flame, 
  Snowflake, 
  TrendingUp, 
  Trash2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Ball } from "@/components/lottery/Ball";
import { GameGenerator } from "@/components/lottery/GameGenerator";
import { formatCurrency } from "@/lib/utils";
import { LotteryResult } from "@/types/lottery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BentoGridProps {
  latestResult: LotteryResult | null;
  isLoading: boolean;
  historyLength: number;
  onClearHistory: () => void;
  onNavigate: (tab: string) => void;
}

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

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

export const BentoGrid = ({ 
  latestResult, 
  isLoading, 
  historyLength, 
  onClearHistory,
  onNavigate 
}: BentoGridProps) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
    >
      {/* Generator Bento */}
      <motion.div id="generator-section" variants={itemVariants} className="lg:col-span-8 lg:row-span-3">
        <div className="h-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-0 flex flex-col shadow-xl shadow-purple-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-purple-900 pointer-events-none hidden md:block">
            <Zap size={200} strokeWidth={0.5} />
          </div>
          <GameGenerator />
        </div>
      </motion.div>

      {/* Official Result Bento */}
      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-2 bg-white/50 dark:bg-zinc-900/50 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-8 relative group overflow-hidden shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition-colors duration-500">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 text-purple-900 hidden md:block">
          <Trophy size={180} strokeWidth={0.5} />
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="mb-4 md:mb-6">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[8px] font-bold mb-3 md:mb-4 uppercase tracking-widest">
              <History size={10} /> Sorteio
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">
              Nº {latestResult?.concurso || "---"}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar size={12} strokeWidth={2} /> {latestResult ? latestResult.data : "---"}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-6 md:mb-8">
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
            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 px-4 py-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 text-center">
              <p className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 uppercase font-bold tracking-[0.2em] mb-1.5">Próximo Prêmio</p>
              <p className="text-xl font-display font-bold text-emerald-500 tabular-nums leading-none whitespace-nowrap">
                {latestResult ? formatCurrency(latestResult.valorEstimadoProximoConcurso || 0) : "R$ ---"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center px-2">
                <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Pares</p>
                <p className="text-lg font-display font-bold text-zinc-800 dark:text-zinc-200">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length : "0"}</p>
              </div>
              <div className="text-center px-2">
                <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Ímpares</p>
                <p className="text-lg font-display font-bold text-zinc-800 dark:text-zinc-200">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length : "0"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tendências Bento */}
      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-7 flex flex-col group overflow-hidden relative shadow-sm">
        <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 text-purple-900 pointer-events-none hidden md:block">
          <PieChart size={160} strokeWidth={1} />
        </div>

        <div className="flex flex-col items-center justify-between mb-4 md:mb-5 relative z-10 text-center md:text-left md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg md:text-xl font-display font-bold mb-1 flex items-center gap-2">
              <Target size={18} className="text-purple-600" /> Tendências
            </h3>
            <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Últimos 10 jogos</p>
          </div>
          <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
            Live
          </span>
        </div>

        <div className="space-y-4 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <Flame size={10} /> Mais Quentes
              </span>
              <span className="text-[9px] font-bold text-zinc-400">↑ Frequência alta</span>
            </div>
            <div className="flex gap-2">
              {["20", "10", "25", "01", "13"].map(num => (
                <Ball key={`hot-${num}`} number={num} active size="sm" />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                <Snowflake size={10} /> Mais Frias
              </span>
              <span className="text-[9px] font-bold text-zinc-400">↓ Atrasadas</span>
            </div>
            <div className="flex gap-2">
              {["04", "07", "12", "18", "22"].map(num => (
                <span key={`cold-${num}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-bold">
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Insights Bento */}
      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 shadow-sm relative">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div className="text-right">
            {historyLength > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Limpar Histórico">
                    <Trash2 size={16} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja apagar todos os seus jogos salvos do histórico?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onClearHistory} className="bg-red-500 hover:bg-red-600 text-white">
                      Limpar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Status do Histórico</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {historyLength > 0 
              ? `Você possui ${historyLength} ${historyLength === 1 ? 'jogo salvo' : 'jogos salvos'} no histórico.`
              : "Nenhum jogo salvo recentemente."}
          </p>
        </div>
      </motion.div>

      {/* Fechamentos Card */}
      <motion.div 
        variants={itemVariants} 
        onClick={() => onNavigate('stats')}
        className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-purple-50/50 transition-all shadow-sm"
      >
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h4 className="text-lg font-display font-bold text-zinc-900">Fechamentos Pro</h4>
          <p className="text-sm text-zinc-500">Acesse modelos matemáticos exclusivos.</p>
        </div>
        <ArrowUpRight size={20} className="ml-auto text-zinc-400 group-hover:text-purple-600 transition-colors" />
      </motion.div>

      {/* Smart Alerts */}
      <motion.div 
        variants={itemVariants} 
        onClick={() => onNavigate('dicas')}
        className="lg:col-span-4 lg:row-span-1 bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-500 rounded-3xl md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl shadow-purple-500/10 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
          <Sparkles size={80} />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2 md:mb-1">Dica do Especialista</p>
          <h4 className="text-lg md:text-xl font-display font-bold leading-tight mb-6">
            "Ciclo das dezenas prestes a fechar. Foque no número 08 e 22."
          </h4>
          <button 
            className="w-full py-3.5 md:py-4 bg-white text-purple-900 font-display font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 hover:bg-purple-50 transition-colors active:scale-95"
          >
            Ver Análise Completa
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
