import React from 'react';
import { cn } from '@/lib/utils';
import { BATCH_SIZES, pickerButtonClass } from './strategies';

interface BatchSizePickerProps {
  value: number;
  onChange: (size: number) => void;
  disabled?: boolean;
}

export const BatchSizePicker = ({ value, onChange, disabled }: BatchSizePickerProps) => (
  <div>
    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1 mb-2 block">
      Jogos no lote
    </span>
    <div role="radiogroup" aria-label="Quantidade de jogos no lote" className="flex gap-2">
      {BATCH_SIZES.map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(n)}
            disabled={disabled}
            className={cn(
              'flex-1 h-10 rounded-xl border text-xs font-bold tabular-nums transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none',
              pickerButtonClass(active),
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  </div>
);
