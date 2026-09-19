/**
 * backtest.ts
 * Contract: Runs mass backtesting against real Lotofácil history.
 * 
 * Usage:
 *   npx tsx scripts/backtest.ts [maxDraws] [gamesPerDraw]
 *   (or bun run scripts/backtest.ts)
 */
import { normalizeDraw } from '../src/lib/lottery/analysis';
import { runBacktest, formatBacktestReport } from '../src/lib/lottery/backtest';

const API = 'https://loteriascaixa-api.herokuapp.com/api/lotofacil';

const extractDezenas = (r: any): Array<string | number> => {
  if (Array.isArray(r.dezenas)) return r.dezenas;
  if (Array.isArray(r.listaDezenas)) return r.listaDezenas;
  return [];
};

async function main() {
  const maxDraws = process.argv[2] ? parseInt(process.argv[2], 10) : 400;
  const gamesPerDraw = process.argv[3] ? parseInt(process.argv[3], 10) : 3;

  process.stdout.write(`\r🔍 Fetching Lotofácil history from ${API}...`);
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all = await res.json() as any[];
    
    process.stdout.write(`\r✅ Received ${all.length} draws. Processing...\n`);

    const chronological = all
      .map(extractDezenas)
      .map(normalizeDraw)
      .filter((d) => d.length === 15)
      .reverse();

    console.log(`📊 Testing last ${maxDraws} draws with ${gamesPerDraw} games per draw.\n`);

    const report = runBacktest(chronological, {
      gamesPerDraw,
      maxDraws,
      minHistory: 100,
      window: 100,
      candidates: 60,
    });

    console.log(formatBacktestReport(report));

    console.log('\n## Hit Distribution (Smart vs Random)\n');
    console.log('| Hits | Smart | Random |');
    console.log('|-----:|------:|-------:|');
    for (let h = 15; h >= 11; h--) {
      console.log(`| ${h} | ${report.smart.distribution[h] ?? 0} | ${report.random.distribution[h] ?? 0} |`);
    }
  } catch (err: any) {
    console.error(`\n❌ Error during backtest: ${err.message}`);
    process.exit(1);
  }
}

main();
