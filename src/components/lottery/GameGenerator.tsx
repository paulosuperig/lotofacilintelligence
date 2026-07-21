import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ball } from './Ball';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { 
  Zap, 
  RefreshCcw, 
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
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import { SavedGame } from '@/types/lottery';
import { calculateGameStats } from '@/lib/lottery/stats';
import { buildSingleGameMessage, openWhatsApp } from '@/lib/whatsapp';
import { trackCustom, trackEvent } from '@/lib/analytics/metaPixel';

const BATCH_SIZE = 5;

export const GameGenerator = () => {
  const { history, saveToHistory, generateSmartGame, generateSmartBatch } = useLottery();
  const [currentResult, setCurrentResult] = useState<SavedGame | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const { toast } = useToast();

  const stats = useMemo(() => {
    if (!currentResult) return null;
    return calculateGameStats(currentResult.numbers);
  }, [currentResult]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsCopied(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newGame = generateSmartGame();
    setCurrentResult(newGame);
    await saveToHistory([newGame]);
    trackEvent('Lead', {
      content_name: 'Jogo Lotofácil Gerado',
      content_category: 'game_generator',
      content_type: 'lottery_game',
      content_ids: [newGame.id],
      value: 3.5, // valor médio de aposta Lotofácil (BRL)
      currency: 'BRL',
      num_items: 1,
      sum: newGame.sum,
    });
    trackCustom('GerarJogo', {
      content_category: 'game_generator',
      sum: newGame.sum,
      type: newGame.type,
    });
    setIsGenerating(false);
  };

  const handleGenerateBatch = async () => {
    if (isGenerating || isBatchGenerating) return;
    setIsBatchGenerating(true);
    setIsCopied(false);

    await new Promise(resolve => setTimeout(resolve, 800));

    const games = generateSmartBatch(BATCH_SIZE);
    if (games.length > 0) setCurrentResult(games[0]);
    const { success } = await saveToHistory(games);

    trackCustom('GerarLote', {
      content_category: 'game_generator',
      num_items: games.length,
    });

    toast({
      title: success ? `${games.length} jogos gerados!` : 'Lote gerado',
      description: success
        ? 'Jogos diversificados salvos no seu histórico.'
        : 'Alguns jogos já existiam no histórico.',
    });
    setIsBatchGenerating(false);
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

  const shareOnWhatsApp = useCallback((game: number[]) => {
    openWhatsApp(buildSingleGameMessage(game));
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto pb-24 xs:pb-32 text-zinc-900 dark:text-zinc-100">
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

      <div className="p-5 sm:p-8 md:p-12 border-b border-purple-50 dark:border-zinc-800">
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isBatchGenerating}
              className="flex-1 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 h-14 rounded-2xl shadow-xl shadow-purple-500/10 font-bold text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isGenerating ? <RefreshCcw className="animate-spin mr-3" size={18} /> : <Zap className="mr-3" size={18} fill="currentColor" />}
              {isGenerating ? "Analisando Tendências..." : "Gerar Jogo Otimizado"}
            </Button>
            <Button
              onClick={handleGenerateBatch}
              disabled={isGenerating || isBatchGenerating}
              variant="outline"
              className="sm:w-auto h-14 px-6 rounded-2xl border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
            >
              {isBatchGenerating ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <Copy className="mr-2" size={18} />}
              {isBatchGenerating ? "Gerando..." : `Lote de ${BATCH_SIZE}`}
            </Button>
          </div>
        </div>

        <div className="min-h-[140px] md:min-h-[200px] flex flex-wrap justify-center content-center gap-2 sm:gap-4 md:gap-6 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl md:rounded-[2rem] p-4 sm:p-8 md:p-12 border border-zinc-100 dark:border-zinc-800 shadow-inner relative overflow-hidden">
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

      <div className="p-5 sm:p-8 md:p-12 flex-grow flex flex-col">
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 mb-10"
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
                      aria-label="Compartilhar jogo no WhatsApp"
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
