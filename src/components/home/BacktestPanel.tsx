import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, RefreshCcw, Info, Cpu, Dice5, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lotteryService } from '@/services/lotteryService';
import { runBacktest, type BacktestReport, type StrategyResult } from '@/lib/lottery/backtest';
import { ResponsibleGaming } from '@/components/lottery/ResponsibleGaming';

interface BacktestPanelProps {
  onBack: () => void;
}

// Parâmetros conservadores: mantêm o cálculo no navegador em ~1-2s.
const BT_OPTS = { gamesPerDraw: 3, minHistory: 50, window: 60, candidates: 18, maxDraws: 100 };

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const StrategyCard = ({
  title,
  icon,
  accent,
  result,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  result: StrategyResult;
}) => (
  <div className="flex-1 p-5 rounded-2xl bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700">
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</span>
    </div>
    <dl className="space-y-2 text-xs">
      <div className="flex justify-between">
        <dt className="text-zinc-500 dark:text-zinc-400">Média de acertos</dt>
        <dd className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{result.avgHits.toFixed(3)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-500 dark:text-zinc-400">Taxa de prêmio (≥11)</dt>
        <dd className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{pct(result.prizeRate)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-500 dark:text-zinc-400">Melhor acerto</dt>
        <dd className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{result.bestHits}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-500 dark:text-zinc-400">Jogos testados</dt>
        <dd className="font-bold tabular-nums text-zinc-500">{result.totalGames.toLocaleString('pt-BR')}</dd>
      </div>
    </dl>
  </div>
);

export const BacktestPanel = ({ onBack }: BacktestPanelProps) => {
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    // deixa o loading pintar antes do cálculo síncrono pesado
    await new Promise((r) => setTimeout(r, 60));
    try {
      const draws = await lotteryService.getChronologicalDraws();
      if (draws.length < BT_OPTS.minHistory + 10) {
        setError('Histórico insuficiente para a prova real. Tente novamente mais tarde.');
        return;
      }
      // yield extra antes do cálculo bloqueante
      await new Promise((r) => setTimeout(r, 20));
      setReport(runBacktest(draws, BT_OPTS));
    } catch {
      setError('Não foi possível carregar o histórico para a prova real. Verifique sua conexão.');
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
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">Prova Real</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Backtest honesto: gerador inteligente vs. aleatório</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">
            Voltar ao Início
          </Button>
        </div>

        {/* Explicação honesta */}
        <div className="mb-8 p-4 rounded-2xl bg-purple-50/60 dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 flex items-start gap-3">
          <Info size={16} className="text-purple-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            A Prova Real simula, concurso a concurso do passado (<strong>walk-forward</strong>, sem "ver o futuro"), o
            desempenho do <strong>gerador inteligente</strong> contra o <strong>aleatório puro</strong>, conferindo cada
            jogo contra o resultado REAL. Serve para mostrar, com transparência, o que a "inteligência" realmente faz —
            e o que <strong>não</strong> faz.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            onClick={handleRun}
            disabled={loading}
            className="h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all active:scale-95"
          >
            {loading ? <RefreshCcw className="animate-spin mr-2" size={16} /> : <FlaskConical className="mr-2" size={16} />}
            {loading ? 'Calculando...' : report ? 'Rodar novamente' : 'Rodar Prova Real'}
          </Button>
        </div>

        {error && (
          <p className="text-center text-xs text-rose-500 mb-6">{error}</p>
        )}

        {report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
              {report.sampleConcursos.toLocaleString('pt-BR')} concursos · {report.gamesPerDraw} jogos por concurso
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <StrategyCard
                title="Gerador Inteligente"
                icon={<Cpu size={16} className="text-white" />}
                accent="bg-purple-600"
                result={report.smart}
              />
              <StrategyCard
                title="Aleatório Puro"
                icon={<Dice5 size={16} className="text-white" />}
                accent="bg-zinc-500"
                result={report.random}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-xs">
              <div className="flex-1 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 mb-1">Diferença de média de acertos</p>
                <p className="text-lg font-display font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {report.improvementAvgHits >= 0 ? '+' : ''}{report.improvementAvgHits.toFixed(3)}
                </p>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-zinc-500 dark:text-zinc-400 mb-1">Diferença de taxa de prêmio</p>
                <p className="text-lg font-display font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {report.improvementPrizeRate >= 0 ? '+' : ''}{(report.improvementPrizeRate * 100).toFixed(2)} p.p.
                </p>
              </div>
            </div>

            {/* Interpretação honesta */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-start gap-3">
              <Trophy size={18} className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-white/90">
                O sorteio é <strong>essencialmente uniforme</strong>: o valor esperado é <strong>9 acertos</strong> para
                QUALQUER conjunto de 15 dezenas, e <strong>nenhuma estratégia altera a probabilidade de prêmio</strong>.
                A prova real confirma isso — inteligente ≈ aleatório, dentro do ruído estatístico. O que a inteligência
                entrega de fato é <strong>qualidade de construção</strong> (jogos equilibrados) e <strong>diversificação
                do lote</strong> (melhor cobertura das faixas menores), não maior chance de ganhar.
              </p>
            </div>

            <ResponsibleGaming />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
