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
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile && retryCount < 3) {
        console.log(`Profile not found for ${authUser.id}, retrying... (${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(authUser, retryCount + 1);
      }

      if (profile?.status === 'blocked') {
        toast.error("Acesso bloqueado", { description: "Sua conta está desativada." });
        await supabase.auth.signOut();
        setUser(null);
        return null;
      }

      const userData: ValidatedUser = {
        email: authUser.email || '',
        role: (profile?.role as 'admin' | 'demo') || 'demo',
        token: 'supabase-managed',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
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
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user);
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
