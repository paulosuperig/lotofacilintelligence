import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SearchCheck, RefreshCcw, Info, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { lotteryService } from '@/services/lotteryService';
import { checkGame } from '@/lib/lottery/checker';
import { prizeLabel } from '@/lib/lottery/prizes';
import { prizeForHits, formatBRL } from '@/lib/lottery/prizeValue';
import type { SavedGame } from '@/types/lottery';

interface ConferidorPanelProps {
  onBack: () => void;
  defaultConcurso?: number;
  history?: SavedGame[];
}

const CELLS = Array.from({ length: 25 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');

interface ConferResult {
  concurso: number;
  data?: string;
  hits: number;
  matched: number[];
  missed: number[];
  prizeText: string;
  ganhadores: number | null;
  prizeValor: number | null;
  awarded: boolean;
}

export const ConferidorPanel = ({ onBack, defaultConcurso, history = [] }: ConferidorPanelProps) => {
  const [concurso, setConcurso] = useState<string>(defaultConcurso ? String(defaultConcurso) : '');
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConferResult | null>(null);

  const toggle = (n: number) => {
    setResult(null);
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length >= 15 ? prev : [...prev, n].sort((a, b) => a - b)
    );
  };

  const fillFromSaved = (g: SavedGame) => {
    setResult(null);
    setSelected([...g.numbers].sort((a, b) => a - b).slice(0, 15));
  };

  const canConferir = selected.length === 15 && concurso.trim() !== '' && !loading;

  const savedOptions = useMemo(() => history.slice(0, 8), [history]);

  const handleConferir = async () => {
    if (!canConferir) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const n = parseInt(concurso, 10);
      const res = await lotteryService.getResultByConcurso(n);
      const check = checkGame(selected, res.dezenas);
      const prize = prizeForHits(res.premiacoes, check.hits);
      setResult({
        concurso: typeof res.concurso === 'number' ? res.concurso : n,
        data: res.data,
        hits: check.hits,
        matched: check.matched,
        missed: check.missed,
        prizeText: prizeLabel(check.hits),
        ganhadores: prize?.ganhadores ?? null,
        prizeValor: prize?.valor ?? null,
        awarded: check.awarded,
      });
    } catch {
      setError('Não foi possível conferir. Verifique o número do concurso e sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 md:mb-8 gap-6 text-center lg:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0">
              <SearchCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">Conferidor</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Confira um jogo contra qualquer concurso — com o valor do prêmio</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">
            Voltar ao Início
          </Button>
        </div>

        {/* Concurso */}
        <div className="mb-6">
          <label htmlFor="concurso-input" className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1 mb-2 block">
            Nº do concurso
          </label>
          <Input
            id="concurso-input"
            type="number"
            inputMode="numeric"
            min={1}
            value={concurso}
            onChange={(e) => { setResult(null); setConcurso(e.target.value); }}
            placeholder={defaultConcurso ? `Ex.: ${defaultConcurso}` : 'Ex.: 3000'}
            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm max-w-[200px]"
          />
        </div>

        {/* Dezenas do jogo */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Seu jogo</span>
            <span className={cn('text-[10px] font-bold', selected.length === 15 ? 'text-emerald-500' : 'text-purple-500')}>
              {selected.length}/15
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label="Selecione 15 dezenas">
            {CELLS.map((n) => {
              const on = selected.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Dezena ${n}${on ? ' selecionada' : ''}`}
                  onClick={() => toggle(n)}
                  className={cn(
                    'aspect-square rounded-xl border text-xs sm:text-sm font-bold tabular-nums flex items-center justify-center transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                    on
                      ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-700'
                  )}
                >
                  {pad(n)}
                </button>
              );
            })}
          </div>

          {savedOptions.length > 0 && (
            <div className="mt-3">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Preencher de um jogo salvo:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {savedOptions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => fillFromSaved(g)}
                    className="px-2.5 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:border-purple-300 transition-colors"
                  >
                    {g.numbers.slice(0, 3).map(pad).join(' ')}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelected([]); setResult(null); }}
              className="mx-auto mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <XCircle size={12} /> Limpar dezenas
            </button>
          )}
        </div>

        <div className="flex justify-center mb-2">
          <Button
            onClick={handleConferir}
            disabled={!canConferir}
            className="h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCcw className="animate-spin mr-2" size={16} /> : <SearchCheck className="mr-2" size={16} />}
            {loading ? 'Conferindo...' : 'Conferir'}
          </Button>
        </div>
        {selected.length !== 15 && (
          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">Selecione exatamente 15 dezenas para conferir.</p>
        )}
        {error && <p className="text-center text-xs text-rose-500 mt-4">{error}</p>}

        {/* Resultado */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-8 p-5 sm:p-6 rounded-[1.5rem] text-white shadow-xl',
              result.awarded ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-800'
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                  Concurso {result.concurso}{result.data ? ` · ${result.data}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {result.awarded ? <Trophy size={18} /> : <Info size={18} />}
                  <span className="text-lg font-display font-bold">{result.hits} acertos</span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5">{result.prizeText}</p>
              </div>
              {result.awarded && (
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Prêmio da faixa</p>
                  <p className="text-xl font-display font-bold tabular-nums">{formatBRL(result.prizeValor)}</p>
                  {result.ganhadores != null && (
                    <p className="text-[10px] text-white/70">{result.ganhadores.toLocaleString('pt-BR')} ganhador(es)</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.map((n) => {
                const hit = result.matched.includes(n);
                return (
                  <span
                    key={n}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold tabular-nums border',
                      hit ? 'bg-white/25 border-white/40' : 'bg-black/15 border-white/10 text-white/50 line-through'
                    )}
                  >
                    {pad(n)}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-white/70">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {result.matched.length} certas</span>
              <span className="flex items-center gap-1"><XCircle size={12} /> {result.missed.length} fora</span>
            </div>
            {!result.awarded && (
              <p className="text-[10px] text-white/70 mt-3">
                Faixa premiada a partir de 11 acertos. Jogue com responsabilidade — a Lotofácil é um jogo de azar.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
