import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { sanitizeString } from '@/lib/security/utils';
import type { LotteryResult } from '@/types/lottery';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { computeLotteryStats, formatStatsForPrompt } from '@/lib/ai/lotteryStats';
import { aiService } from '@/services/aiService';
import { aiConfigService } from '@/services/aiConfigService';
import { sanitizeAiGamesDetailed, type UserIntent } from '@/lib/ai/sanitizeGames';
import { trackCustom, trackEvent } from '@/lib/analytics/metaPixel';

const MAX_HISTORY_MESSAGES = 15;
const MAX_RETRIES = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const parseUserIntent = (message: string): UserIntent => {
  const m = message.toLowerCase();
  const intent: UserIntent = {};
  const ptNumbers: Record<string, number> = {
    'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3, 'quatro': 4,
    'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14, 'quinze': 15,
    'vinte': 20, 'trinta': 30,
  };
  const qtyMatch = m.match(/\b(\d{1,2}|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|trinta)\s*jogos?\b/);
  if (qtyMatch) {
    const val = qtyMatch[1];
    const n = ptNumbers[val] || parseInt(val, 10);
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
  return intent;
};

const formatIntentForPrompt = (intent: UserIntent): string => {
  const lines: string[] = ['PEDIDO_DO_USUARIO:'];
  lines.push(`- Quantidade: ${intent.quantidade ?? 3}`);
  if (intent.somaMin != null) lines.push(`- Soma mínima: ${intent.somaMin}`);
  if (intent.somaMax != null) lines.push(`- Soma máxima: ${intent.somaMax}`);
  return lines.join('\n');
};

export const useAiAssistant = (latestResult?: LotteryResult | null) => {
  const { toast } = useToast();
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isAiConfigured, setIsAiConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      const ok = await aiConfigService.isConfigured();
      if (isMounted) setIsAiConfigured(ok);
    };
    loadConfig();

    const loadChatHistory = async () => {
      if (!isSupabaseEnabled() || !supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('role, content')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })
          .limit(30);
        if (isMounted && !error && data) setAiChat(data as any);
      } catch (err) {
        console.error("[AI] History load error:", err);
      }
    };
    loadChatHistory();
    return () => { isMounted = false; };
  }, []);

  const persistChatMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!isSupabaseEnabled() || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase.from('ai_chat_history').insert({
        user_id: session.user.id, role, content,
      });
    } catch (error) {
      console.error("[AI] Error persisting chat message:", error);
    }
  };

  const buildSystemPrompt = useCallback((intent: UserIntent) => {
    const statsBlock = formatStatsForPrompt(computeLotteryStats(latestResult ?? null));
    const intentBlock = formatIntentForPrompt(intent);
    return `Você é o "Lotofácil Intelligence AI", o assistente oficial de análise estatística.

    SUA MISSÃO:
    Fornecer insights profundos e sugestões de jogos baseadas em probabilidade e no histórico real.

    DIRETRIZES DE SEGURANÇA E TOM:
    - NUNCA mencione modelos de IA (OpenAI, Anthropic, DeepSeek) ou sistemas internos.
    - Use um tom de especialista em análise de dados.
    - Formate a saída com Markdown elegante.
    - Identifique padrões como "Dezenas em Atraso" e "Tendência de Repetição".

    ESTRUTURA OBRIGATÓRIA:
    ### 📊 ANÁLISE TÉCNICA
    ### 🎯 ESTRATÉGIA RECOMENDADA
    ### 🔮 JOGOS SUGERIDOS
    ### 🏁 RESUMO EXECUTIVO

    FORMATO DO JOGO:
    Jogo NN: DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD (Soma: SSS)

    ${intentBlock}
    ${statsBlock}`;
  }, [latestResult]);

  const callAiGateway = useCallback(async (messages: any[], maxTokens: number, attempt = 0): Promise<string> => {
    try {
      return await aiService.callAiGateway(messages, maxTokens);
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
    const newMessage = { role: 'user' as const, content: sanitizedMessage };
    setAiChat(prev => [...prev, newMessage]);
    persistChatMessage('user', sanitizedMessage);
    setAiMessage('');
    setIsAiLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(intent);
      const payload = [{ role: 'system', content: systemPrompt }, ...aiChat.slice(-MAX_HISTORY_MESSAGES), newMessage];
      const raw = await callAiGateway(payload, 2048);
      const result = sanitizeAiGamesDetailed(raw, intent);
      setAiChat(prev => [...prev, { role: 'assistant', content: result.content }]);
      persistChatMessage('assistant', result.content);
      trackCustom('ConsultaIA', { quantidade: intent.quantidade ?? null });
      trackEvent('Contact', { content_name: 'Intelligence AI' });
    } catch (error: any) {
      toast({
        title: 'Erro na IA',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [aiChat, buildSystemPrompt, callAiGateway, toast]);

  return {
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    sendMessage,
    setAiChat,
    isAiConfigured,
    saveDeepSeekKey: async (key: string) => {
      try {
        const clean = sanitizeString(key.trim());
        await aiConfigService.saveKey(clean);
        setIsAiConfigured(true);
        toast({
          title: "Configuração salva",
          description: "A chave da API DeepSeek foi armazenada com segurança no Supabase.",
        });
      } catch (err: any) {
        toast({
          title: "Erro ao salvar",
          description: err?.message || "Verifique suas permissões de admin.",
          variant: "destructive",
        });
      }
    },
    clearChatHistory: async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('ai_chat_history').delete().eq('user_id', session.user.id);
      }
      setAiChat([]);
    },
  };
};
