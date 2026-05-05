import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { generateSecureId } from '@/lib/security/utils';

interface FechamentosPanelProps {
  onBack: () => void;
  onSaveGame: (game: any) => void;
}

export const FechamentosPanel = ({ onBack, onSaveGame }: FechamentosPanelProps) => {
  const { toast } = useToast();
  
  const models = [
    { title: "R7 - 14 Pontos", desc: "Fechamento garantindo 14 pontos se acertar 15 números.", numbers: 15 },
    { title: "Especial Ímpares", desc: "Foco total na tendência de 8 ou 9 ímpares.", numbers: 20 },
    { title: "Redução de Quadrantes", desc: "Distribuição inteligente em todos os quadrantes.", numbers: 18 },
    { title: "Ciclo Mestre", desc: "Modelos baseados no ciclo das dezenas.", numbers: 22 },
    { title: "VIP 25-15-14", desc: "Sistema premium de alta performance.", numbers: 25 },
    { title: "Filtro de Soma", desc: "Jogos balanceados por soma de dezenas.", numbers: 15 }
  ];

  const handleUseModel = (model: typeof models[0]) => {
    const numbers: number[] = [];
    const pool = Array.from({ length: 25 }, (_, idx) => idx + 1);
    for (let k = 0; k < model.numbers && pool.length > 0; k++) {
      const randIdx = Math.floor(Math.random() * pool.length);
      numbers.push(pool.splice(randIdx, 1)[0]);
    }
    const sorted = numbers.sort((a, b) => a - b);
    
    onSaveGame({ 
      id: generateSecureId(),
      numbers: sorted, 
      timestamp: Date.now(), 
      model: model.title,
      type: 'Modelo'
    });

    toast({
      title: `Modelo "${model.title}" gerado!`,
      description: `${model.numbers} dezenas: ${sorted.map(n => n.toString().padStart(2, '0')).join(' ')}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Fechamentos PRO</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Modelos matemáticos exclusivos</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar ao Início
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, i) => (
            <div key={i} className="p-8 bg-purple-50/50 border border-purple-100 rounded-[2rem] hover:border-purple-300 transition-all group flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform shrink-0">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2 leading-tight min-h-[3.5rem]">{model.title}</h4>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed flex-grow">{model.desc}</p>
              <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-purple-100">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{model.numbers} Dezenas</span>
                <Button 
                  onClick={() => handleUseModel(model)}
                  className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-purple-500/20"
                >
                  Usar Modelo
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
