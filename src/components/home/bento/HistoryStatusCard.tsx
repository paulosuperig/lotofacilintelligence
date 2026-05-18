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
  <div className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-zinc-800/50 shadow-sm relative h-full">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
        <TrendingUp size={24} />
      </div>
      <div className="text-right">
        {historyLength > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Limpar Histórico">
                <Trash2 size={16} />
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
      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Status do Histórico</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {historyLength > 0 
          ? `Você possui ${historyLength} ${historyLength === 1 ? 'jogo salvo' : 'jogos salvos'} no histórico.`
          : "Nenhum jogo salvo recentemente."}
      </p>
    </div>
  </div>
);
