/**
 * Presets de FECHAMENTO reais. Cada modelo define o tamanho do pool (nº de
 * dezenas escolhidas) e a quantidade de jogos gerados. A GARANTIA não é fixada
 * aqui — ela é **calculada e verificada** em tempo de execução pelo motor
 * (`src/lib/lottery/wheel.ts`) e exibida honestamente ao usuário.
 *
 * Pools até 20 dezenas são verificados exaustivamente de forma instantânea no
 * navegador (C(20,15) = 15.504 sorteios possíveis).
 */
export interface FechamentoModel {
  title: string;
  desc: string;
  /** nº de dezenas do pool (16..20) */
  poolSize: number;
  /** nº de jogos gerados no fechamento */
  numGames: number;
  tag?: string;
}

export const FECHAMENTO_MODELS: FechamentoModel[] = [
  {
    title: '16 Dezenas • 6 Jogos',
    desc: 'Fechamento enxuto: reduz 16 dezenas a 6 jogos com alta garantia se as 15 saírem no pool.',
    poolSize: 16,
    numGames: 6,
    tag: 'Econômico',
  },
  {
    title: '17 Dezenas • 8 Jogos',
    desc: 'Equilíbrio entre custo e cobertura ampliando o pool para 17 dezenas.',
    poolSize: 17,
    numGames: 8,
    tag: 'Equilibrado',
  },
  {
    title: '18 Dezenas • 12 Jogos',
    desc: 'O fechamento mais popular do mercado: 18 dezenas com boa garantia matemática.',
    poolSize: 18,
    numGames: 12,
    tag: 'Mais Popular',
  },
  {
    title: '19 Dezenas • 16 Jogos',
    desc: 'Cobertura ampla de 19 dezenas para quem busca mais segurança na faixa premiada.',
    poolSize: 19,
    numGames: 16,
    tag: 'Cobertura',
  },
  {
    title: '20 Dezenas • 24 Jogos',
    desc: 'Fechamento amplo de 20 dezenas — máxima cobertura com garantia verificada.',
    poolSize: 20,
    numGames: 24,
    tag: 'Premium',
  },
];
