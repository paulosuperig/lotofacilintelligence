import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { SavedGame } from '@/types/lottery';
import { checkGame } from '@/lib/lottery/checker';

interface HistoryItemProps {
  item: SavedGame;
  onShare: (game: number[]) => void;
  /** dezenas do último resultado oficial, para conferência automática */
  drawResult?: Array<string | number> | null;
  /** número do concurso conferido (para rótulo) */
  drawConcurso?: number | null;
}

/** Cor do selo de acertos conforme a faixa. */
const hitStyle = (hits: number): string => {
  if (hits >= 15) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
  if (hits >= 13) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
  if (hits >= 11) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
};

export const HistoryItem = ({ item, onShare, drawResult, drawConcurso }: HistoryItemProps) => {
  const check = useMemo(
    () => (drawResult && drawResult.length > 0 ? checkGame(item.numbers, drawResult) : null),
    [item.numbers, drawResult]
  );
  const matchedSet = useMemo(() => new Set(check?.matched ?? []), [check]);

  return (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-2xl md:rounded-3xl flex flex-col gap-4 sm:gap-6 group hover:border-purple-200 dark:hover:border-purple-900/50 transition-all shadow-sm"
  >
    <div className="flex justify-between items-center">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-zinc-400" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            {new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.type && (
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100/50 dark:border-blue-800/30 w-fit">
              <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">{item.type}</span>
            </div>
          )}
          {item.model && (
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{item.model}</span>
            </div>
          )}
          {item.sum && (
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-lg border border-purple-100/50 dark:border-purple-800/30 w-fit">
              <span className="text-[8px] font-bold text-purple-400 uppercase tracking-tighter">Soma</span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 tabular-nums">{item.sum}</span>
            </div>
          )}
          {check && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border w-fit ${hitStyle(check.hits)}`}
              title={drawConcurso ? `Conferido com o concurso ${drawConcurso}` : 'Conferência com o último resultado'}
            >
              {check.awarded && <Trophy size={9} className="shrink-0" />}
              <span className="text-[8px] font-bold uppercase tracking-tighter">Acertos</span>
              <span className="text-[10px] font-bold tabular-nums">{check.hits}</span>
            </div>
          )}
        </div>
      </div>
      <Button 
        size="icon"
        variant="ghost"
        onClick={() => onShare(item.numbers)}
        aria-label="Compartilhar jogo no WhatsApp"
        className="w-11 h-11 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-transform active:scale-90"
      >
        <WhatsAppIcon size={20} />
      </Button>
    </div>
    
    <div className="flex flex-wrap gap-2">
      {item.numbers.map((num, i) => {
        const isHit = matchedSet.has(num);
        return (
          <span
            key={i}
            className={
              isHit
                ? "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500 border border-emerald-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm"
                : "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-400 shadow-sm"
            }
          >
            {num.toString().padStart(2, '0')}
          </span>
        );
      })}
    </div>
  </motion.div>
  );
};
