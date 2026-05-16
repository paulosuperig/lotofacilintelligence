import { supabase } from '@/integrations/supabase/client';
import { SavedGame } from '@/types/lottery';
import { secureStorage } from '@/lib/security/secureStorage';

export const historyService = {
  async fetchHistory(userId: string, page: number, pageSize: number): Promise<SavedGame[]> {
    const { data, error } = await supabase
      .from('games_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      numbers: item.numbers,
      timestamp: new Date(item.created_at).getTime(),
      sum: item.sum_value ?? undefined,
      model: item.model_name ?? undefined,
      type: item.type || (item.model_name ? 'Fechamento PRO' : 'IA Insight')
    }));
  },

  async saveGames(userId: string, games: SavedGame[]) {
    const gamesToInsert = games.map(game => ({
      id: game.id,
      user_id: userId,
      numbers: game.numbers,
      sum_value: game.sum,
      model_name: game.model,
      type: game.type,
      created_at: new Date(game.timestamp).toISOString()
    }));
    
    const { error } = await supabase.from('games_history').insert(gamesToInsert);
    if (error) throw error;
  },

  async deleteHistory(userId: string) {
    const { error } = await supabase
      .from('games_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async getOfflineSyncInfo(userId: string) {
    const { data } = await supabase
      .from('games_history')
      .select('id')
      .eq('user_id', userId);
    return new Set(data?.map(g => g.id) || []);
  }
};
