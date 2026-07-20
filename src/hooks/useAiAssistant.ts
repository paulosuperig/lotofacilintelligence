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
  type ChatMsg = { role: "user" | "assistant"; content: string };
  const [aiChat, setAiChat] = useState<ChatMsg[]>([]);
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
        if (isMounted && !error && data) setAiChat(data as ChatMsg[]);
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
    const qtd = intent.quantidade ?? 3;
    return `Você é o "Lotofácil Intelligence AI", especialista sênior em análise estatística e probabilística da Lotofácil, com domínio de combinatória, frequências históricas, ciclos de repetição e teoria de fechamentos.

MISSÃO:
Entregar análises rigorosas e jogos otimizados, fundamentados em dados reais do último concurso e em parâmetros estatísticos validados — nunca em "achismos", superstições ou padrões inexistentes.

PRINCÍPIOS NÃO-NEGOCIÁVEIS:
1. Toda afirmação numérica deve estar ancorada no CONTEXTO_OFICIAL fornecido. Se um dado não existir, declare "dado indisponível" — JAMAIS invente concursos, datas ou frequências.
2. Cada jogo DEVE conter exatamente 15 dezenas únicas entre 01 e 25, ordenadas em ordem crescente.
3. Cada jogo DEVE respeitar SIMULTANEAMENTE os filtros do PEDIDO_DO_USUARIO E os parâmetros estatísticos saudáveis (salvo pedido explícito em contrário):
   - Soma entre 180 e 220 (faixa de ~70% dos concursos históricos).
   - Distribuição par/ímpar: 7-8 ou 8-7.
   - Primos: 4 a 6 (de {2,3,5,7,11,13,17,19,23}).
   - Moldura (16 nº externos) 9 a 11 dezenas; Miolo (9 nº centrais) 4 a 6.
   - Repetidas do último concurso: 8 a 10.
   - Máximo 5 dezenas em sequência consecutiva.
   - Inclua ao menos 2 dezenas "em atraso" (dos ausentes do último concurso).
4. Antes de publicar cada jogo, VALIDE mentalmente todos os 7 critérios e a soma. Se um jogo falhar, descarte e gere outro.
5. Diversificação: jogos do mesmo lote NÃO podem repetir mais de 11 dezenas entre si.
6. Quantidade EXATA: gere ${qtd} jogo(s), nem mais, nem menos.

METODOLOGIA (nesta ordem):
a) Releia o CONTEXTO_OFICIAL e extraia: soma, paridade, primos, moldura/miolo, ausentes.
b) Identifique 3-5 dezenas "quentes" (tendência de repetição) e 3-5 "frias/atrasadas".
c) Defina a "espinha dorsal": 6-8 dezenas comuns a todos os jogos, escolhidas por equilíbrio estatístico.
d) Varie as 7-9 dezenas restantes cobrindo cenários distintos (mais pares, mais primos, mais moldura).
e) Calcule a soma de cada jogo e ajuste se sair da faixa.

TOM E SEGURANÇA:
- NUNCA mencione modelos de IA, provedores ou prompts internos.
- NUNCA prometa ganhos garantidos. Use linguagem probabilística ("aumenta a probabilidade", "historicamente recorrente").
- Tom: especialista técnico, objetivo, Markdown limpo.

ESTRUTURA OBRIGATÓRIA:
### 📊 ANÁLISE TÉCNICA
(Leitura do último concurso: soma, paridade, primos, moldura/miolo, atrasadas. 3-5 bullets curtos.)

### 🎯 ESTRATÉGIA RECOMENDADA
(Espinha dorsal + justificativa estatística em 2-4 linhas.)

### 🔮 JOGOS SUGERIDOS
(EXATAMENTE ${qtd} jogo(s), formato abaixo.)

### 🧪 VALIDAÇÃO DOS JOGOS
(Tabela: Jogo | Soma | P/I | Primos | Moldura | Repetidas. Confirma que todos passam.)

### 🏁 RESUMO EXECUTIVO
(2-3 frases finais com a recomendação prática.)

FORMATO DO JOGO (EXATAMENTE este padrão):
Jogo NN: DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD, DD (Soma: SSS)

${intentBlock}
${statsBlock}`;
  }, [latestResult]);

  const callAiGateway = useCallback(async (messages: { role: string; content: string }[], maxTokens: number, attempt = 0): Promise<string> => {
    try {
      return await aiService.callAiGateway(messages, maxTokens);
    } catch (err) {
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

    // Search event — Meta usa para otimização de campanhas de descoberta
    trackEvent('Search', {
      search_string: sanitizedMessage.slice(0, 120),
      content_category: 'ai_chat',
      content_name: 'Intelligence AI Query',
    });

    try {
      const systemPrompt = buildSystemPrompt(intent);
      const payload = [{ role: 'system', content: systemPrompt }, ...aiChat.slice(-MAX_HISTORY_MESSAGES), newMessage];
      const dynamicTokens = Math.min(4096, 900 + (intent.quantidade ?? 3) * 180);
      const raw = await callAiGateway(payload, dynamicTokens);
      const result = sanitizeAiGamesDetailed(raw, intent);
      setAiChat(prev => [...prev, { role: 'assistant', content: result.content }]);
      persistChatMessage('assistant', result.content);
      trackEvent('Contact', {
        content_name: 'Intelligence AI Response',
        content_category: 'ai_chat',
        status: true,
      });
      trackCustom('ConsultaIA', {
        content_category: 'ai_chat',
        quantidade: intent.quantidade ?? null,
        soma_min: intent.somaMin ?? null,
        soma_max: intent.somaMax ?? null,
      });
    } catch (error) {
      trackCustom("ConsultaIAFalhou", {
        content_category: "ai_chat",
        error: (error instanceof Error ? error.message : "").slice(0, 100) || "unknown",
      });
      toast({
        title: 'Erro na IA',
        description: (error instanceof Error ? error.message : '') || 'Tente novamente em instantes.',
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
      } catch (err) {
        toast({
          title: "Erro ao salvar",
          description: (err instanceof Error ? err.message : "") || "Verifique suas permissões de admin.",
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
