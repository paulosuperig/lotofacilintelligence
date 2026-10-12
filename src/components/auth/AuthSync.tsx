import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sessionKey, profilesKey } from '@/lib/auth/queryKeys';
import { setAdvancedMatching, clearAdvancedMatching, trackEvent, trackCustom } from '@/lib/analytics/metaPixel';

export const AuthSync = () => {
  const queryClient = useQueryClient();

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
            queryClient.removeQueries({ queryKey: profilesKey });
            queryClient.setQueryData(sessionKey, null);
          }
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return null;
};
