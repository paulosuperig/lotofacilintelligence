import React, { lazy, Suspense } from 'react';
import { Zap, Loader2 } from 'lucide-react';

const GameGenerator = lazy(() => import("@/components/lottery/GameGenerator").then(m => ({ default: m.GameGenerator })));

export const GeneratorCard = React.memo(() => (
  <div className="h-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-0 flex flex-col shadow-xl shadow-purple-500/5 relative overflow-hidden group min-h-[400px]">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-purple-900 pointer-events-none hidden md:block">
      <Zap size={200} strokeWidth={0.5} />
    </div>
    <Suspense fallback={
      <div className="flex-grow flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
        <p className="text-sm font-medium text-zinc-500 animate-pulse uppercase tracking-widest">Iniciando Gerador...</p>
      </div>
    }>
      <GameGenerator />
    </Suspense>
  </div>
));

GeneratorCard.displayName = 'GeneratorCard';
