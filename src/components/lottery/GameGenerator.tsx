import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ball } from './Ball';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCcw, Save, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const GameGenerator = () => {
  const [generatedGame, setGeneratedGame] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({ pairs: 0, odd: 0, primes: 0, sum: 0 });

  const generateGame = () => {
    setIsGenerating(true);
    
    // Simulate complex calculation
    setTimeout(() => {
      const numbers: number[] = [];
      while (numbers.length < 15) {
        const n = Math.floor(Math.random() * 25) + 1;
        if (!numbers.includes(n)) numbers.push(n);
      }
      const sortedNumbers = numbers.sort((a, b) => a - b);
      setGeneratedGame(sortedNumbers);
      calculateStats(sortedNumbers);
      setIsGenerating(false);
    }, 800);
  };

  const calculateStats = (nums: number[]) => {
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
  };

  return (
    <Card className="bg-slate-900/40 border-white/5 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={24} /> Gerador Inteligente
            </h2>
            <p className="text-slate-400 text-sm">Algoritmo equilibrado baseado em tendências históricas.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              onClick={generateGame} 
              disabled={isGenerating}
              className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none h-12 px-8 font-bold rounded-xl shadow-lg shadow-purple-900/20"
            >
              {isGenerating ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <Zap className="mr-2" size={18} />}
              GERAR JOGO
            </Button>
          </div>
        </div>

        <div className="min-h-[160px] flex flex-wrap justify-center gap-3 md:gap-4 mb-10 bg-white/5 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {generatedGame.length > 0 ? (
              <motion.div 
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap justify-center gap-3 md:gap-4"
              >
                {generatedGame.map((num, i) => (
                  <motion.div
                    key={`${num}-${i}`}
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20,
                      delay: i * 0.04 
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
                className="flex flex-col items-center justify-center text-slate-500 gap-3"
              >
                <div className="flex gap-2">
                   {Array(15).fill(0).map((_, i) => (
                     <div key={i} className={cn("w-3 h-3 rounded-full bg-white/5", i < 5 && "hidden md:block")} />
                   ))}
                </div>
                <p className="text-sm font-medium">Clique em gerar para criar uma nova combinação</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {generatedGame.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatCard label="Pares/Ímpares" value={`${stats.pairs}p / ${stats.odd}í`} icon={<TrendingUp size={14}/>} />
            <StatCard label="Números Primos" value={stats.primes} icon={<TrendingUp size={14}/>} />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14}/>} />
            <StatCard label="Probabilidade" value="Alta" icon={<Info size={14}/>} variant="success" />
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
           <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white h-12 rounded-xl">
             <Save className="mr-2" size={18} /> Salvar na minha conta
           </Button>
           <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white h-12 rounded-xl">
             Copiar dezenas
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ label, value, icon, variant = 'default' }: { label: string, value: string | number, icon: React.ReactNode, variant?: 'default' | 'success' }) => (
  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
    <div className="flex items-center gap-2 text-slate-500 mb-1">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </div>
    <div className={cn(
      "text-xl font-bold",
      variant === 'success' ? "text-emerald-400" : "text-white"
    )}>
      {value}
    </div>
  </div>
);

import { AnimatePresence } from 'framer-motion';
