import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from './use-toast';
import { sanitizeString } from '@/lib/security/utils';
import type { LotteryResult } from '@/types/lottery';
import { computeLotteryStats } from '@/lib/ai/lotteryStats';
import { callAiGateway } from '@/services/aiRequestService';
import type { AiGatewayMessage } from '@/services/aiService';
import { useAiConfiguration } from './useAiConfiguration';
import { sanitizeAiGamesDetailed } from '@/lib/ai/sanitizeGames';
import { parseUserIntent } from '@/lib/ai/intent';
import { useLotteryStats } from '@/hooks/useLotteryStats';
import { useSessionUser } from '@/hooks/useSessionUser';
import { trackCustom, trackEvent } from '@/lib/analytics/metaPixel';
import { buildSystemPrompt } from '@/lib/ai/prompts';
export type { AiChatMessage } from './useAiChat';
import { useAiChat, type AiChatMessage } from './useAiChat';

const MAX_HISTORY_MESSAGES = 15;


const errorMessage = (e: unknown): string | undefined =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : undefined;

export const useAiAssistant = (latestResult?: LotteryResult | null) => {
  const { toast } = useToast();
  const { analysis } = useLotteryStats();
  const { userId } = useSessionUser();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  
  const { aiChat, appendMessage, persistChatMessage, clearChatHistory } = useAiChat(userId);
  const { isAiConfigured, saveDeepSeekKey } = useAiConfiguration();

  useEffect(() => () => activeRequest.current?.abort(), []);

  const sendMessage = useCallback(async (messageToSend: string) => {
    const sanitizedMessage = sanitizeString(messageToSend.trim());
    if (!sanitizedMessage || activeRequest.current) return;
    
    const controller = new AbortController();
    activeRequest.current = controller;

    const intent = parseUserIntent(sanitizedMessage);
    const newMessage: AiChatMessage = { role: 'user', content: sanitizedMessage };
    
    appendMessage(newMessage);
    persistChatMessage('user', sanitizedMessage);
    setIsAiLoading(true);

    trackEvent('Search', {
      search_string: sanitizedMessage.slice(0, 120),
      content_category: 'ai_chat',
      content_name: 'Intelligence AI Query',
    });

    try {
      const stats = computeLotteryStats(latestResult ?? null);
      const systemPrompt = buildSystemPrompt(intent, latestResult ?? null, analysis);
      const payload: AiGatewayMessage[] = [
        { role: 'system', content: systemPrompt },
        ...aiChat.slice(-MAX_HISTORY_MESSAGES),
        newMessage,
      ];
      
      const dynamicTokens = Math.min(8192, 1200 + (intent.quantidade ?? 3) * 260);
      const raw = await callAiGateway(payload, dynamicTokens, controller.signal);
      
      if (controller.signal.aborted) return;
      if (!raw || !raw.trim()) {
        throw new Error('A IA retornou uma resposta vazia. Toque em enviar novamente.');
      }

      const result = sanitizeAiGamesDetailed(raw, intent, stats?.dezenas);
      appendMessage({ role: 'assistant', content: result.content });
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
      if (controller.signal.aborted) return;
      const message = errorMessage(error);
      trackCustom('ConsultaIAFalhou', {
        content_category: 'ai_chat',
        error: message?.slice(0, 100) || 'unknown',
      });
      toast({
        title: 'Erro na IA',
        description: message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      if (!controller.signal.aborted) setIsAiLoading(false);
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, [aiChat, appendMessage, analysis, persistChatMessage, toast, latestResult]);

  return {
    aiChat,
    isAiLoading,
    sendMessage,
    isAiConfigured,
    saveDeepSeekKey,
    clearChatHistory,
  };
};
