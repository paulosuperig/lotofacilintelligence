import React from 'react';
import { Cpu, Loader2, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from './ChatMessage';
import type { AiChatMessage } from '@/hooks/useAiAssistant';
import { cn } from "@/lib/utils";
import { Sparkles, Flame, ShieldCheck, Snowflake, Zap, Link2 } from 'lucide-react';

// Mapa ESTÁTICO de cores (classes dinâmicas `bg-${x}-50` são purgadas pelo Tailwind).
const SUGGESTION_COLORS: Record<string, string> = {
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
};

// Prompts otimizados: acionam as novas capacidades da IA (estratégias dinâmicas,
// co-ocorrência, filtros de soma/quantidade) e a análise data-grounded.
const SUGGESTIONS = [
  { label: "Jogos equilibrados", text: "Gere 3 jogos equilibrados para o próximo concurso, com soma entre 180 e 210.", icon: <Sparkles size={18} />, color: "purple" },
  { label: "Foco em atrasadas", text: "Gere 3 jogos priorizando as dezenas atrasadas.", icon: <Snowflake size={18} />, color: "sky" },
  { label: "Jogo ousado (zebra)", text: "Gere um jogo mais arriscado, no estilo zebra.", icon: <Zap size={18} />, color: "rose" },
  { label: "Quentes & frias", text: "Quais são as dezenas mais quentes e mais frias no momento?", icon: <Flame size={18} />, color: "amber" },
  { label: "Pares que saem juntos", text: "Quais pares de dezenas mais saem juntos historicamente?", icon: <Link2 size={18} />, color: "emerald" },
  { label: "Fechamentos", text: "Explique os fechamentos disponíveis e a garantia de cada um.", icon: <ShieldCheck size={18} />, color: "indigo" },
];

interface AiAssistantProps {
  isAiConfigured: boolean;
  aiChat: AiChatMessage[];
  isAiLoading: boolean;
  aiMessage: string;
  onSendMessage: (e?: React.FormEvent, customMessage?: string) => void;
  onSetAiMessage: (val: string) => void;
  onSaveAiGame: (content: string) => void;
  onClearChat?: () => void;
  onBack: () => void;
  onGoToSettings: () => void;
  role: 'admin' | 'demo';
}

export const AiAssistant = ({
  isAiConfigured,
  aiChat,
  isAiLoading,
  aiMessage,
  onSendMessage,
  onSetAiMessage,
  onSaveAiGame,
  onClearChat,
  onBack,
  onGoToSettings,
  role
}: AiAssistantProps) => {
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [aiChat, isAiLoading]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-xl shadow-purple-500/5 min-h-[500px] flex flex-col">
      <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between mb-8 md:mb-10 gap-6">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-600 dark:bg-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Cpu size={20} />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100">Intelligence AI</h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-[0.2em] ml-1">PROCESSAMENTO DE JOGOS POR ESPECIALISTA MASTER</p>
        </div>
        <div className="flex items-center gap-2">
          {aiChat.length > 0 && (
            <Button variant="ghost" onClick={onClearChat} className="rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50">
              Limpar Chat
            </Button>
          )}
          <Button variant="outline" onClick={onBack} className="rounded-xl border-zinc-100 text-zinc-600 hover:bg-zinc-50">
            Voltar
          </Button>
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-zinc-50/50 dark:bg-zinc-950/30 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden relative">
        <div 
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-200 scroll-smooth"
        >
          {aiChat.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm flex items-center justify-center text-zinc-400 mb-6 border border-zinc-100">
                <Cpu size={32} />
              </div>
              <p className="text-sm text-zinc-500 max-w-xs mb-8">Olá! Eu sou seu assistente inteligente. Como posso ajudar hoje?</p>
              
              <div className="w-full max-w-2xl grid grid-cols-1 xs:grid-cols-2 gap-3 mb-8 px-2">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(undefined, item.text)}
                    disabled={isAiLoading}
                    className="p-4 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform", SUGGESTION_COLORS[item.color])}>
                      {item.icon}
                    </div>
                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-snug">{item.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            aiChat.map((msg, i) => (
              <ChatMessage key={i} msg={msg} onSaveAiGame={onSaveAiGame} />
            ))
          )}
          {isAiLoading && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-2xl w-fit border border-zinc-100"
            >
              <Loader2 size={16} className="animate-spin text-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Processando...</span>
              <span className="sr-only">Gerando resposta da Intelligence AI</span>
            </div>
          )}
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); onSendMessage(); }}
          className="p-3 sm:p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800"
        >
          <div className="relative group max-w-4xl mx-auto flex gap-2">
            <Input
              value={aiMessage}
              onChange={(e) => onSetAiMessage(e.target.value)}
              placeholder="Digite sua dúvida ou peça sugestões..."
              aria-label="Mensagem para a Intelligence AI"
              className="flex-grow h-12 md:h-14 px-4 rounded-xl md:rounded-2xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-1 focus:ring-zinc-400 transition-all text-sm"
              disabled={isAiLoading}
            />
            <Button
              type="submit"
              disabled={isAiLoading || !aiMessage.trim()}
              aria-label="Enviar mensagem"
              className="h-12 md:h-14 w-12 md:w-14 rounded-xl md:rounded-2xl bg-zinc-800 hover:bg-zinc-900 text-white shadow-lg transition-all flex items-center justify-center p-0"
            >
              {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
