import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  History, 
  Trash2,
  Copy,
  ChevronLeft,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { toast } from "sonner";
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
import { SavedGame } from '@/types/lottery';
import { HistoryItem } from './HistoryItem';
import { buildHistoryMessage, buildSingleGameMessage, openWhatsApp } from '@/lib/whatsapp';

interface HistoryPanelProps {
  history: SavedGame[];
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
  const shareAllOnWhatsApp = () => openWhatsApp(buildHistoryMessage(history));
  const shareSingleOnWhatsApp = (game: number[]) => openWhatsApp(buildSingleGameMessage(game));

  const copyAllToClipboard = () => {
    const text = buildHistoryMessage(history);
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Todos os jogos foram copiados com sucesso!");
    }).catch(() => {
      toast.error("Falha ao copiar jogos.");
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-2xl shadow-purple-500/5 min-h-[500px] md:min-h-[600px] flex flex-col pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100">Meu Histórico</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium tracking-wide uppercase">Histórico Permanente • {history.length} jogos</p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 w-full md:w-auto">
            <Button 
              onClick={shareAllOnWhatsApp}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-lg shadow-emerald-500/10 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-6"
            >
              <WhatsAppIcon size={20} className="mr-2" />
              Enviar Todos
            </Button>
            <Button 
              onClick={copyAllToClipboard}
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-zinc-200 dark:border-zinc-700 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-6"
            >
              <Copy size={18} className="mr-2" />
              Copiar Tudo
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-bold text-xs uppercase tracking-widest"
                >
                  <Trash2 size={18} className="mr-2" />
                  Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Limpar histórico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá permanentemente todos os seus jogos salvos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearHistory} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                    Sim, Limpar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="flex-grow">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
            <AnimatePresence>
              {history.map((item) => (
                <HistoryItem 
                  key={item.id} 
                  item={item} 
                  onShare={shareSingleOnWhatsApp} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full flex items-center justify-center text-purple-200 dark:text-purple-900/30 mb-8">
              <History size={48} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Nenhum jogo salvo</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
              Você ainda não salvou nenhum jogo. Vá para o Gerador Inteligente e comece agora mesmo!
            </p>
            <Button 
              onClick={onGoToGenerator}
              className="mt-10 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-14 px-10 font-bold uppercase tracking-widest text-xs shadow-xl shadow-purple-500/10 transition-all active:scale-95"
            >
              Começar a Gerar
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Tecnologia Intelligence Pro © 2024</p>
      </div>
    </div>
  );
};
