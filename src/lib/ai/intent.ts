/**
 * Interpretação da intenção do usuário e diretrizes dinâmicas de estratégia
 * para o Intelligence AI. Lógica pura (sem React), portanto testável.
 */
import type { UserIntent, EstrategiaJogo } from './sanitizeGames';

/** Teto de jogos por resposta — acima disso o modelo trunca por falta de tokens. */
export const MAX_JOGOS = 12;
/** Teto de dezenas fixadas — acima disso o jogo fica praticamente determinado. */
export const MAX_FIXAS = 12;
/** Teto de dezenas excluídas — 25 − 10 = 15, o mínimo para formar um jogo. */
export const MAX_EXCLUIDAS = 10;

/** Extrai uma lista de dezenas válidas e únicas (1..25) de um trecho de texto. */
const parseDezenas = (raw: string): number[] =>
  Array.from(
    new Set(
      (raw.match(/\d{1,2}/g) ?? [])
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 1 && n <= 25)
    )
  );

const PT_NUMBERS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4,
  cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15,
  vinte: 20, trinta: 30,
};

/** Extrai quantidade, faixa de soma e estratégia da mensagem em linguagem natural. */
export const parseUserIntent = (message: string): UserIntent => {
  const m = message.toLowerCase();
  const intent: UserIntent = {};

  const qtyMatch = m.match(/\b(\d{1,2}|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|trinta)\s*jogos?\b/);
  if (qtyMatch) {
    const val = qtyMatch[1];
    const n = PT_NUMBERS[val] || parseInt(val, 10);
    // Clamp para evitar truncamento garantido da resposta (e valores absurdos):
    // acima de MAX_JOGOS o modelo estoura o teto de tokens e entrega jogos pela metade.
    if (n >= 1) intent.quantidade = Math.min(n, MAX_JOGOS);
  }

  const between = m.match(/soma\s*entre\s*(\d{2,3})\s*(?:e|a|-)\s*(\d{2,3})/);
  if (between) {
    intent.somaMin = parseInt(between[1], 10);
    intent.somaMax = parseInt(between[2], 10);
  } else {
    const above = m.match(/soma[^.]{0,30}?(?:acima|maior|superior|igual|>=?)\s*(?:de|que|a)?\s*(\d{2,3})/);
    if (above) {
      const val = parseInt(above[1], 10);
      const isInclusive = above[0].includes('>=') || above[0].includes('igual') || above[0].includes('superior');
      intent.somaMin = val + (isInclusive ? 0 : 1);
    }
    const below = m.match(/soma[^.]{0,30}?(?:abaixo|menor|inferior|igual|<=?)\s*(?:de|que|a)?\s*(\d{2,3})/);
    if (below) {
      const val = parseInt(below[1], 10);
      const isInclusive = below[0].includes('<=') || below[0].includes('igual') || below[0].includes('inferior');
      intent.somaMax = val - (isInclusive ? 0 : 1);
    }
  }

  // Dezenas FIXAS: "fixando 05 e 10", "inclua 01, 02", "com as dezenas 03 04".
  const inclMatch = m.match(
    /\b(?:fix\w*|inclu(?:a|ir|indo)|com\s+as\s+dezenas)\s*(?:[oa]s?\s+)?(?:dezenas?\s+)?:?\s*((?:\d{1,2}\s*[,e]?\s*)+)/
  );
  if (inclMatch) {
    const incl = parseDezenas(inclMatch[1]).slice(0, MAX_FIXAS);
    if (incl.length > 0) intent.incluirDezenas = incl;
  }

  // Dezenas EXCLUÍDAS: "sem a dezena 23", "excluindo 04 e 07", "tire o 25".
  const exclMatch = m.match(
    /\b(?:sem|exclu\w*|evit\w*|tire|tirando|remova|removendo)\s+(?:[oa]s?\s+)?(?:dezenas?\s+)?:?\s*((?:\d{1,2}\s*[,e]?\s*)+)/
  );
  if (exclMatch) {
    // Fixas têm precedência em conflito (fixar 10 e excluir 10 → mantém fixa).
    const excl = parseDezenas(exclMatch[1])
      .filter((n) => !(intent.incluirDezenas ?? []).includes(n))
      .slice(0, MAX_EXCLUIDAS);
    if (excl.length > 0) intent.excluirDezenas = excl;
  }

  // Estratégia (dinamismo): detecta a preferência do usuário na mensagem.
  let estrategia: EstrategiaJogo | undefined;
  if (/\bciclo\b/.test(m)) estrategia = 'ciclo';
  else if (/\brepetidas?\b/.test(m)) estrategia = 'repetidas';
  else if (/\b(quente|mais\s+sa[íi]|frequen)/.test(m)) estrategia = 'quentes';
  else if (/\b(atrasad|fria|ausente|que\s+n[ãa]o\s+sa[íi])/.test(m)) estrategia = 'atrasadas';
  else if (/\b(arriscad|agressiv|ousad|surpresa|zebra)/.test(m)) estrategia = 'agressiva';
  else if (/\b(equilibrad|balancead|seguro|conservador)/.test(m)) estrategia = 'equilibrada';
  if (estrategia) intent.estrategia = estrategia;

  return intent;
};

/** Diretriz dinâmica de composição conforme a estratégia detectada. */
export const estrategiaDirective = (estrategia?: EstrategiaJogo): string => {
  switch (estrategia) {
    case 'quentes':
      return 'ESTRATÉGIA ATIVA: QUENTES. Priorize as dezenas mais frequentes na espinha dorsal (8-9 delas), completando com 2-3 equilibrantes.';
    case 'atrasadas':
      return 'ESTRATÉGIA ATIVA: ATRASADAS. Dê peso às dezenas mais atrasadas (inclua 4-6 delas), equilibrando com 2-3 quentes para não perder consistência.';
    case 'agressiva':
      return 'ESTRATÉGIA ATIVA: AGRESSIVA. Aumente a diversificação entre os jogos e explore mais atrasadas e miolo; aceite somas nas bordas da faixa. Deixe claro que é um perfil de maior risco.';
    case 'repetidas':
      return 'ESTRATÉGIA ATIVA: REPETIDAS. Ancore cada jogo em 9-10 dezenas repetidas do último concurso (a regularidade empírica mais forte da Lotofácil), completando com 5-6 ausentes — priorize as de maior pressão de atraso.';
    case 'ciclo':
      return 'ESTRATÉGIA ATIVA: FECHAMENTO DE CICLO. Garanta forte presença das dezenas AUSENTES do último concurso: distribua as 10 ausentes pelo lote de modo que TODAS apareçam em ao menos um jogo, com 4-6 ausentes por jogo, completando com quentes.';
    case 'equilibrada':
    default:
      return 'ESTRATÉGIA ATIVA: EQUILIBRADA. Combine ~5 quentes + ~4 atrasadas + pares fortes, mantendo todas as métricas na faixa ideal.';
  }
};

/** Formata o pedido do usuário para o prompt. */
export const formatIntentForPrompt = (intent: UserIntent): string => {
  const lines: string[] = ['PEDIDO_DO_USUARIO:'];
  lines.push(`- Quantidade: ${intent.quantidade ?? 3}`);
  if (intent.somaMin != null) lines.push(`- Soma mínima: ${intent.somaMin}`);
  if (intent.somaMax != null) lines.push(`- Soma máxima: ${intent.somaMax}`);
  if (intent.estrategia) lines.push(`- Estratégia solicitada: ${intent.estrategia}`);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (intent.incluirDezenas?.length) {
    lines.push(`- Dezenas FIXAS (obrigatórias em TODOS os jogos): ${intent.incluirDezenas.map(pad).join(', ')}`);
  }
  if (intent.excluirDezenas?.length) {
    lines.push(`- Dezenas EXCLUÍDAS (proibidas em TODOS os jogos): ${intent.excluirDezenas.map(pad).join(', ')}`);
  }
  return lines.join('\n');
};
