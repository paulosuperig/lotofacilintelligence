import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiConfigService } from '@/services/aiConfigService';
import { sanitizeString } from '@/lib/security/utils';
import { useToast } from './use-toast';
import { useSessionUser } from './useSessionUser';

export const useAiConfiguration = (enabled = true) => {
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['ai_config', 'configured', userId] as const;
  const config = useQuery({ queryKey, queryFn: () => aiConfigService.isConfigured(), enabled: enabled && !!userId, staleTime: 5 * 60 * 1000 });
  const saveDeepSeekKey = useCallback(async (key: string) => {
    try {
      await aiConfigService.saveKey(sanitizeString(key.trim()));
      queryClient.setQueryData(['ai_config', 'configured', userId], true);
      toast({ title: 'Configuração salva', description: 'A chave da API DeepSeek foi armazenada com segurança no Supabase.' });
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error instanceof Error ? error.message : 'Verifique suas permissões de admin.', variant: 'destructive' });
    }
  }, [queryClient, toast, userId]);
  return { isAiConfigured: config.data ?? false, saveDeepSeekKey };
};