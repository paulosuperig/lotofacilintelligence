import React from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
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

interface HistoryPanelProps {
  history: any[];
  onBack: () => void;
  onClearHistory: () => void;
  onGoToGenerator: () => void;
}

export const HistoryPanel = ({ 
  history, 
  onBack, 
  onClearHistory, 
  onGoToGenerator 
}: HistoryPanelProps) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-6 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Seu Histórico</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">Jogos salvos nos últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={18} className="mr-2" />
                  Limpar Histórico
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os seus jogos salvos serão removidos permanentemente.
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
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item, idx) => (
            <div key={idx} className="p-6 bg-purple-50/50 dark:bg-zinc-800/50 border border-purple-100 dark:border-zinc-700 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                  {new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const text = `Confira meu jogo da Lotofácil gerado pelo Intelligence: ${item.numbers.map((n: number) => n.toString().padStart(2, '0')).join(', ')}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
                    title="Compartilhar no WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.624 1.435h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z\" />
                    </svg>
                  </button>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.numbers.map((num: number, i: number) => (
                  <span key={i} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm">
                    {num.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-200 mb-6">
            <History size={40} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Nenhum jogo encontrado</h3>
          <p className="text-zinc-500 max-w-xs">Gere novos jogos no Gerador Inteligente para vê-los aqui.</p>
          <Button 
            onClick={onGoToGenerator}
            className="mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-8"
          >
            Ir para Gerador
          </Button>
        </div>
      )}
    </div>
  );
};
