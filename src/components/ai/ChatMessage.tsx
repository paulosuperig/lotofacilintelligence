import React from 'react';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { extractGameFromLine, isGameLine } from "@/lib/ai/extractGames";

const GameLine = ({ raw, onSave }: { raw: string; onSave?: (text: string) => void }) => {
  const text = String(raw);
  const game = extractGameFromLine(text);
  if (!game) return <div className="text-zinc-500 italic my-1 font-mono">{text}</div>;

  const sumMatch = text.match(/soma[:\s]*?(\d{2,3})/i);
  const sum = sumMatch ? parseInt(sumMatch[1], 10) : game.reduce((a, b) => a + b, 0);

  return (
    <div className="my-3 p-4 bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-900/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sugestão de Jogo</span>
        </div>
        <div className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-tighter">
          Soma: {sum}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {game.map((n, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-100 dark:border-zinc-700 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200"
          >
            {String(n).padStart(2, '0')}
          </div>
        ))}
      </div>
      {onSave && (
        <div className="flex justify-end mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg gap-1.5"
            onClick={() => onSave(game.map((n) => String(n).padStart(2, '0')).join(' '))}
          >
            <Save size={11} /> Salvar este jogo
          </Button>
        </div>
      )}
    </div>
  );
};

const makeMarkdownComponents = (onSave: (text: string) => void) => ({
  code: ({ inline, className, children, ...props }: any) => {
    const raw = String(children ?? '');
    if (isGameLine(raw)) return <GameLine raw={raw} onSave={onSave} />;
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children, ...props }: any) => {
    const child: any = Array.isArray(children) ? children[0] : children;
    const inner = child?.props?.children;
    const raw = Array.isArray(inner) ? inner.join('') : String(inner ?? '');
    if (isGameLine(raw)) return <GameLine raw={raw} onSave={onSave} />;
    return <pre {...props}>{children}</pre>;
  },
});

interface ChatMessageProps {
  msg: any;
  onSaveAiGame: (content: string) => void;
}

export const ChatMessage = ({ msg, onSaveAiGame }: ChatMessageProps) => (
  <div className={cn("flex flex-col max-w-[95%] md:max-w-[90%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
    <div className={cn(
      "p-3 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
      msg.role === 'user' 
        ? "bg-zinc-800 text-white rounded-tr-none" 
        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-tl-none"
    )}>
      {msg.role === 'assistant' ? (
        <>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeMarkdownComponents(onSaveAiGame)}>{msg.content}</ReactMarkdown>
          </div>
          <div className="flex justify-between items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
            <span className="text-[10px] text-zinc-400 font-medium">Intelligence AI Otimizada</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg gap-2"
              onClick={() => onSaveAiGame(msg.content)}
            >
              <Save size={12} /> Salvar todos os jogos
            </Button>
          </div>
        </>
      ) : (
        msg.content
      )}
    </div>
    <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-widest px-1">
      {msg.role === 'user' ? 'Você' : 'Intelligence AI'}
    </span>
  </div>
);
