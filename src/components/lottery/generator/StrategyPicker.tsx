import React from 'react';
import { cn } from '@/lib/utils';
import type { GenStrategy } from '@/lib/lottery/generator';
import { STRATEGIES, pickerButtonClass } from './strategies';

interface StrategyPickerProps {
  value: GenStrategy;
  onChange: (strategy: GenStrategy) => void;
  disabled?: boolean;
  hint: string;
}

export const StrategyPicker = ({ value, onChange, disabled, hint }: StrategyPickerProps) => (
  <div>
    <div className="flex items-center justify-between mb-2 px-1">
      <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        Estratégia
      </span>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">{hint}</span>
    </div>
    <div role="radiogroup" aria-label="Estratégia de geração" className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {STRATEGIES.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={s.hint}
            onClick={() => onChange(s.value)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none',
              pickerButtonClass(active),
            )}
          >
            {s.icon}
            {s.label}
          </button>
        );
      })}
    </div>
    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 px-1 sm:hidden">{hint}</p>
  </div>
);
