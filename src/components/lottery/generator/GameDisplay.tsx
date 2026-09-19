import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ball } from '../Ball';

interface GameDisplayProps {
  numbers: number[] | null;
}

/** Área central do gerador: dezenas sorteadas ou o estado "pronto para gerar". */
export const GameDisplay = ({ numbers }: GameDisplayProps) => (
  <div className="min-h-[140px] md:min-h-[200px] flex flex-wrap justify-center content-center gap-2 sm:gap-4 md:gap-6 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl md:rounded-[2rem] p-4 sm:p-8 md:p-12 border border-zinc-100 dark:border-zinc-800 shadow-inner relative overflow-hidden">
    <AnimatePresence mode="wait">
      {numbers ? (
        <motion.div
          key="game"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap justify-center gap-1.5 sm:gap-3 md:gap-5"
        >
          {numbers.map((num, i) => (
            <motion.div
              key={`${num}-${i}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
            >
              <Ball number={num} active size="lg" />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4"
        >
          <div className="flex gap-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-purple-300 dark:bg-purple-900"
                />
              ))}
          </div>
          <p className="text-xs font-medium tracking-widest uppercase">Pronto para gerar</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
