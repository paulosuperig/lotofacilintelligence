import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { sanitizeString } from '@/lib/security/utils';
import type { LotteryResult } from '@/types/lottery';
import { computeLotteryStats, formatStatsForPrompt } from '@/lib/ai/lotteryStats';
import { sanitizeAiGames } from '@/lib/ai/sanitizeGames';

const MAX_HISTORY_MESSAGES = 12;
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  const buildSystemPrompt = useCallback(() => {
    const statsBlock = formatStatsForPrompt(computeLotteryStats(latestResult ?? null));
    return `Você é o "Lotofácil Intelligence AI", inteligência artificial exclusiva do ecossistema Intelligence, especializada em estatística, probabilidade e análise da Lotofácil.

REGRAS DE IDENTIDADE:
- NUNCA cite empresas terceiras, modelos externos (DeepSeek, OpenAI, GPT, Claude, etc.) ou tecnologias de base.
- Se perguntado quem você é, responda: "Sou a Inteligência Artificial exclusiva do ecossistema Intelligence".
- Tom profissional, técnico, objetivo e encorajador. Use sempre termos como "probabilidades", "tendências", "frequências" e "estatísticas". Nunca prometa ganho.

REGRAS DE FORMATO DE RESPOSTA (Markdown):
1. Sempre estruture em seções: "### Análise", "### Estratégia", "### Jogos sugeridos", "### Métricas".
2. Cada jogo sugerido DEVE estar em uma linha isolada dentro de um bloco de código \`\`\` no formato EXATO:
   \`NN) DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD  (soma SSS)\`
   onde NN é o número do jogo (01, 02, 03...) e DD são exatamente 15 dezenas únicas no intervalo 01-25, em ordem crescente, com 2 dígitos.
3. Antes de responder, AUTO-VALIDE cada jogo: 15 dezenas, todas únicas, todas entre 1 e 25, ordenadas. Se algum violar, refaça antes de enviar.
4. Limite a 3 jogos por resposta, salvo pedido explícito de mais.
5. Em "Métricas" descreva por jogo: soma, pares/ímpares, primos, moldura/miolo e quantas repetidas do último concurso.

REGRAS DE PRECISÃO ESTATÍSTICA:
- Baseie TODAS as sugestões nos dados oficiais abaixo. Não invente concursos, datas ou frequências.
- Se um dado não estiver no contexto, declare honestamente "dado não disponível" ao invés de inventar.
- Privilegie soma 180–220, equilíbrio 7-8 ou 8-7 par/ímpar, 4–5 primos, 8–10 dezenas repetidas do concurso anterior.

${statsBlock}`;
  }, [latestResult]);

  const callDeepSeek = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    apiKey: string,
    attempt = 0
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
          max_tokens: 1500,
          presence_penalty: 0,
          frequency_penalty: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const status = response.status;
        // Retry on transient errors
        if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
          await sleep(800 * Math.pow(2, attempt));
          return callDeepSeek(messages, apiKey, attempt + 1);
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
          return callDeepSeek(messages, apiKey, attempt + 1);
        }
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      // Network error retry
      if (!err?.status && attempt < MAX_RETRIES) {
        await sleep(800 * Math.pow(2, attempt));
        return callDeepSeek(messages, apiKey, attempt + 1);
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

    const newMessage = { role: 'user' as const, content: sanitizedMessage };
    setAiChat(prev => [...prev, newMessage]);
    setAiMessage('');
    setIsAiLoading(true);

    try {
      // Truncate history to last N messages to limit tokens / cost
      const trimmedHistory = aiChat.slice(-MAX_HISTORY_MESSAGES);
      const payload = [
        { role: 'system', content: buildSystemPrompt() },
        ...trimmedHistory,
        newMessage,
      ];
      const raw = await callDeepSeek(payload, deepSeekKey);
      const cleaned = sanitizeAiGames(raw);
      setAiChat(prev => [...prev, { role: 'assistant', content: cleaned }]);
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
