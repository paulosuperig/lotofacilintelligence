/**
 * Gerador "inteligente" de jogos da Lotofácil, genuinamente data-driven.
 *
 * Em vez de sortear 15 dezenas de forma uniforme e torcer para passarem nos
 * filtros (com fallback que aceitava QUALQUER jogo), este motor:
 *
 *  1. Pondera cada dezena por frequência histórica + atraso (equilíbrio
 *     quente/fria), quando há histórico disponível.
 *  2. Ancora ~9 dezenas no último concurso (regularidade empírica mais forte
 *     da Lotofácil: em média 9 das 15 se repetem), quando informado.
 *  3. Gera vários candidatos por amostragem ponderada SEM reposição e escolhe
 *     o de MAIOR aderência às faixas estatísticas de referência — nunca devolve
 *     um jogo fora de faixa por "desistência".
 *
 * Todo o núcleo é puro e determinístico dado um RNG, o que o torna testável.
 * Em produção o RNG padrão usa `crypto.getRandomValues`.
 */
// Fachada de compatibilidade: o motor vive em ./generation, dividido por responsabilidade.
export { gameSignature } from './gameSignature';
export { cryptoRng, seededRng, type Rng } from './generation/rng';
export type { GenStrategy, GenerateOptions, GeneratedGame, BatchOptions } from './generation/types';
export { buildWeights } from './generation/weights';
export { scoreGame } from './generation/scoring';
export { generateOptimizedGame } from './generation/optimize';
export { generateBatch } from './generation/batch';
