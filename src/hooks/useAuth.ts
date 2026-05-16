import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type ValidatedUser } from '@/lib/security/schemas';
import { toast } from 'sonner';
import { type User, type Session } from '@supabase/supabase-js';

/**
 * Resilient auth hook.
 * - Single source of truth for `loading` (always released in finally).
 * - Profile is auto-created server-side by the `on_auth_user_created` trigger,
 *   so we just fetch it. One short retry covers the race between INSERT and SELECT.
 */
export const useAuth = () => {
  const [user, setUser] = useState<ValidatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const buildUser = (authUser: User, role: 'admin' | 'demo'): ValidatedUser => ({
    email: authUser.email || '',
    role,
    token: 'supabase-managed',
    iat: Date.now(),
    exp: Date.now() + 3600000,
  });

  const fetchProfile = useCallback(async (authUser: User): Promise<void> => {
    try {
      let profile: { role: string | null; status: string | null } | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('[Auth] profile fetch error:', error);
          break;
        }
        if (data) {
          profile = data;
          break;
        }
        // Trigger may still be running on first signup
        if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
      }

      if (!profile) {
        // Fallback: assume demo so user can use the app while we investigate.
        console.warn('[Auth] no profile row found, falling back to demo role');
        setUser(buildUser(authUser, 'demo'));
        return;
      }

      if (profile.status === 'blocked') {
        toast.error('Acesso bloqueado', { description: 'Sua conta está desativada.' });
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      const role = (profile.role === 'admin' ? 'admin' : 'demo') as 'admin' | 'demo';
      setUser(buildUser(authUser, role));

      // Fire-and-forget activity ping
      supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', authUser.id)
        .then(undefined, () => undefined);
    } catch (err) {
      console.error('[Auth] fetchProfile crashed:', err);
      setUser(buildUser(authUser, 'demo'));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Subscribe FIRST so we never miss an event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      console.log('[Auth] state change:', event, currentSession?.user?.id ?? 'none');
      setSession(currentSession);

      if (!currentSession?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Defer Supabase calls to avoid deadlock inside the callback
      setTimeout(() => {
        if (!mounted) return;
        fetchProfile(currentSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    });

    // Then hydrate from existing session
    (async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted || initializedRef.current) return;
        initializedRef.current = true;

        setSession(initialSession);
        if (initialSession?.user) {
          await fetchProfile(initialSession.user);
        }
      } catch (err) {
        console.error('[Auth] init failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair', { description: error.message });
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
    signOut,
  };
};
