import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ball } from './Ball';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCcw, Save, TrendingUp, History, MessageCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SavedGame {
  numbers: number[];
  timestamp: number;
}

const WhatsAppIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="20" 
    height="20" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const GameGenerator = () => {
  const [generatedGame, setGeneratedGame] = useState<number[]>([]);
  const [history, setHistory] = useState<SavedGame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({ pairs: 0, odd: 0, primes: 0, sum: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('lottery_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedGame[];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter(game => game.timestamp > sevenDaysAgo);
        setHistory(filtered);
        
        if (filtered.length !== parsed.length) {
          localStorage.setItem('lottery_history', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  const saveHistory = (newHistory: SavedGame[]) => {
    setHistory(newHistory);
    localStorage.setItem('lottery_history', JSON.stringify(newHistory));
  };



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
      
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        numbers.push(pool.splice(randomIndex, 1)[0]);
      }

      const sortedNumbers = numbers.sort((a, b) => a - b);
      setGeneratedGame(sortedNumbers);
      
      const newGame: SavedGame = {
        numbers: sortedNumbers,
        timestamp: Date.now()
      };
      saveHistory([newGame, ...history].slice(0, 50));
      
      calculateStats(sortedNumbers);
      setIsGenerating(false);
    }, 800);
  };


  const shareOnWhatsApp = (game: number[]) => {
    const gameText = game.map(n => n.toString().padStart(2, '0')).join(' ');
    const text = `🔥 *Gerador Inteligente* 🔥\n\nConfira meu novo jogo:\n✅ *${gameText}*\n\nGerado em: ${window.location.origin}\n\n🍀 Boa sorte!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };



  return (
    <div className="flex flex-col h-full">
      <div className="p-6 md:p-12 border-b border-purple-50">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-600 mb-2 md:mb-3">
              <Zap size={14} className="md:w-4 md:h-4" fill="currentColor" />
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] md:tracking-[0.25em]">Sistemas Pro</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 leading-tight">
              Gerador<br className="hidden sm:block" /> Inteligente
            </h2>
          </div>
          
          <Button 
            onClick={generateGame} 
            disabled={isGenerating}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed font-display font-bold text-[11px] uppercase tracking-widest h-12 px-6 rounded-xl shadow-xl shadow-purple-500/20 transition-all active:scale-95"
          >
            {isGenerating ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <Zap className="mr-2" size={14} fill="currentColor" />}
            Gerar Jogo
          </Button>
        </div>

        <div className="min-h-[180px] md:min-h-[220px] flex flex-wrap justify-center content-center gap-2 md:gap-4 bg-purple-50/50 rounded-3xl md:rounded-[1.5rem] p-6 md:p-10 border border-purple-100 relative overflow-hidden group shadow-inner">
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
                     <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-200" />
                   ))}
                </div>
                <p className="text-sm font-medium tracking-wide">Aguardando comando de geração...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-8 md:p-12 flex-grow flex flex-col">
        {generatedGame.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mb-10"
          >
            <StatCard 
              label="Pares / Ímpares" 
              value={`${stats.pairs} pares e ${stats.odd} ímpares`} 
              icon={<TrendingUp size={14}/>} 
            />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14}/>} />
          </motion.div>
        )}

        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Button 
            variant="outline" 
            onClick={() => {
              toast({
                title: "Jogo salvo!",
                description: "Seu jogo foi armazenado no histórico.",
              });
            }}
            disabled={generatedGame.length === 0}
            className="h-12 rounded-xl bg-white border-purple-100 text-zinc-900 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
          >
             <Save className="mr-3" size={16} /> Salvar Jogo
           </Button>
           <Button 
            variant="outline" 
            onClick={() => {
              const text = generatedGame.map(n => n.toString().padStart(2, '0')).join(' ');
              navigator.clipboard.writeText(text);
              toast({
                title: "Copiado!",
                description: "Números copiados para a área de transferência.",
              });
            }}
            disabled={generatedGame.length === 0}
            className="h-12 rounded-xl bg-white border-purple-100 text-zinc-900 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
          >
             Copiar
           </Button>
        </div>

        {history.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-premium-text-muted">
                <History size={16} />
                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em]">Histórico (7 dias)</h3>
              </div>
              <span className="text-[9px] font-bold text-purple-400 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">
                {history.length} jogos
              </span>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {history.map((item, idx) => (
                  <motion.div
                    key={`${item.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 bg-white border border-purple-50 rounded-xl shadow-sm hover:border-purple-200 transition-all group"
                  >
                    <div className="flex flex-col gap-2 w-[80%]">
                      <div className="flex items-center gap-2">
                        <Calendar size={10} className="text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">
                          {new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.numbers.map((num, i) => (
                          <span key={i} className="text-[11px] font-bold text-purple-700 bg-purple-50 w-6 h-6 flex items-center justify-center rounded-md">
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => shareOnWhatsApp(item.numbers)}
                      className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors shrink-0"
                      title="Compartilhar no WhatsApp"
                    >
                      <WhatsAppIcon />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


const StatCard = ({ label, value, icon, variant = 'default' }: { label: string, value: string | number, icon: React.ReactNode, variant?: 'default' | 'success' }) => (
  <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm min-w-0 flex flex-col justify-center">
    <div className="flex items-center gap-1.5 text-premium-text-muted mb-1.5 min-w-0">
      <span className="shrink-0">{icon}</span>
      <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">{label}</span>
    </div>
    <div className={cn(
      "text-lg md:text-xl font-display font-bold leading-tight",
      variant === 'success' ? "text-emerald-600" : "text-zinc-900"
    )}>
      {value}
    </div>
  </div>
);


