import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { SavedGame } from '@/types/lottery';
import { secureStorage } from '@/lib/security/secureStorage';
import { SavedGameSchema } from '@/lib/security/schemas';
import { generateSecureId } from '@/lib/security/utils';

export const historyService = {
  /**
   * Skill: @skillslovable - Full-Stack Architecture & Data Resilience
   * Busca histórico com estratégia de cache e resiliência offline.
   */
  async fetchHistory(userId: string): Promise<SavedGame[]> {
    if (!isSupabaseEnabled() || !supabase) {
      return this.getLocalHistory();
    }

    try {
      const { data, error } = await supabase
        .from('games_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const formattedHistory: SavedGame[] = (data || []).map(item => ({
        id: item.id,
        numbers: item.numbers,
        timestamp: new Date(item.created_at).getTime(),
        sum: item.sum_value ?? undefined,
        model: item.model_name ?? undefined,
        type: item.type || (item.model_name ? 'Fechamento PRO' : 'IA Insight')
      }));

      // Persistência local segura para acesso offline-first (Skill 41)
      secureStorage.setItem('lottery_history', formattedHistory);
      return formattedHistory;
    } catch (err) {
      console.warn("[historyService] Cloud fetch failed, falling back to local storage", err);
      return this.getLocalHistory();
    }
  },

  getLocalHistory(): SavedGame[] {
    const saved = secureStorage.getItem<SavedGame[]>('lottery_history');
    if (!saved || !Array.isArray(saved)) return [];

    return saved.map(g => {
      try {
        const coerced = {
          ...g,
          numbers: Array.isArray(g?.numbers)
            ? g.numbers.map((n: any) => typeof n === 'string' ? parseInt(n, 10) : n)
            : g?.numbers,
          id: g?.id || generateSecureId(),
          timestamp: g?.timestamp || Date.now(),
        };
        return SavedGameSchema.parse(coerced) as SavedGame;
      } catch (e) {
        return null;
      }
    }).filter((g): g is SavedGame => g !== null);
  },

  async saveGames(userId: string | null, games: SavedGame[]) {
    if (isSupabaseEnabled() && supabase && userId) {
      const gamesToInsert = games.map(game => ({
        user_id: userId,
        numbers: game.numbers,
        sum_value: game.sum,
        model_name: game.model,
        type: game.type,
        created_at: new Date(game.timestamp).toISOString()
      }));
      
      const { error } = await supabase.from('games_history').insert(gamesToInsert);
      if (error) throw error;
    }

    const currentLocal = this.getLocalHistory();
    const updated = [...games, ...currentLocal]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
    
    secureStorage.setItem('lottery_history', updated);
    return updated;
  },

  async syncOffline(userId: string) {
    if (!isSupabaseEnabled() || !supabase) return;

    const localHistory = this.getLocalHistory();
    if (localHistory.length === 0) return;

    // Verificar se houve uma limpeza recente que deve invalidar o sync local
    const lastClear = secureStorage.getItem<number>('last_history_clear_at') || 0;
    const toSync = localHistory.filter(g => g.timestamp > lastClear);

    if (toSync.length === 0) return;

    const { data: cloudData } = await supabase
      .from('games_history')
      .select('id')
      .eq('user_id', userId);
    
    const cloudIds = new Set(cloudData?.map(g => g.id) || []);
    const finalToSync = toSync.filter(g => !cloudIds.has(g.id));

    if (finalToSync.length > 0) {
      const gamesToInsert = toSync.map(game => ({
        id: game.id,
        user_id: userId,
        numbers: game.numbers,
        sum_value: game.sum,
        model_name: game.model,
        type: game.type,
        created_at: new Date(game.timestamp).toISOString()
      }));
      
      await supabase.from('games_history').insert(gamesToInsert);
    }
  },

  async clearHistory(userId: string | null) {
    // 1. Marcar o momento da limpeza para evitar sincronização de dados antigos
    const clearTimestamp = Date.now();
    secureStorage.setItem('last_history_clear_at', clearTimestamp);
    
    // 2. Limpar o storage local IMEDIATAMENTE
    secureStorage.removeItem('lottery_history');
    // Forçar atualização do estado em todas as tabs
    window.localStorage.removeItem('lottery_history');


    if (isSupabaseEnabled() && supabase && userId) {
      try {
        // 3. Deletar no Supabase de forma definitiva
        const { error } = await supabase
          .from('games_history')
          .delete()
          .eq('user_id', userId);
          
        if (error) throw error;
      } catch (err) {
        console.error("[historyService] Erro crítico ao limpar histórico no Cloud:", err);
        // Se falhar no cloud, ainda mantemos o local limpo e o timestamp de bloqueio
        throw err;
      }
    }
  }
};
