import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LotteryResult } from "@/types/lottery";
import { GeneratorCard } from "./bento/GeneratorCard";
import { ResultCard } from "./bento/ResultCard";
import { TrendsCard } from "./bento/TrendsCard";
import { HistoryStatusCard } from "./bento/HistoryStatusCard";
import { FechamentosCard } from "./bento/FechamentosCard";
import { TipsCard } from "./bento/TipsCard";

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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 xs:gap-4 md:gap-6 auto-rows-[minmax(130px,auto)]"
    >
      <motion.div id="generator-section" variants={itemVariants} className="lg:col-span-8 lg:row-span-3">
        <GeneratorCard />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-2">
        <ResultCard latestResult={latestResult} isLoading={isLoading} />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 xl:col-span-4">
        <TrendsCard />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 xl:col-span-4">
        <HistoryStatusCard historyLength={historyLength} onClearHistory={onClearHistory} />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 xl:col-span-4">
        <FechamentosCard onNavigate={() => onNavigate('stats')} />
      </motion.div>

      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1">
        <TipsCard onNavigate={() => onNavigate('dicas')} />
      </motion.div>
    </motion.div>
  );
};
