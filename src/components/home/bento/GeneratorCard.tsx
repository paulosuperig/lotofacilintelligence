import React from 'react';
import { Zap } from 'lucide-react';
import { GameGenerator } from "@/components/lottery/GameGenerator";

export const GeneratorCard = () => (
  <div className="h-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl md:rounded-[2rem] p-0 flex flex-col shadow-xl shadow-purple-500/5 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-purple-900 pointer-events-none hidden md:block">
      <Zap size={200} strokeWidth={0.5} />
    </div>
    <GameGenerator />
  </div>
);
