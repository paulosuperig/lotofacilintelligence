import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { BarChart3, Flame, Snowflake, Link2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Ball } from '@/components/lottery/Ball';
import { useLotteryStats } from '@/hooks/useLotteryStats';
import { TOTAL_NUMBERS, ROWS } from '@/lib/lottery/constants';

interface StatsPanelProps {
  onBack: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Paleta sequencial de uma matiz (magnitude). Recessivo nos eixos/grid.
const HUE_FREQ = '#7c3aed';   // roxo (frequência)
const HUE_DELAY = '#0284c7';  // azul (atraso)
const AXIS = '#a1a1aa';       // zinc-400: legível em claro e escuro

// Tooltip escuro (funciona em tema claro e escuro).
const TOOLTIP_STYLE = {
  background: '#18181b',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 11,
  padding: '6px 10px',
} as const;
const tipLabel = (label: string | number) => `Dezena ${label}`;
const tipValue = (unit: string) => (value: number | string): [string, string] =>
  [`${value} ${unit}`, ''];

export const StatsPanel = ({ onBack }: StatsPanelProps) => {
  const { analysis, isLoading } = useLotteryStats();

  const freqData = useMemo(() => {
    if (!analysis) return [];
    return Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
      const n = i + 1;
      const s = analysis.porNumero[n];
      return { numero: pad(n), num: n, freq: s?.frequencia ?? 0, atraso: s?.atraso ?? 0, pct: s?.percentual ?? 0 };
    });
  }, [analysis]);

  const maxPct = useMemo(
    () => (freqData.length ? Math.max(...freqData.map((d) => d.pct)) : 1),
    [freqData]
  );
  const minPct = useMemo(
    () => (freqData.length ? Math.min(...freqData.map((d) => d.pct)) : 0),
    [freqData]
  );

  const hotSet = useMemo(() => new Set(analysis?.quentes ?? []), [analysis]);
  const delayedSet = useMemo(() => new Set(analysis?.atrasadas ?? []), [analysis]);

  // intensidade sequencial (0.35..1) por percentual, para o mapa de calor
  const heatOpacity = (pct: number) => {
    if (maxPct === minPct) return 0.6;
    return 0.35 + 0.65 * ((pct - minPct) / (maxPct - minPct));
  };

  const totalConcursos = analysis?.totalConcursos ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-xl shadow-purple-500/5"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-6 text-center lg:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" /> Estatísticas
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            {totalConcursos > 0 ? `Baseado nos últimos ${totalConcursos} concursos` : 'Carregando histórico…'}
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">
          Voltar ao Início
        </Button>
      </div>

      {isLoading && !analysis && (
        <div className="py-24 flex justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-zinc-200 border-t-purple-600 animate-spin" />
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequência */}
          <section className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-1 flex items-center gap-2">
              <Flame size={14} className="text-rose-500" /> Frequência por dezena
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Quantas vezes cada dezena saiu</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={freqData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="numero" tick={{ fontSize: 9, fill: AXIS }} interval={1} tickLine={false} axisLine={{ stroke: AXIS, strokeOpacity: 0.2 }} />
                <YAxis tick={{ fontSize: 9, fill: AXIS }} tickLine={false} axisLine={false} width={30} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} contentStyle={TOOLTIP_STYLE} labelFormatter={tipLabel} formatter={tipValue('sorteios')} />
                <Bar dataKey="freq" radius={[4, 4, 0, 0]} maxBarSize={16}>
                  {freqData.map((d) => (
                    <Cell key={d.num} fill={hotSet.has(d.num) ? '#e11d48' : HUE_FREQ} fillOpacity={hotSet.has(d.num) ? 0.95 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#e11d48' }} /> mais quentes
            </p>
          </section>

          {/* Atraso */}
          <section className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-1 flex items-center gap-2">
              <Snowflake size={14} className="text-sky-500" /> Atraso atual
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Concursos desde a última aparição</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={freqData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="numero" tick={{ fontSize: 9, fill: AXIS }} interval={1} tickLine={false} axisLine={{ stroke: AXIS, strokeOpacity: 0.2 }} />
                <YAxis tick={{ fontSize: 9, fill: AXIS }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} contentStyle={TOOLTIP_STYLE} labelFormatter={tipLabel} formatter={tipValue('concursos atrás')} />
                <Bar dataKey="atraso" radius={[4, 4, 0, 0]} maxBarSize={16}>
                  {freqData.map((d) => (
                    <Cell key={d.num} fill={HUE_DELAY} fillOpacity={delayedSet.has(d.num) ? 0.95 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: HUE_DELAY }} /> mais atrasadas em destaque
            </p>
          </section>

          {/* Mapa de calor no volante 5x5 */}
          <section className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-1 flex items-center gap-2">
              <BarChart3 size={14} className="text-purple-500" /> Mapa de calor (volante)
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Intensidade = frequência histórica</p>
            <div className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto">
              {ROWS.flat().map((n) => {
                const s = analysis.porNumero[n];
                const op = heatOpacity(s?.percentual ?? 0);
                return (
                  <div
                    key={n}
                    title={`Dezena ${pad(n)} — ${Math.round((s?.percentual ?? 0) * 100)}% dos concursos`}
                    className="aspect-square rounded-xl flex items-center justify-center text-[13px] font-bold tabular-nums border border-purple-100 dark:border-zinc-700"
                    style={{ background: HUE_FREQ, opacity: op, color: op > 0.6 ? '#fff' : '#3b0764' }}
                  >
                    {pad(n)}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
              <span>Menos</span>
              <div className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${HUE_FREQ}59, ${HUE_FREQ})` }} />
              <span>Mais</span>
            </div>
          </section>

          {/* Co-ocorrência */}
          <section className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-1 flex items-center gap-2">
              <Link2 size={14} className="text-emerald-500" /> Pares que mais saem juntos
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-4">Co-ocorrência no mesmo concurso</p>
            <div className="grid grid-cols-2 gap-2.5">
              {analysis.topPairs.slice(0, 10).map((p) => (
                <div key={`${p.a}-${p.b}`} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex items-center gap-1.5">
                    <Ball number={pad(p.a)} active size="sm" />
                    <Ball number={pad(p.b)} active size="sm" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {p.count}× · {Math.round(p.percentual * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-4">
        <Info size={14} className="text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Estatísticas descritivas do histórico. Servem para montar jogos equilibrados,
          mas <strong>não preveem resultados</strong>: cada sorteio é independente e a
          Lotofácil é um jogo de azar.
        </p>
      </div>
    </motion.div>
  );
};
