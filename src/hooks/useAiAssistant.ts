import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { sanitizeString } from '@/lib/security/utils';
import type { LotteryResult } from '@/types/lottery';
import { computeLotteryStats, formatStatsForPrompt } from '@/lib/ai/lotteryStats';
import {
  sanitizeAiGamesDetailed,
  type UserIntent,
} from '@/lib/ai/sanitizeGames';

const MAX_HISTORY_MESSAGES = 12;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Extract the user's intent (quantity of games, sum filters) from natural language.
const parseUserIntent = (message: string): UserIntent => {
  const m = message.toLowerCase();
  const intent: UserIntent = {};

  const qty = m.match(/\b(\d{1,2})\s*jogos?\b/);
  if (qty) {
    const n = parseInt(qty[1], 10);
    if (n >= 1 && n <= 30) intent.quantidade = n;
  }

  // soma acima/maior/>= N | soma abaixo/menor/<= N | soma entre A e B
  const between = m.match(/soma\s*entre\s*(\d{2,3})\s*(?:e|a|-)\s*(\d{2,3})/);
  if (between) {
    intent.somaMin = parseInt(between[1], 10);
    intent.somaMax = parseInt(between[2], 10);
  } else {
    const above = m.match(/soma[^.]{0,20}?(?:acima|maior|superior|>=?)\s*(?:de|que|a)?\s*(\d{2,3})/);
    if (above) intent.somaMin = parseInt(above[1], 10) + (m.includes('>=') || m.includes('igual') ? 0 : 1);
    const below = m.match(/soma[^.]{0,20}?(?:abaixo|menor|inferior|<=?)\s*(?:de|que|a)?\s*(\d{2,3})/);
    if (below) intent.somaMax = parseInt(below[1], 10) - (m.includes('<=') || m.includes('igual') ? 0 : 1);
  }

  return intent;
};

const formatIntentForPrompt = (intent: UserIntent): string => {
  const lines: string[] = ['PEDIDO_DO_USUARIO (cumpra estritamente):'];
  lines.push(`- Quantidade EXATA de jogos: ${intent.quantidade ?? 3}`);
  if (intent.somaMin != null) lines.push(`- Soma mínima por jogo: ${intent.somaMin}`);
  if (intent.somaMax != null) lines.push(`- Soma máxima por jogo: ${intent.somaMax}`);
  if (intent.somaMin == null && intent.somaMax == null) {
    lines.push('- Sem filtro de soma específico (preferir 180–220).');
  }
  lines.push(
    '- Não reduza a quantidade. Se precisar de mais espaço, encurte a "Análise" e priorize entregar TODOS os jogos.'
  );
  return lines.join('\n');
};

export const useAiAssistant = (latestResult?: LotteryResult | null) => {
  const { toast } = useToast();
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) setDeepSeekKey(savedKey);
  }, []);

  const saveDeepSeekKey = (key: string) => {
    const sanitizedKey = sanitizeString(key.trim());
    localStorage.setItem('deepseek_api_key', sanitizedKey);
    setDeepSeekKey(sanitizedKey);
    toast({
      title: "Configuração Salva",
      description: "A chave da API DeepSeek foi armazenada com sucesso.",
    });
  };

  const buildSystemPrompt = useCallback((intent: UserIntent) => {
    const statsBlock = formatStatsForPrompt(computeLotteryStats(latestResult ?? null));
    const intentBlock = formatIntentForPrompt(intent);
    return `Você é o "Lotofácil Intelligence AI", inteligência artificial exclusiva do ecossistema Intelligence, especializada em estatística, probabilidade e análise da Lotofácil.

REGRAS DE IDENTIDADE:
- NUNCA cite empresas terceiras, modelos externos (DeepSeek, OpenAI, GPT, Claude, etc.) ou tecnologias de base.
- Se perguntado quem você é, responda: "Sou a Inteligência Artificial exclusiva do ecossistema Intelligence".
- Tom profissional, técnico, objetivo e encorajador. Nunca prometa ganho.

REGRAS DE FORMATO DE RESPOSTA (Markdown):
1. Estruture em: "### Análise" (curto, 2-3 linhas), "### Estratégia" (curto, 2-3 linhas), "### Jogos sugeridos", "### Métricas".
2. Cada jogo sugerido DEVE estar em uma linha isolada dentro de um bloco de código \`\`\` no formato EXATO:
   \`NN) DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD  (soma SSS)\`
   onde NN é o número sequencial do jogo (01, 02, 03...) e DD são exatamente 15 dezenas únicas no intervalo 01-25, em ordem crescente, com 2 dígitos.
3. Auto-valide cada jogo antes de responder: 15 dezenas únicas, todas entre 1 e 25, ordenadas, e respeitando os filtros do PEDIDO_DO_USUARIO. Se algum violar, refaça.
4. Gere EXATAMENTE a quantidade pedida no PEDIDO_DO_USUARIO. Não reduza por brevidade.
5. Em "Métricas" use uma tabela compacta: jogo | soma | pares | primos | moldura | repetidas.

REGRAS DE PRECISÃO:
- Baseie sugestões nos dados oficiais abaixo. Não invente concursos nem frequências.
- Se um filtro não for atingível, diga claramente — mas ainda assim entregue a quantidade pedida com as melhores aproximações.

${intentBlock}

${statsBlock}`;
  }, [latestResult]);

  const callDeepSeek = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    apiKey: string,
    maxTokens: number,
    attempt = 0,
  ): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          stream: false,
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: maxTokens,
          presence_penalty: 0,
          frequency_penalty: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const status = response.status;
        if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
          await sleep(800 * Math.pow(2, attempt));
          return callDeepSeek(messages, apiKey, maxTokens, attempt + 1);
        }
        const errText = await response.text().catch(() => '');
        const err: any = new Error(`HTTP ${status}: ${errText.slice(0, 200)}`);
        err.status = status;
        throw err;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Resposta vazia da IA');
      }
      return content;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          await sleep(500);
          return callDeepSeek(messages, apiKey, maxTokens, attempt + 1);
        }
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      if (!err?.status && attempt < MAX_RETRIES) {
        await sleep(800 * Math.pow(2, attempt));
        return callDeepSeek(messages, apiKey, maxTokens, attempt + 1);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const sendMessage = useCallback(async (messageToSend: string) => {
    const sanitizedMessage = sanitizeString(messageToSend.trim());
    if (!sanitizedMessage) return;

    if (!deepSeekKey) {
      toast({
        title: "API Key Ausente",
        description: "Configure a chave da API nas configurações para usar a IA.",
        variant: "destructive"
      });
      return;
    }

    const intent = parseUserIntent(sanitizedMessage);
    const targetQty = intent.quantidade ?? 3;
    const maxTokens = Math.min(4096, 500 + targetQty * 140);

    const newMessage = { role: 'user' as const, content: sanitizedMessage };
    setAiChat(prev => [...prev, newMessage]);
    setAiMessage('');
    setIsAiLoading(true);

    try {
      const trimmedHistory = aiChat.slice(-MAX_HISTORY_MESSAGES);
      const systemPrompt = buildSystemPrompt(intent);
      const payload = [
        { role: 'system', content: systemPrompt },
        ...trimmedHistory,
        newMessage,
      ];

      let raw = await callDeepSeek(payload, deepSeekKey, maxTokens);
      let result = sanitizeAiGamesDetailed(raw, intent);

      // One automatic continuation if the AI shipped fewer games than asked.
      if (result.incomplete && result.gamesFound > 0 && result.gamesFound < targetQty) {
        const missing = targetQty - result.gamesFound;
        const continuation = await callDeepSeek(
          [
            { role: 'system', content: systemPrompt },
            ...trimmedHistory,
            newMessage,
            { role: 'assistant', content: raw },
            {
              role: 'user',
              content: `Faltaram ${missing} jogos. Continue numerando a partir do jogo ${String(
                result.gamesFound + 1
              ).padStart(2, '0')}, mantendo TODOS os filtros. Responda APENAS com os blocos de código \`\`\` dos jogos faltantes (sem repetir Análise/Estratégia/Métricas).`,
            },
          ],
          deepSeekKey,
          Math.min(4096, 200 + missing * 140),
        );
        const merged = `${raw}\n\n${continuation}`;
        result = sanitizeAiGamesDetailed(merged, intent);
      }

      setAiChat(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (error: any) {
      console.error('Erro na IA:', error);
      const status = error?.status;
      let title = 'Erro na Inteligência Artificial';
      let description = 'Não foi possível processar sua solicitação. Tente novamente.';
      if (status === 401 || status === 403) {
        title = 'Chave de API inválida';
        description = 'Verifique sua chave nas configurações.';
      } else if (status === 402) {
        title = 'Créditos esgotados';
        description = 'Sua chave não possui créditos suficientes.';
      } else if (status === 429) {
        title = 'Muitas requisições';
        description = 'Aguarde alguns segundos e tente novamente.';
      } else if (status >= 500) {
        title = 'Servidor da IA indisponível';
        description = 'O servidor está instável. Tente novamente em instantes.';
      } else if (typeof error?.message === 'string' && error.message.includes('Tempo limite')) {
        title = 'Tempo esgotado';
        description = error.message;
      }
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  }, [aiChat, buildSystemPrompt, callDeepSeek, deepSeekKey, toast]);

  return {
    deepSeekKey,
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    saveDeepSeekKey,
    sendMessage,
    setAiChat,
  };
};
