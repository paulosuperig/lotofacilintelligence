import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export const sessionUserKey = ['auth', 'session_user'] as const;

/**
 * Fonte única do `userId` da sessão para as queries de dados.
 * Mantém o cache sincronizado com `onAuthStateChange` (subscription, não query).
 */
export const useSessionUser = () => {
  const queryClient = useQueryClient();

  const query = useQuery<string | null>({
    queryKey: sessionUserKey,
    queryFn: async () => {
      if (!isSupabaseEnabled() || !supabase) return null;
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData<string | null>(sessionUserKey, session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return { userId: query.data ?? null, isLoading: query.isLoading };
};
