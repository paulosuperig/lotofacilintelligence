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
import { ConferidorCard } from "./bento/ConferidorCard";
import { BolaoCard } from "./bento/BolaoCard";

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

export const BentoGrid = React.memo(({ 
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
      <motion.div id="generator-section" variants={itemVariants} className="col-span-2 lg:col-span-8">
        <GeneratorCard />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4 flex flex-col gap-3 sm:gap-4 lg:gap-6">
        <ResultCard latestResult={latestResult} isLoading={isLoading} />
        <TrendsCard onNavigate={() => onNavigate('estatisticas')} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <HistoryStatusCard historyLength={historyLength} onClearHistory={onClearHistory} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <FechamentosCard onNavigate={() => onNavigate('stats')} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4">
        <TipsCard onNavigate={() => onNavigate('dicas')} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <BacktestCard onNavigate={() => onNavigate('provareal')} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
        <ConferidorCard onNavigate={() => onNavigate('conferidor')} />
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-2 lg:col-span-4">
        <BolaoCard onNavigate={() => onNavigate('bolao')} />
      </motion.div>
    </motion.div>
  );
});

BentoGrid.displayName = 'BentoGrid';
