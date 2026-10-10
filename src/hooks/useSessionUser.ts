import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sessionKey } from './useAuth';
import type { Session } from '@supabase/supabase-js';

/**
 * Lightweight hook to get the current userId.
 * Reuses the cached session from useAuth to avoid duplicate listeners and requests.
 */
export const useSessionUser = () => {
  const { data: session, isLoading } = useQuery<Session | null>({
    queryKey: sessionKey,
    // Note: useAuth handles the actual getSession/subscription logic.
    // This query just taps into the same cache key.
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
