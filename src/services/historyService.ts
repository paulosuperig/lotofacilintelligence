import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { SavedGame } from '@/types/lottery';

/**
 * Skill: @skillslovable — Full-Stack Architecture
 * Persistência 100% Supabase. Sem LocalStorage / cache cliente.
 */
export const historyService = {
  async fetchHistory(userId: string): Promise<SavedGame[]> {
    if (!isSupabaseEnabled() || !supabase) return [];

    const { data, error } = await supabase
      .from('games_history')
      .select('*')
      // RLS now handles user isolation, but we keep the filter for clarity and performance
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      numbers: item.numbers,
      timestamp: new Date(item.created_at).getTime(),
      sum: item.sum_value ?? undefined,
      model: item.model_name ?? undefined,
      type: item.type || (item.model_name ? 'Fechamento PRO' : 'IA Insight'),
    }));
  },

  async saveGames(userId: string | null, games: SavedGame[]): Promise<SavedGame[]> {
    if (!isSupabaseEnabled() || !supabase || !userId) {
      throw new Error('Supabase indisponível ou usuário não autenticado.');
    }

    const gamesToInsert = games.map(game => ({
      user_id: userId,
      numbers: game.numbers,
      sum_value: game.sum,
      model_name: game.model,
      type: game.type ?? 'Manual',
      created_at: new Date(game.timestamp).toISOString(),
    }));

    const { error } = await supabase.from('games_history').insert(gamesToInsert);
    if (error) throw error;

    return this.fetchHistory(userId);
  },

  async clearHistory(userId: string | null): Promise<void> {
    if (!isSupabaseEnabled() || !supabase || !userId) return;
    const { error } = await supabase.from('games_history').delete().eq('user_id', userId);
    if (error) throw error;
  },
};
