import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sessionKey } from '@/lib/auth/queryKeys';
import type { Session } from '@supabase/supabase-js';

/**
 * Lightweight hook to get the current userId.
 * Reuses the cached session from useAuth/AuthSync.
 */
export const useSessionUser = () => {
  const { data: session, isLoading } = useQuery<Session | null>({
    queryKey: sessionKey,
    // Relying on the centralized fetch logic or providing a minimal fallback
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: Infinity,
  });

  return { 
    userId: session?.user?.id ?? null, 
    isLoading 
  };
};
