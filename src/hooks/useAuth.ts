import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type ValidatedUser } from '@/lib/security/schemas';
import { toast } from 'sonner';
import { type Session } from '@supabase/supabase-js';
import { trackEvent, trackCustom, setAdvancedMatching, clearAdvancedMatching } from '@/lib/analytics/metaPixel';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const profileKey = (userId: string | null) => ['profile', userId] as const;

/**
 * Skill: Advanced Authentication & Token Management
 * Sessão via subscription (`onAuthStateChange`); perfil via TanStack Query.
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const authUser = session?.user ?? null;

  const profileQuery = useQuery<ValidatedUser | null>({
    queryKey: profileKey(authUser?.id ?? null),
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      if (!authUser) return null;

      // O trigger de criação de perfil pode ainda estar rodando logo após o
      // cadastro — re-tentamos algumas vezes antes de assumir o papel padrão.
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
        email: authUser.email || '',
        role: (profile?.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
    },
  });

  useEffect(() => {
    let isMounted = true;

    // 1. Listener PRIMEIRO (evita perder eventos durante o getSession inicial).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setAuthReady(true);
        if (currentSession?.user) {
          // Advanced Matching (SHA-256) — melhora match rate em campanhas Meta
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
          }
        }
      },
    );

    // 2. Restaurar sessão existente.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setAuthReady(true);
      if (initialSession?.user) {
        setAdvancedMatching({
          email: initialSession.user.email,
          externalId: initialSession.user.id,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair', { description: error.message });
    } else {
      setSession(null);
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [queryClient]);

  // Só liberamos `loading=false` após o perfil resolver — evita o flicker da
  // tela de login no F5.
  const loading = !authReady || (!!authUser && profileQuery.isPending);
  const user = authUser ? profileQuery.data ?? null : null;

  return {
    user,
    session,
    loading,
    isAdmin: user?.role === 'admin',
    signOut,
  };
};
