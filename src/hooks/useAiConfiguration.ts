import { useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { aiConfigService } from '@/services/aiConfigService';
import { sanitizeString } from '@/lib/security/utils';
import { useToast } from './use-toast';
import { useSessionUser } from './useSessionUser';

export const useAiConfiguration = (enabled = true) => {
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const queryKey = ['ai_config', 'configured', userId] as const;
  
  const config = useQuery({ 
    queryKey, 
    queryFn: () => aiConfigService.isConfigured(), 
    enabled: enabled && !!userId, 
    staleTime: 5 * 60 * 1000 
  });

  const saveMutation = useMutation({
    mutationFn: (key: string) => aiConfigService.saveKey(sanitizeString(key.trim())),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, true);
      toast({ 
        title: 'Configuração salva', 
        description: 'A chave da API DeepSeek foi armazenada com segurança no Supabase.' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao salvar', 
        description: error instanceof Error ? error.message : 'Verifique suas permissões de admin.', 
        variant: 'destructive' 
      });
    }
  });

  const saveDeepSeekKey = useCallback(async (key: string) => {
    await saveMutation.mutateAsync(key).catch(() => undefined);
  }, [saveMutation]);

  return { 
    isAiConfigured: config.data ?? false, 
    saveDeepSeekKey,
    isSaving: saveMutation.isPending
  };
};
