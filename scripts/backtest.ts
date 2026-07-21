/**
 * Roda o backtesting em massa contra o histórico REAL da Lotofácil.
 *
 * Uso:
 *   bun run scripts/backtest.ts [maxDraws] [gamesPerDraw]
 *
 * Ex.: bun run scripts/backtest.ts 300 3
 *
 * Baixa todos os concursos da API pública, executa o walk-forward backtest e
 * imprime um relatório em Markdown comparando o gerador data-driven ao
 * aleatório puro.
 */
import { normalizeDraw } from '../src/lib/lottery/analysis';
import { runBacktest, formatBacktestReport } from '../src/lib/lottery/backtest';

const API = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil';

const extractDezenas = (r: unknown): Array<string | number> => {
  const row = (r ?? {}) as { dezenas?: unknown; listaDezenas?: unknown };
  if (Array.isArray(row.dezenas)) return row.dezenas as Array<string | number>;
  if (Array.isArray(row.listaDezenas)) return row.listaDezenas as Array<string | number>;
  return [];
};

const main = async () => {
  const maxDraws = process.argv[2] ? parseInt(process.argv[2], 10) : 400;
  const gamesPerDraw = process.argv[3] ? parseInt(process.argv[3], 10) : 3;

  console.error(`Baixando histórico da Lotofácil (${API})...`);
  const res = await fetch(API);
  if (!res.ok) throw new Error(`Falha ao baixar histórico: HTTP ${res.status}`);
  const all = (await res.json()) as unknown[];
  console.error(`Concursos recebidos: ${all.length}`);

  // A API retorna do mais recente para o mais antigo; ordenamos old->new.
  const chronological = all
    .map(extractDezenas)
    .map(normalizeDraw)
    .filter((d) => d.length === 15)
    .reverse();

  console.error(
    `Concursos válidos: ${chronological.length}. Testando os últimos ${maxDraws} com ${gamesPerDraw} jogos/concurso...`
  );

  const report = runBacktest(chronological, {
    gamesPerDraw,
    maxDraws,
    minHistory: 100,
    window: 100,
    candidates: 60,
  });

  console.log(formatBacktestReport(report));

  // Distribuição detalhada
  console.log('\n## Distribuição de acertos (inteligente vs aleatório)\n');
  console.log('| Acertos | Inteligente | Aleatório |');
  console.log('|--------:|------------:|----------:|');
  for (let h = 15; h >= 11; h--) {
    console.log(`| ${h} | ${report.smart.distribution[h] ?? 0} | ${report.random.distribution[h] ?? 0} |`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
