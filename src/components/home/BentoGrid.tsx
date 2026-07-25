import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LotteryResult } from "@/types/lottery";
import { GeneratorCard } from "./bento/GeneratorCard";
import { ResultCard } from "./bento/ResultCard";
import { TrendsCard } from "./bento/TrendsCard";
import { HistoryStatusCard } from "./bento/HistoryStatusCard";
import { FechamentosCard } from "./bento/FechamentosCard";
import { TipsCard } from "./bento/TipsCard";
import { BacktestCard } from "./bento/BacktestCard";

interface BentoGridProps {
  latestResult: LotteryResult | null;
  isLoading: boolean;
  historyLength: number;
  onClearHistory: () => void;
  onNavigate: (tab: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
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
      className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 lg:items-start"
    >
      {/* Gerador: destaque, largura total (no desktop ocupa 8/12) */}
      <motion.div id="generator-section" variants={itemVariants} className="col-span-2 lg:col-span-8">
        <GeneratorCard />
      </motion.div>

      {/* Coluna direita: Resultado + Tendências empilhados num container próprio.
          Desacopla a altura desta coluna da do gerador — com lg:items-start no
          grid, esta coluna fica com altura natural no topo, então o card de
          resultado NÃO é esticado nem "desce" quando o gerador cresce. */}
      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4 flex flex-col gap-3 sm:gap-4 lg:gap-6">
        <ResultCard latestResult={latestResult} isLoading={isLoading} />
        <TrendsCard onNavigate={() => onNavigate('estatisticas')} />
      </motion.div>

      {/* Cards compactos lado a lado (2-up) no mobile */}
      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <HistoryStatusCard historyLength={historyLength} onClearHistory={onClearHistory} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <FechamentosCard onNavigate={() => onNavigate('stats')} />
      </motion.div>

      {/* CTA de dicas: largura total no mobile para dar impacto */}
      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4">
        <TipsCard onNavigate={() => onNavigate('dicas')} />
      </motion.div>

      {/* Prova Real (backtest) — transparência/assertividade */}
      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4">
        <BacktestCard onNavigate={() => onNavigate('provareal')} />
      </motion.div>
    </motion.div>
  );
};
