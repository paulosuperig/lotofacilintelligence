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
    { 
      title: "R7 - 14 Pontos", 
      desc: "Fechamento matemático focado em garantir o prêmio de 14 pontos com redução estratégica.", 
      numbers: 15,
      warranty: "14 Pontos Garantidos",
      condition: "Acertando 15 dezenas",
      risk: "Moderado",
      tag: "Mais Popular"
    },
    { 
      title: "Especial Ímpares", 
      desc: "Estratégia baseada na tendência histórica de 8 ou 9 números ímpares por concurso.", 
      numbers: 20,
      warranty: "Foco em Tendência",
      condition: "Equilíbrio 9Í / 6P",
      risk: "Estatístico",
      tag: "Tendência"
    },
    { 
      title: "Redução Quadrantes", 
      desc: "Distribuição técnica de dezenas cobrindo todos os quadrantes do volante.", 
      numbers: 18,
      warranty: "Cobertura Total",
      condition: "Máximo de Quadrantes",
      risk: "Baixo",
      tag: "Segurança"
    },
    { 
      title: "Ciclo Mestre", 
      desc: "Análise baseada nas dezenas remanescentes para o fechamento do ciclo atual.", 
      numbers: 22,
      warranty: "Alta Probabilidade",
      condition: "Foco em Atrasadas",
      risk: "Agressivo",
      tag: "Especial"
    },
    { 
      title: "VIP 25-15-14", 
      desc: "O modelo mais avançado que trabalha com todas as 25 dezenas em jogos reduzidos.", 
      numbers: 25,
      warranty: "Performance Máxima",
      condition: "Filtros Avançados",
      risk: "Alta Performance",
      tag: "Premium"
    },
    { 
      title: "Filtro de Soma", 
      desc: "Jogos otimizados para se manterem dentro da média de soma (175 a 215).", 
      numbers: 15,
      warranty: "Equilíbrio Real",
      condition: "Soma 180-210",
      risk: "Conservador",
      tag: "Matemático"
    }
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
            <h2 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Fechamentos PRO</h2>
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
            <div key={i} className="p-6 bg-white dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 rounded-[2rem] hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/5 transition-all group flex flex-col relative overflow-hidden">
              {model.tag && (
                <div className="absolute top-4 right-4 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-purple-200/50">
                  {model.tag}
                </div>
              )}
              
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform shrink-0">
                <ShieldCheck size={20} />
              </div>
              
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">{model.title}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed min-h-[3rem]">{model.desc}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="p-2.5 bg-purple-50/50 dark:bg-zinc-900/50 rounded-xl border border-purple-50 dark:border-zinc-700">
                  <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Garantia</p>
                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{model.warranty}</p>
                </div>
                <div className="p-2.5 bg-purple-50/50 dark:bg-zinc-900/50 rounded-xl border border-purple-50 dark:border-zinc-700">
                  <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Risco</p>
                  <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{model.risk}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-purple-50 dark:border-zinc-700/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{model.numbers} Dezenas</span>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{model.condition}</span>
                </div>
                <Button 
                  onClick={() => handleUseModel(model)}
                  className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-purple-500/20 transition-all active:scale-95"
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
