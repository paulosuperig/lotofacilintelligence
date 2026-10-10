import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type ValidatedUser } from '@/lib/security/schemas';
import { toast } from 'sonner';
import { type Session } from '@supabase/supabase-js';
import { trackEvent, trackCustom, setAdvancedMatching, clearAdvancedMatching } from '@/lib/analytics/metaPixel';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const profileKey = (userId: string | null) => ['profile', userId] as const;
export const sessionKey = ['auth', 'session'] as const;

/**
 * Skill: Advanced Authentication & Token Management
 * Centralized auth state using TanStack Query for deduplication and performance.
 * Sequence: Session (managed via subscription) -> Profile (managed via query).
 */
export const useAuth = () => {
  const queryClient = useQueryClient();

  // 1. Session via TanStack Query (Shared across all hook calls)
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
    staleTime: Infinity, // Rely on subscription for updates
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
      // Retry logic for profile creation lag after signup
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
        email: authUser.email || '',
        role: (profile?.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
    },
  });

  // 3. Single-listener-per-hook that updates the shared cache
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Sync TanStack Query cache
        queryClient.setQueryData(sessionKey, currentSession);

        if (currentSession?.user) {
          setAdvancedMatching({
            email: currentSession.user.email,
            externalId: currentSession.user.id,
          });
          if (event === 'SIGNED_IN') {
            trackEvent('CompleteRegistration', {
              content_name: 'Login Lotofácil Intelligence',
              content_category: 'auth',
              status: true,
              value: 0,
              currency: 'BRL',
            });
            trackCustom('UserLogin', {
              content_category: 'auth',
              method: 'supabase_password',
            });
          }
        } else {
          if (event === 'SIGNED_OUT') {
            trackCustom('UserLogout', { content_category: 'auth' });
            clearAdvancedMatching();
            queryClient.removeQueries({ queryKey: ['profile'] });
            queryClient.setQueryData(sessionKey, null);
          }
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

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
  
  // Seq loading: Prevent UI flicker by waiting for BOTH session check and profile check
  const loading = sessionQuery.isLoading || (!!authUser && profileQuery.isLoading);

  return {
    user,
    session,
    loading,
    isAdmin: user?.role === 'admin',
    signOut,
  };
};
