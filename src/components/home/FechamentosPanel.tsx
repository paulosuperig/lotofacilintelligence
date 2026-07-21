import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCcw, Trophy, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { generateSecureId } from '@/lib/security/utils';
import { FECHAMENTO_MODELS, type FechamentoModel } from '@/constants/fechamentos';
import { generateWheel } from '@/lib/lottery/wheel';
import { cryptoRng } from '@/lib/lottery/generator';
import { useLotteryStats } from '@/hooks/useLotteryStats';
import type { HistoryAnalysis } from '@/lib/lottery/analysis';
import type { SavedGame } from '@/types/lottery';

interface FechamentosPanelProps {
  onBack: () => void;
  onSaveGames: (games: SavedGame[]) => Promise<{ success: boolean; duplicate: boolean }> | void;
}

/**
 * Monta um pool de `size` dezenas priorizando as mais quentes e as mais
 * atrasadas do histórico (estratégia data-driven). Sem histórico, usa um pool
 * pseudo-aleatório criptográfico.
 */
const buildPool = (size: number, analysis: HistoryAnalysis | null): number[] => {
  const pool = new Set<number>();
  if (analysis && analysis.totalConcursos > 0) {
    for (const n of analysis.quentes) { if (pool.size < size) pool.add(n); }
    for (const n of analysis.atrasadas) { if (pool.size < size) pool.add(n); }
    // completa por ranking de frequência
    for (const s of analysis.ranking) { if (pool.size < size) pool.add(s.numero); }
  }
  // fallback: completa aleatoriamente até o tamanho
  while (pool.size < size) {
    const buf = new Uint32Array(1);
    if (typeof globalThis.crypto?.getRandomValues === 'function') globalThis.crypto.getRandomValues(buf);
    else buf[0] = Math.floor(Math.random() * 0x100000000);
    pool.add((buf[0] % 25) + 1);
  }
  return Array.from(pool).sort((a, b) => a - b);
};

interface WheelState {
  model: FechamentoModel;
  pool: number[];
  games: number[][];
  guarantee: number;
}

export const FechamentosPanel = ({ onBack, onSaveGames }: FechamentosPanelProps) => {
  const { analysis } = useLotteryStats();
  const [result, setResult] = useState<WheelState | null>(null);
  const [generatingTitle, setGeneratingTitle] = useState<string | null>(null);

  const handleGenerate = async (model: FechamentoModel) => {
    if (generatingTitle) return;
    setGeneratingTitle(model.title);
    // deixa o loading pintar antes do cálculo síncrono
    await new Promise((r) => setTimeout(r, 50));

    const pool = buildPool(model.poolSize, analysis);
    const wheel = generateWheel({ pool, numGames: model.numGames, rng: cryptoRng });

    setResult({ model, pool: wheel.pool, games: wheel.games, guarantee: wheel.guarantee });

    const saved: SavedGame[] = wheel.games.map((numbers) => ({
      id: generateSecureId(),
      numbers,
      timestamp: Date.now(),
      model: model.title,
      type: 'Fechamento',
      sum: numbers.reduce((a, b) => a + b, 0),
    }));
    await onSaveGames(saved);

    toast.success(`Fechamento "${model.title}" gerado!`, {
      description: `${wheel.games.length} jogos salvos • garante ${wheel.guarantee} pontos se as 15 saírem entre as ${model.poolSize} dezenas.`,
    });
    setGeneratingTitle(null);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const poolStat = useMemo(() => {
    if (!result) return null;
    const inHot = result.pool.filter((n) => analysis?.quentes.includes(n)).length;
    return { inHot };
  }, [result, analysis]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between mb-6 md:mb-8 gap-6 text-center lg:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Fechamentos</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">Redução matemática com garantia verificada</p>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar ao Início
          </Button>
        </div>

        {/* Explicação honesta da garantia */}
        <div className="mb-8 p-4 rounded-2xl bg-purple-50/60 dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 flex items-start gap-3">
          <Info size={16} className="text-purple-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            O fechamento reduz um conjunto de dezenas a poucos jogos. A <strong>garantia é condicional e verificada matematicamente</strong>:
            se as 15 dezenas sorteadas estiverem <strong>todas entre as dezenas escolhidas</strong>, ao menos um jogo atinge a pontuação garantida.
            Isso <strong>não</strong> garante prêmio — a Lotofácil é um jogo de sorte.
          </p>
        </div>

        {/* Resultado do fechamento gerado */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 sm:p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">{result.model.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Trophy size={18} />
                  <span className="text-lg font-display font-bold">
                    Garante {result.guarantee} pontos
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-1">
                  se as 15 saírem entre as {result.pool.length} dezenas • {result.games.length} jogos salvos no histórico
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Pool</p>
                <p className="text-2xl font-display font-bold tabular-nums">{result.pool.length}</p>
                {poolStat && <p className="text-[10px] text-white/70">{poolStat.inHot} quentes</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {result.pool.map((n) => (
                <span key={n} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 border border-white/20 text-[11px] font-bold tabular-nums">
                  {pad(n)}
                </span>
              ))}
            </div>

            <details className="text-white/90">
              <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-white">
                Ver os {result.games.length} jogos
              </summary>
              <div className="mt-3 space-y-2">
                {result.games.map((g, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-white/50 font-bold w-6">{pad(i + 1)}</span>
                    {g.map((n) => (
                      <span key={n} className="w-6 h-6 flex items-center justify-center rounded bg-white/10 tabular-nums">{pad(n)}</span>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FECHAMENTO_MODELS.map((model, i) => {
            const isGenerating = generatingTitle === model.title;
            return (
              <div key={i} className="p-6 bg-white dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 rounded-[2rem] hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/5 transition-all group flex flex-col relative overflow-hidden">
                {model.tag && (
                  <div className="absolute top-4 right-4 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-purple-200/50">
                    {model.tag}
                  </div>
                )}

                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-zinc-800 border border-purple-100 dark:border-zinc-700 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck size={20} />
                </div>

                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">{model.title}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed min-h-[3rem]">{model.desc}</p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-2.5 bg-purple-50/50 dark:bg-zinc-900/50 rounded-xl border border-purple-50 dark:border-zinc-700">
                    <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Pool</p>
                    <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{model.poolSize} dezenas</p>
                  </div>
                  <div className="p-2.5 bg-purple-50/50 dark:bg-zinc-900/50 rounded-xl border border-purple-50 dark:border-zinc-700">
                    <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Jogos</p>
                    <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{model.numGames}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-purple-50 dark:border-zinc-700/50">
                  <Button
                    onClick={() => handleGenerate(model)}
                    disabled={!!generatingTitle}
                    className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-purple-500/20 transition-all active:scale-95"
                  >
                    {isGenerating ? <RefreshCcw className="animate-spin mr-2" size={14} /> : null}
                    {isGenerating ? 'Calculando...' : 'Gerar Fechamento'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
