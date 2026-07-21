/**
 * Interpretação da intenção do usuário e diretrizes dinâmicas de estratégia
 * para o Intelligence AI. Lógica pura (sem React), portanto testável.
 */
import type { UserIntent, EstrategiaJogo } from './sanitizeGames';

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
    if (n >= 1 && n <= 30) intent.quantidade = n;
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

  // Estratégia (dinamismo): detecta a preferência do usuário na mensagem.
  let estrategia: EstrategiaJogo | undefined;
  if (/\b(quente|mais\s+sa[íi]|frequen)/.test(m)) estrategia = 'quentes';
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
  return lines.join('\n');
};
