import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ball } from './Ball';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCcw, Save, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GameGenerator = () => {
  const [generatedGame, setGeneratedGame] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({ pairs: 0, odd: 0, primes: 0, sum: 0 });

  const calculateStats = useCallback((nums: number[]) => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    const pCount = nums.filter(n => primes.includes(n)).length;
    const evenCount = nums.filter(n => n % 2 === 0).length;
    const sum = nums.reduce((a, b) => a + b, 0);
    
    setStats({
      pairs: evenCount,
      odd: 15 - evenCount,
      primes: pCount,
      sum
    });
  }, []);

  const generateGame = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const numbers: number[] = [];
      const pool = Array.from({ length: 25 }, (_, i) => i + 1);
      
      // Fisher-Yates shuffle variation to pick 15
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        numbers.push(pool.splice(randomIndex, 1)[0]);
      }

      const sortedNumbers = numbers.sort((a, b) => a - b);
      setGeneratedGame(sortedNumbers);
      calculateStats(sortedNumbers);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 md:p-10 border-b border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-premium-accent mb-2">
              <Zap size={18} fill="currentColor" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Sistemas de Elite</span>
            </div>
            <h2 className="text-3xl font-display font-black text-white">
              Gerador Inteligente
            </h2>
          </div>
          
          <Button 
            onClick={generateGame} 
            disabled={isGenerating}
            className="w-full md:w-auto bg-white text-premium-dark hover:bg-white/90 font-display font-black text-xs uppercase tracking-widest h-14 px-10 rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95"
          >
            {isGenerating ? <RefreshCcw className="animate-spin mr-3" size={16} /> : <Zap className="mr-3" size={16} fill="currentColor" />}
            GERAR JOGO
          </Button>
        </div>

        <div className="min-h-[220px] flex flex-wrap justify-center content-center gap-4 bg-white/[0.02] rounded-[2rem] p-10 premium-border relative overflow-hidden group">
          <AnimatePresence mode="wait">
            {generatedGame.length > 0 ? (
              <motion.div 
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap justify-center gap-4 md:gap-5"
              >
                {generatedGame.map((num, i) => (
                  <motion.div
                    key={`${num}-${i}`}
                    initial={{ y: 30, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 25,
                      delay: i * 0.05 
                    }}
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
                className="flex flex-col items-center justify-center text-premium-text-muted gap-4"
              >
                <div className="flex gap-2">
                   {Array(8).fill(0).map((_, i) => (
                     <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/[0.05]" />
                   ))}
                </div>
                <p className="text-sm font-medium tracking-wide">Aguardando comando de geração...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-8 md:p-10 flex-grow flex flex-col">
        {generatedGame.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4 mb-10"
          >
            <StatCard label="Pares/Ímpares" value={`${stats.pairs}p / ${stats.odd}í`} icon={<TrendingUp size={14}/>} />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14}/>} />
          </motion.div>
        )}

        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Button variant="outline" className="h-14 rounded-2xl bg-white/[0.03] border-white/5 text-premium-text-primary hover:bg-white/[0.08] font-bold text-xs uppercase tracking-widest">
             <Save className="mr-3" size={18} /> Salvar Jogo
           </Button>
           <Button variant="outline" className="h-14 rounded-2xl bg-white/[0.03] border-white/5 text-premium-text-primary hover:bg-white/[0.08] font-bold text-xs uppercase tracking-widest">
             Copiar Dados
           </Button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, variant = 'default' }: { label: string, value: string | number, icon: React.ReactNode, variant?: 'default' | 'success' }) => (
  <div className="bg-white/[0.02] premium-border rounded-2xl p-5">
    <div className="flex items-center gap-2 text-premium-text-muted mb-2">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <div className={cn(
      "text-2xl font-display font-bold",
      variant === 'success' ? "text-emerald-400" : "text-white"
    )}>
      {value}
    </div>
  </div>
);


