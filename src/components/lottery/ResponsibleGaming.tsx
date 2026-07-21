import React from 'react';
import { Info } from 'lucide-react';
import { oddsForHits, oddsFor15WithGames, formatOneIn } from '@/lib/lottery/probabilities';

interface ResponsibleGamingProps {
  /**
   * Quando informado, contextualiza a chance considerando `games` apostas
   * distintas (ex.: um fechamento). Caso contrário, mostra a chance de 1 jogo.
   */
  games?: number;
  className?: string;
}

/**
 * Nota de transparência (probabilidade oficial) + jogo responsável.
 * Padrão da Caixa Econômica Federal: exibir a chance real e reforçar que se
 * trata de um jogo de azar. Nenhuma estratégia altera estas probabilidades.
 */
export const ResponsibleGaming = ({ games, className = '' }: ResponsibleGamingProps) => {
  const odds15 = games && games > 1 ? oddsFor15WithGames(games) : oddsForHits(15);
  const odds11 = oddsForHits(11);

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-4 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <Info size={14} className="text-zinc-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-700 dark:text-zinc-300">Chance real</strong>
            {games && games > 1 ? ` (com ${games} jogos)` : ''}: acertar 15 dezenas é{' '}
            <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{formatOneIn(odds15.oneIn)}</strong>
            ; acertar 11 é {formatOneIn(odds11.oneIn)}.
          </p>
          <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            A Lotofácil é um jogo de azar — nenhuma estratégia altera essas probabilidades.
            Aposte por diversão e com responsabilidade. Proibido para menores de 18 anos.
          </p>
        </div>
      </div>
    </div>
  );
};
