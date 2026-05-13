import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  PieChart, 
  Loader2, 
  Send, 
  Save 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiAssistantProps {
  deepSeekKey: string;
  aiChat: any[];
  isAiLoading: boolean;
  aiMessage: string;
  onSendMessage: (e?: React.FormEvent, customMessage?: string) => void;
  onSetAiMessage: (val: string) => void;
  onSaveAiGame: (content: string) => void;
  onBack: () => void;
  onGoToSettings: () => void;
  role: 'admin' | 'demo';
}

export const AiAssistant = ({
  deepSeekKey,
  aiChat,
  isAiLoading,
  aiMessage,
  onSendMessage,
  onSetAiMessage,
  onSaveAiGame,
  onBack,
  onGoToSettings,
  role
}: AiAssistantProps) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-3 md:p-8 shadow-xl shadow-purple-500/5 min-h-[500px] md:min-h-[600px] flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-600 dark:bg-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Cpu size={20} />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100">Intelligence AI</h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-[0.2em] ml-1">Análises & Probabilidades em Tempo Real</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onBack}
          className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
        >
          Voltar
        </Button>
      </div>

      <div className="flex-grow flex flex-col bg-purple-50/30 dark:bg-zinc-950/30 rounded-[2rem] border border-purple-100 dark:border-zinc-800 overflow-hidden relative">
        {!deepSeekKey && role === 'admin' ? (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Configuração Necessária</h3>
              <p className="text-sm text-zinc-500 mb-6">A API do DeepSeek ainda não foi configurada. Vá em Configurações para inserir sua chave.</p>
              <Button onClick={onGoToSettings} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                Configurar Agora
              </Button>
            </div>
          </div>
        ) : !deepSeekKey && role !== 'admin' ? (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">IA Indisponível</h3>
              <p className="text-sm text-zinc-500">A Inteligência Artificial está temporariamente desativada pelo administrador.</p>
            </div>
          </div>
        ) : null}

        <div className="flex-grow overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 max-h-[450px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-purple-100">
          {aiChat.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm flex items-center justify-center text-purple-400 dark:text-purple-300 mb-6 border border-purple-50 dark:border-zinc-700">
                <Cpu size={32} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-8">Olá! Eu sou seu assistente inteligente. Como posso ajudar com suas análises hoje?</p>
              
              <div className="w-full max-w-2xl grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-8 px-2">
                <button 
                  onClick={() => onSendMessage(undefined, "Pode gerar 3 sugestões de jogos baseadas nas dezenas mais quentes e tendências atuais?")}
                  className="p-4 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Múltiplos Jogos IA</p>
                  <p className="text-[10px] text-zinc-400">Geração de várias opções com análise técnica</p>
                </button>

                <button 
                  onClick={() => onSendMessage(undefined, "Quais são as dezenas mais quentes para o próximo concurso?")}
                  className="p-4 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Flame size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Dezenas Quentes</p>
                  <p className="text-[10px] text-zinc-400">Análise de frequência dos últimos 10 concursos</p>
                </button>

                <button 
                  onClick={() => onSendMessage(undefined, "Quais são os padrões de pares e ímpares que mais saem?")}
                  className="p-4 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <PieChart size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Padrões e Somas</p>
                  <p className="text-[10px] text-zinc-400">Verificação de equilíbrio e comportamento estatístico</p>
                </button>

                <button 
                  onClick={() => onSendMessage(undefined, "Explique os melhores fechamentos para quem quer garantir 14 pontos")}
                  className="p-4 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 rounded-2xl text-left hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Dicas de Fechamento</p>
                  <p className="text-[10px] text-zinc-400">Estratégias avançadas para aumentar as chances</p>
                </button>
              </div>
            </div>
          ) : (
            aiChat.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col max-w-[90%] md:max-w-[85%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}>
                <div className={cn(
                  "p-3 sm:p-4 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm relative group/msg",
                  msg.role === 'user' 
                    ? "bg-purple-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-purple-100 dark:border-zinc-700 rounded-tl-none"
                )}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-h1:text-base prose-h2:text-base prose-h3:text-sm prose-h4:text-sm prose-p:my-2 prose-p:leading-relaxed prose-strong:text-purple-700 dark:prose-strong:text-purple-400 prose-strong:font-bold prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-hr:my-3 prose-hr:border-purple-100 dark:prose-hr:border-zinc-700 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:bg-purple-50 dark:prose-code:bg-purple-900/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-purple-50">
                        <span className="text-[10px] text-zinc-400 font-medium italic">Extraído da análise Intelligence AI</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg gap-2 border border-purple-100/50"
                            onClick={() => onSaveAiGame(msg.content)}
                          >
                            <Save size={12} /> Salvar Tudo
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-widest px-1">
                  {msg.role === 'user' ? 'Você' : 'Lotofácil Intelligence'}
                </span>
              </div>
            ))
          )}
          {isAiLoading && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    borderRadius: ["20%", "50%", "20%"]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-fuchsia-500 opacity-20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-purple-600" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 animate-pulse">
                  Inteligência Analisando
                </span>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-purple-400"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSendMessage(); }} className="p-4 bg-white dark:bg-zinc-900 border-t border-purple-100 dark:border-zinc-800 flex gap-2">
          <Input 
            placeholder="Pergunte ao especialista..." 
            value={aiMessage}
            onChange={(e) => onSetAiMessage(e.target.value)}
            className="rounded-xl border-purple-100"
            disabled={isAiLoading || !deepSeekKey}
          />
          <Button 
            type="submit" 
            disabled={isAiLoading || !deepSeekKey}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl w-12 h-10 p-0 shrink-0"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};
