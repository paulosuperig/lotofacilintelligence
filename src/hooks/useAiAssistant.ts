import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { sanitizeString, generateSecureId } from '@/lib/security/utils';
import type { LotteryResult } from '@/types/lottery';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { computeLotteryStats, formatStatsForPrompt } from '@/lib/ai/lotteryStats';
import { secureStorage } from '@/lib/security/secureStorage';
import {
  sanitizeAiGamesDetailed,
  type UserIntent,
} from '@/lib/ai/sanitizeGames';

const MAX_HISTORY_MESSAGES = 15;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Extract the user's intent (quantity of games, sum filters) from natural language.
const parseUserIntent = (message: string): UserIntent => {
  const m = message.toLowerCase();
  const intent: UserIntent = {};

  // Map Portuguese words to numbers
  const ptNumbers: Record<string, number> = {
    'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3, 'quatro': 4,
    'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14, 'quinze': 15,
    'vinte': 20, 'trinta': 30
  };

  const qtyMatch = m.match(/\b(\d{1,2}|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|trinta)\s*jogos?\b/);
  
  if (qtyMatch) {
    const val = qtyMatch[1];
    const n = ptNumbers[val] || parseInt(val, 10);
    if (n >= 1 && n <= 30) intent.quantidade = n;
  }

  // soma acima/maior/>= N | soma abaixo/menor/<= N | soma entre A e B
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

  return intent;
};

const formatIntentForPrompt = (intent: UserIntent): string => {
  const lines: string[] = ['PEDIDO_DO_USUARIO (cumpra estritamente):'];
  lines.push(`- Quantidade MANDATÓRIA de jogos: ${intent.quantidade ?? 3}`);
  if (intent.somaMin != null) lines.push(`- SOMA DEVE SER MAIOR OU IGUAL A: ${intent.somaMin}`);
  if (intent.somaMax != null) lines.push(`- SOMA DEVE SER MENOR OU IGUAL A: ${intent.somaMax}`);
  if (intent.somaMin == null && intent.somaMax == null) {
    lines.push('- Sem filtro de soma específico (equilibrar entre 180 e 220).');
  }
  lines.push(
    '- É PROIBIDO entregar menos jogos do que o solicitado.'
  );
  return lines.join('\n');
};

export const useAiAssistant = (latestResult?: LotteryResult | null) => {
  const { toast } = useToast();
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadChatHistory = async () => {
      if (!isSupabaseEnabled() || !supabase) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('role, content')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(30);

        if (isMounted && !error && data) {
          setAiChat(data as any);
        }
      } catch (err) {
        console.error("[AI] History load error:", err);
      }
    };

    loadChatHistory();
    return () => { isMounted = false; };
  }, []);

  const saveDeepSeekKey = (key: string) => {
    const sanitizedKey = sanitizeString(key.trim());
    secureStorage.setItem('deepseek_api_key', sanitizedKey);
    setDeepSeekKey(sanitizedKey);
    toast({
      title: "Configuração Salva",
      description: "A chave da API DeepSeek foi armazenada com sucesso.",
    });
  };

  const persistChatMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!isSupabaseEnabled() || !supabase) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { error } = await supabase.from('ai_chat_history').insert({
        user_id: user.id,
        role,
        content
      });
      if (error) throw error;
    } catch (error) {
      console.error("[AI] Error persisting chat message:", error);
    }
  };

  const buildSystemPrompt = useCallback((intent: UserIntent) => {
    const statsBlock = formatStatsForPrompt(computeLotteryStats(latestResult ?? null));
    const intentBlock = formatIntentForPrompt(intent);
    return `Você é o "Lotofácil Intelligence AI", inteligência artificial exclusiva do ecossistema Intelligence, especializada em estatística e análise da Lotofácil.

REGRAS DE IDENTIDADE:
- NUNCA cite empresas terceiras ou modelos externos.
- Se perguntado quem você é, responda: "Sou a Inteligência Artificial exclusiva do ecossistema Intelligence".
- Tom profissional, técnico e objetivo.

REGRAS DE FORMATO (TEXTO SIMPLES E EFICIENTE):
1. Use formato de texto simples e limpo. Evite tabelas complexas ou excesso de Markdown.
2. Estruture em: "ANALISE", "ESTRATEGIA", "JOGOS SUGERIDOS" e "RESUMO".
3. Cada jogo DEVE estar em uma linha isolada no formato:
   Jogo NN: DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD (Soma: SSS)
   Onde DD são dezenas de 01 a 25.
4. Gere EXATAMENTE a quantidade total pedida.
5. Não use cores, negritos excessivos ou decorações. Foco na legibilidade e economia de tokens.

${intentBlock}

${statsBlock}`;
  }, [latestResult]);

  const callAiGateway = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    maxTokens: number,
    attempt = 0,
  ): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke('intelligence-ai', {
        body: { messages, max_tokens: maxTokens },
      });

      if (response.error) {
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * Math.pow(2, attempt));
          return callAiGateway(messages, maxTokens, attempt + 1);
        }
        throw new Error(response.error.message || 'Erro ao chamar a IA');
      }

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Resposta vazia da IA');
      }
      return content;
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt));
        return callAiGateway(messages, maxTokens, attempt + 1);
      }
      throw err;
    }
  }, []);

  const sendMessage = useCallback(async (messageToSend: string) => {
    const sanitizedMessage = sanitizeString(messageToSend.trim());
    if (!sanitizedMessage) return;

    const intent = parseUserIntent(sanitizedMessage);
    const targetQty = intent.quantidade ?? 3;
    const maxTokens = Math.min(2048, 400 + targetQty * 100);

    const newMessage = { role: 'user' as const, content: sanitizedMessage };
    setAiChat(prev => [...prev, newMessage]);
    persistChatMessage('user', sanitizedMessage);
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

      let raw = await callAiGateway(payload, maxTokens);
      let result = sanitizeAiGamesDetailed(raw, intent);

      // Loop for continuation if the AI shipped fewer games than asked
      let currentContent = raw;
      let attempts = 0;
      
      while (result.incomplete && result.gamesFound < targetQty && attempts < 2) {
        attempts++;
        const missing = targetQty - result.gamesFound;
        const continuation = await callAiGateway(
          [
            { role: 'system', content: systemPrompt },
            ...trimmedHistory,
            newMessage,
            { role: 'assistant', content: currentContent },
            {
              role: 'user',
              content: `Continue IMEDIATAMENTE a partir do jogo ${result.gamesFound + 1}. Apenas os jogos restantes no formato solicitado.`,
            },
          ],
          Math.min(1024, 200 + missing * 100),
        );
        currentContent = `${currentContent}\n\n${continuation}`;
        result = sanitizeAiGamesDetailed(currentContent, intent);
      }

      setAiChat(prev => [...prev, { role: 'assistant', content: result.content }]);
      persistChatMessage('assistant', result.content);
    } catch (error: any) {
      console.error('Erro na IA:', error);
      toast({ 
        title: 'Erro na Inteligência Artificial', 
        description: 'Não foi possível processar sua solicitação no momento.', 
        variant: 'destructive' 
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [aiChat, buildSystemPrompt, callAiGateway, toast]);

  return {
    deepSeekKey,
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    saveDeepSeekKey,
    sendMessage,
    setAiChat,
    clearChatHistory: async () => {
      if (isSupabaseEnabled() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const { error } = await supabase.from('ai_chat_history').delete().eq('user_id', user.id);
          if (error) console.error("[AI] Error clearing chat history:", error);
        }
      }
      setAiChat([]);
    }
  };
};
