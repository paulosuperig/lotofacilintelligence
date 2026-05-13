import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Trash2,
  Copy,
  ChevronLeft,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
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

interface HistoryPanelProps {
  history: SavedGame[];
  onBack: () => void;
  onClearHistory: () => void;
  onGoToGenerator: () => void;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const HistoryPanel = ({ 
  history, 
  onBack, 
  onClearHistory, 
  onGoToGenerator 
}: HistoryPanelProps) => {
  const generateAllGamesText = () => {
    if (history.length === 0) return "";
    
    let text = `🔥 *HISTÓRICO DE JOGOS* 🔥\n\n`;
    
    history.forEach((item, idx) => {
      const date = new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const gameNumbers = item.numbers.map((n: number) => n.toString().padStart(2, '0')).join(' ');
      text += `${idx + 1}. [${date}] ✅ *${gameNumbers}*\n`;
    });
    
    text += `\n🍀 Boa sorte!\nGerado em: ${window.location.origin}`;
    return text;
  };

  const shareAllOnWhatsApp = () => {
    const text = generateAllGamesText();
    if (!text) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyAllToClipboard = () => {
    const text = generateAllGamesText();
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Todos os jogos foram copiados com sucesso!");
    }).catch(() => {
      toast.error("Falha ao copiar jogos.");
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-12 shadow-2xl shadow-purple-500/5 min-h-[500px] md:min-h-[600px] flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
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
              <WhatsAppIcon className="w-5 h-5 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {history.map((item) => (
                <motion.div 
                  key={item.id} 
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
                      </div>
                    </div>
                    <Button 
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const text = `🔥 *GERADOR INTELIGENTE* 🔥\n\nJogo: *${item.numbers.map((n: number) => n.toString().padStart(2, '0')).join(' ')}*\n\n🍀 Boa sorte!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="w-9 h-9 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-transform hover:scale-110"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.numbers.map((num, i) => (
                      <span key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-400 shadow-sm">
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </motion.div>
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
