import React from 'react';
import { Sparkles } from 'lucide-react';

interface TipsCardProps {
  onNavigate: () => void;
}

export const TipsCard = ({ onNavigate }: TipsCardProps) => (
  <div 
    onClick={onNavigate}
    className="bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-500 rounded-3xl md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl shadow-purple-500/10 cursor-pointer h-full"
  >
    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
      <Sparkles size={80} />
    </div>
    <div className="relative z-10 text-center md:text-left">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2 md:mb-1">Dica do Especialista</p>
      <h4 className="text-sm xs:text-base md:text-xl font-display font-bold leading-tight mb-6">
        "Ciclo das dezenas prestes a fechar. Foque no número 08 e 22."
      </h4>
      <button 
        className="w-full py-3.5 md:py-4 bg-white text-purple-900 font-display font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 hover:bg-purple-50 transition-colors active:scale-95"
      >
        Ver Análise Completa
      </button>
    </div>
  </div>
);
