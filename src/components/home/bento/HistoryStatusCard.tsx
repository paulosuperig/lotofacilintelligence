import React from 'react';
import { TrendingUp, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoryStatusCardProps {
  historyLength: number;
  onClearHistory: () => void;
}

export const HistoryStatusCard = ({ historyLength, onClearHistory }: HistoryStatusCardProps) => (
  <div className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-4 group transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 shadow-sm relative h-full">
    <div className="flex justify-between items-start">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
        <TrendingUp size={22} />
      </div>
      <div className="text-right">
        {historyLength > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button aria-label="Limpar histórico" className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deseja apagar todos os seus jogos salvos do histórico?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClearHistory} className="bg-red-500 hover:bg-red-600 text-white">
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
    <div>
      <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-1 leading-tight">Status do Histórico</h4>
      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
        {historyLength > 0
          ? `${historyLength} ${historyLength === 1 ? 'jogo salvo' : 'jogos salvos'}.`
          : "Nenhum jogo salvo ainda."}
      </p>
    </div>
  </div>
);
