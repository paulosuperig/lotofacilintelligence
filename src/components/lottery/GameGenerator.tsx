import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ball } from './Ball';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  RefreshCcw, 
  Save, 
  TrendingUp, 
  History, 
  Copy, 
  Calendar, 
  Check,
  AlertCircle 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import { SavedGame } from '@/types/lottery';

const WhatsAppIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="18" 
    height="18" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const GameGenerator = () => {
  const { history, saveToHistory, generateSmartGame, isGameDuplicate } = useLottery();
  const [currentResult, setCurrentResult] = useState<SavedGame | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const { toast } = useToast();

  const stats = useMemo(() => {
    if (!currentResult) return null;
    const nums = currentResult.numbers;
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
    
    const evenCount = nums.filter(n => n % 2 === 0).length;
    const pCount = nums.filter(n => primes.includes(n)).length;
    const moldCount = nums.filter(n => moldNumbers.includes(n)).length;
    const sum = nums.reduce((a, b) => a + b, 0);
    
    let maxSeq = 1;
    let currentSeq = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1] + 1) {
        currentSeq++;
        maxSeq = Math.max(maxSeq, currentSeq);
      } else {
        currentSeq = 1;
      }
    }
    
    return {
      pairs: evenCount,
      odd: 15 - evenCount,
      primes: pCount,
      sum,
      mold: moldCount,
      sequence: maxSeq
    };
  }, [currentResult]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsCopied(false);
    
    // Simulate thinking process for "Smart" feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newGame = generateSmartGame();
    setCurrentResult(newGame);
    await saveToHistory([newGame]);
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!currentResult) return;
    
    const result = await saveToHistory([currentResult]);
    
    if (result.duplicate) {
      setShowDuplicateModal(true);
      return;
    }

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Jogo salvo no seu histórico.",
      });
    }
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    const text = currentResult.numbers.map(n => n.toString().padStart(2, '0')).join(' ');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({
      title: "Copiado!",
      description: "Números copiados com sucesso.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  /**
   * Performance Engineering: Optimized URI formatting for WhatsApp
   * Follows Platform Engineering standards for resilient external links
   */
  const shareOnWhatsApp = useCallback((game: number[]) => {
    const domain = window.location.origin;
    const gameText = game.map(n => n.toString().padStart(2, '0')).join(' ');
    
    // Clean Code: Structured message template
    const template = [
      '🔥 *GERADOR INTELIGENTE PRO* 🔥',
      '',
      'Confira meu novo jogo otimizado:',
      `✅ *${gameText}*`,
      '',
      '🍀 Boa sorte!',
      `Gerado em: ${domain}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(template)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto pb-24 xs:pb-32">
      <AlertDialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <AlertDialogContent className="rounded-[2rem] border-zinc-100 dark:border-zinc-800 shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-display font-bold text-center text-zinc-900 dark:text-zinc-100">
              Jogo Repetido!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
              Você já possui este jogo salvo em seu histórico. Experimente gerar uma nova combinação otimizada!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction 
              onClick={() => setShowDuplicateModal(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 sm:p-6 md:p-12 border-b border-purple-50 dark:border-zinc-800/50">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <Zap size={14} fill="currentColor" />
              <span className="text-[10px] uppercase font-bold tracking-[0.25em]">Sistemas Premium</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Gerador Inteligente
            </h2>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 h-14 rounded-2xl shadow-xl shadow-purple-500/10 font-bold text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95"
          >
            {isGenerating ? <RefreshCcw className="animate-spin mr-3" size={18} /> : <Zap className="mr-3" size={18} fill="currentColor" />}
            {isGenerating ? "Analisando Tendências..." : "Gerar Jogo Otimizado"}
          </Button>
        </div>

        <div className="min-h-[140px] md:min-h-[200px] flex flex-wrap justify-center content-center gap-1.5 sm:gap-2 md:gap-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl md:rounded-[2rem] p-3 sm:p-4 md:p-12 border border-zinc-100 dark:border-zinc-800/50 shadow-inner relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentResult ? (
              <motion.div 
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-wrap justify-center gap-1.5 sm:gap-3 md:gap-5"
              >
                {currentResult.numbers.map((num, i) => (
                  <motion.div
                    key={`${num}-${i}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
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
                   {Array(5).fill(0).map((_, i) => (
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
      </div>

      <div className="p-4 sm:p-6 md:p-12 flex-grow flex flex-col">
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-10"
          >
            <StatCard label="Pares/Ímpares" value={`${stats.pairs}/${stats.odd}`} icon={<TrendingUp size={14}/>} />
            <StatCard label="Soma Total" value={stats.sum} icon={<TrendingUp size={14}/>} />
            <StatCard label="Moldura" value={stats.mold} icon={<TrendingUp size={14}/>} />
            <StatCard label="Números Primos" value={stats.primes} icon={<TrendingUp size={14}/>} />
            <StatCard label="Maior Seq." value={stats.sequence} icon={<TrendingUp size={14}/>} />
          </motion.div>
        )}

        {currentResult && (
          <div className="flex justify-center mb-12">
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              className="w-full md:w-auto h-12 sm:h-14 px-12 rounded-2xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
            >
              {isCopied ? <Check className="mr-3 text-emerald-500" size={18} /> : <Copy className="mr-3" size={18} />}
              {isCopied ? "Copiado!" : "Copiar Números"}
            </Button>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <History size={18} className="text-purple-500" />
                <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-500">Histórico Recente</h3>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                {history.length} Jogos
              </span>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {history.slice(0, 10).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-5 bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group"
                  >
                    <div className="flex flex-col gap-3 flex-grow pr-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.numbers.map((num, i) => (
                          <span key={i} className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 w-7 h-7 flex items-center justify-center rounded-lg border border-purple-100 dark:border-purple-900/50">
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => shareOnWhatsApp(item.numbers)}
                      className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all"
                      title="WhatsApp"
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

const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm">
    <div className="flex items-center gap-2 text-zinc-400 mb-2">
      <span className="shrink-0">{icon}</span>
      <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">
      {value}
    </div>
  </div>
);


