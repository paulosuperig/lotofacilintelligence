import { cn } from '@/lib/utils';
import { FILTER_GROUPS, type FilterSelection } from '@/lib/lottery/generationPresets';

interface GenerationFiltersProps {
  value: FilterSelection;
  onChange: (next: FilterSelection) => void;
  disabled?: boolean;
}

/** Grupos de chips (soma, paridade, primos) que definem os filtros soft. */
export const GenerationFilters = ({ value, onChange, disabled }: GenerationFiltersProps) => (
  <div className="space-y-3">
    {FILTER_GROUPS.map((g) => (
      <div key={g.id}>
        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-500 px-1 mb-1.5 block">
          {g.label}
        </span>
        <div role="radiogroup" aria-label={g.label} className="flex flex-wrap gap-2">
          {g.presets.map((p) => {
            const active = value[g.id] === p.key;
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange({ ...value, [g.id]: p.key })}
                className={cn(
                  'px-3 h-9 rounded-xl border text-[11px] font-bold transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none',
                  active
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700'
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);
