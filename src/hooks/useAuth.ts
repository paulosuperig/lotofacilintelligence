import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type ValidatedUser } from '@/lib/security/schemas';
import { toast } from 'sonner';
import { type Session } from '@supabase/supabase-js';
import { setAdvancedMatching } from '@/lib/analytics/metaPixel';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const profileKey = (userId: string | null) => ['profile', userId] as const;
export const sessionKey = ['auth', 'session'] as const;

/**
 * Skill: Advanced Authentication & Token Management
 * Centralized auth state using TanStack Query.
 */
export const useAuth = () => {
  const queryClient = useQueryClient();

  // 1. Session via TanStack Query
  const sessionQuery = useQuery<Session | null>({
    queryKey: sessionKey,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdvancedMatching({
          email: session.user.email,
          externalId: session.user.id,
        });
      }
      return session;
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const session = sessionQuery.data ?? null;
  const authUser = session?.user ?? null;

  // 2. Profile query dependent on session
  const profileQuery = useQuery<ValidatedUser | null>({
    queryKey: profileKey(authUser?.id ?? null),
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      if (!authUser) return null;

      let profile: { role: string | null; status: string | null } | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', authUser.id)
          .maybeSingle();
        
        if (error) throw error;
        profile = data;
        if (profile) break;
        if (attempt < 3) await sleep(1000);
      }

      if (profile?.status === 'blocked') {
        toast.error('Acesso bloqueado', { description: 'Sua conta está desativada.' });
        await supabase.auth.signOut();
        return null;
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        role: (profile?.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
    },
  });

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair', { description: error.message });
    } else {
      queryClient.setQueryData(sessionKey, null);
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [queryClient]);

  const user = authUser ? profileQuery.data ?? null : null;
  const loading = sessionQuery.isLoading || (!!authUser && profileQuery.isLoading);

  return {
    user,
    session,
    loading,
    isAdmin: user?.role === 'admin',
    signOut,
  };
};
