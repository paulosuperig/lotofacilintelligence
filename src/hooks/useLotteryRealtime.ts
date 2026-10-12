import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { historyKey } from '@/lib/lottery/queryKeys';

interface UseLotteryRealtimeOptions {
  realtime: boolean;
  userId: string | null;
}

export const useLotteryRealtime = ({ realtime, userId }: UseLotteryRealtimeOptions) => {
  const queryClient = useQueryClient();
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!realtime || !userId || !isSupabaseEnabled() || !supabase) return;
    
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const client = supabase;
    
    const refresh = () => {
      if (!mounted) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (mounted) {
          void queryClient.invalidateQueries({ 
            queryKey: historyKey(userId), 
            exact: true 
          });
        }
      }, 300);
    };

    const subscribe = () => {
      const channel = client.channel(`games-history-${userId}`);
      
      try {
        channel.on('postgres_changes', {
          event: '*', 
          schema: 'public', 
          table: 'games_history', 
          filter: `user_id=eq.${userId}`,
        }, refresh).subscribe((status, error) => {
          if (!mounted) return;
          
          if (error || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Realtime] Falha na inscrição:', error ?? status);
            
            if (retryCount.current < maxRetries) {
              retryCount.current++;
              const delay = Math.pow(2, retryCount.current) * 1000;
              setTimeout(() => {
                if (mounted) subscribe();
              }, delay);
            }
          }
          
          if (status === 'SUBSCRIBED') {
            retryCount.current = 0;
            refresh();
          }
        });
      } catch (error) {
        console.error('[Realtime] Falha ao conectar:', error);
      }

      return channel;
    };

    const channel = subscribe();

    return () => {
      mounted = false;
      clearTimeout(timer);
      void client.removeChannel(channel).catch((error: unknown) => 
        console.error('[Realtime] Falha no cleanup:', error)
      );
    };
  }, [realtime, userId, queryClient]);
};
