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

  const fetchProfile = useCallback(async (authUser: User, retryCount = 0) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile && retryCount < 3) {
        // Trigger might still be running, wait and retry
        console.log(`Profile not found for ${authUser.id}, retrying... (${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(authUser, retryCount + 1);
      }

      const userData: ValidatedUser = {
        email: authUser.email || '',
        role: (profile?.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      if (profile?.status === 'blocked') {
        toast.error("Acesso bloqueado", { description: "Sua conta está desativada." });
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Listener PRIMEIRO (evita perder eventos durante o getSession inicial).
    //    "Fire and forget" do fetchProfile dentro do callback para evitar deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          fetchProfile(currentSession.user).finally(() => {
            if (isMounted) setLoading(false);
          });
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // 2. Restaurar sessão existente. Só liberamos `loading=false` após o
    //    fetchProfile resolver — evita o flicker da tela de login no F5.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
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
