import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Ball } from "@/components/lottery/Ball";

interface TipsPanelProps {
  onBack: () => void;
}

export const TipsPanel = ({ onBack }: TipsPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-10 gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-2">Dicas do Especialista</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Análises estratégicas baseadas nos últimos 5 anos de resultados</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar ao Início
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 border border-purple-100 dark:border-zinc-700 rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Números "Quentes" (5 Anos)</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">Dezenas que apareceram em mais de 65% dos sorteios desde 2021.</p>
            <div className="flex flex-wrap gap-3">
              {[13, 20, 24, 10, 1, 11, 25, 4].map(num => (
                <Ball key={num} number={num.toString()} active size="md" />
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

        <div className="mt-8 p-8 bg-zinc-900 rounded-[2.5rem] text-white overflow-hidden relative group">
          <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
            <Target size={200} />
          </div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Sparkles className="text-purple-400" /> Insight Premium
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            A análise histórica mostra que jogos com soma entre 180 e 210 representam 72% dos ganhadores da faixa principal nos últimos 5 anos. Evite jogos com soma inferior a 150 ou superior a 240.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pares Ideal</p>
              <p className="text-lg font-bold">7 ou 8</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Primos Ideal</p>
              <p className="text-lg font-bold">5 ou 6</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Repetidos</p>
              <p className="text-lg font-bold">9 ou 10</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Moldura</p>
              <p className="text-lg font-bold">10 ou 11</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
