import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserSchema, type ValidatedUser } from '@/lib/security/schemas';
import { toast } from 'sonner';
import { type User, type Session } from '@supabase/supabase-js';

/**
 * Skill: Advanced Authentication & Token Management
 * Migrated to Supabase Auth for persistent sessions and database integration.
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: User, retryCount = 0): Promise<ValidatedUser | null> => {
    try {
      console.log(`[Auth] Inciando busca de perfil para ${authUser.id} (Tentativa ${retryCount + 1})`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Erro ao buscar perfil:', error);
        throw error;
      }

      if (!profile) {
        if (retryCount < 2) {
          console.log(`[Auth] Perfil não encontrado, tentando novamente em 1.5s...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchProfile(authUser, retryCount + 1);
        }
        
        // Skill: Automatic Profile Recovery
        console.warn(`[Auth] Perfil ausente para ${authUser.id}. Tentando criação automática...`);
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            { id: authUser.id, email: authUser.email, role: 'demo', status: 'active' }
          ])
          .select()
          .single();
          
        if (insertError) {
          console.error('[Auth] Falha ao criar perfil:', insertError);
          // Se falhou ao inserir, retornamos um perfil temporário para não quebrar o login
          // se o usuário estiver autenticado no Supabase.
          const fallbackUser: ValidatedUser = {
            email: authUser.email || '',
            role: 'demo',
            token: 'supabase-managed',
            iat: Date.now(),
            exp: Date.now() + 3600000,
          };
          setUser(fallbackUser);
          return fallbackUser;
        }

        console.log('[Auth] Perfil criado com sucesso.');
        const userData: ValidatedUser = {
          email: authUser.email || '',
          role: (newProfile?.role as 'admin' | 'demo') || 'demo',
          token: 'supabase-managed',
          iat: Date.now(),
          exp: Date.now() + 3600000,
        };
        setUser(userData);
        return userData;
      }

      if (profile.status === 'blocked') {
        toast.error("Acesso bloqueado", { description: "Sua conta está desativada." });
        await supabase.auth.signOut();
        setUser(null);
        return null;
      }

      const userData: ValidatedUser = {
        email: authUser.email || '',
        role: (profile.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      console.log('[Auth] Perfil carregado com sucesso:', userData.role);
      setUser(userData);
      return userData;
    } catch (error: any) {
      console.error('[Auth] Erro crítico no fetchProfile:', error);
      // Fallback para evitar travamento da tela se o Supabase Auth está logado
      const fallbackUser: ValidatedUser = {
        email: authUser.email || '',
        role: 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        if (initialSession?.user) {
          await fetchProfile(initialSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state change:', event, currentSession?.user?.id);
        setSession(currentSession);

        if (currentSession?.user) {
          // Defer Supabase calls to avoid deadlock inside the auth callback
          setTimeout(() => {
            if (!mounted) return;
            fetchProfile(currentSession.user).finally(() => {
              if (mounted) setLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair", { description: error.message });
    } else {
      setUser(null);
      setSession(null);
    }
  }, []);

  return { 
    user, 
    session,
    loading, 
    isAdmin: user?.role === 'admin',
    signOut 
  };
};
