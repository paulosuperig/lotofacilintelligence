import React from 'react';
import { cn } from '@/lib/utils';
import { Pin, Ban } from 'lucide-react';
import {
  cycleDezena,
  dezenaState,
  type Selection,
} from '@/lib/lottery/selection';

interface NumberBoardProps {
  selection: Selection;
  onChange: (next: Selection) => void;
  disabled?: boolean;
}

const CELLS = Array.from({ length: 25 }, (_, i) => i + 1);

/**
 * Volante 5x5 para o usuário fixar (verde) ou excluir (vermelho) dezenas.
 * Um toque cicla neutra → fixa → excluída → neutra. Acessível por teclado.
 */
export const NumberBoard = ({ selection, onChange, disabled }: NumberBoardProps) => {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label="Volante de dezenas">
        {CELLS.map((n) => {
          const state = dezenaState(selection, n);
          const label =
            state === 'fixed' ? `${n} fixada` : state === 'excluded' ? `${n} excluída` : `${n} livre`;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={state !== 'neutral'}
              aria-label={label}
              title={label}
              disabled={disabled}
              onClick={() => onChange(cycleDezena(selection, n))}
              className={cn(
                'relative aspect-square rounded-xl border text-xs sm:text-sm font-bold tabular-nums flex items-center justify-center transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none',
                state === 'neutral' &&
                  'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700',
                state === 'fixed' &&
                  'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20',
                state === 'excluded' &&
                  'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20'
              )}
            >
              {pad(n)}
              {state === 'fixed' && <Pin size={9} className="absolute top-1 right-1" />}
              {state === 'excluded' && <Ban size={9} className="absolute top-1 right-1" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Fixar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Excluir
        </span>
        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600 normal-case tracking-normal font-medium">
          toque para alternar
        </span>
      </div>
    </div>
  );
};
