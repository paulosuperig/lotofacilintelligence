import type { Database } from '@/integrations/supabase/types';
import type { SavedGame } from '@/types/lottery';

type HistoryRow = Pick<Database['public']['Tables']['games_history']['Row'],
  'id' | 'numbers' | 'created_at' | 'sum_value' | 'model_name' | 'type'>;

/** Shared mapping for reads and database-acknowledged inserts. */
export const mapHistoryRow = (item: HistoryRow): SavedGame => ({
  id: item.id,
  numbers: item.numbers,
  timestamp: new Date(item.created_at).getTime(),
  sum: item.sum_value ?? undefined,
  model: item.model_name ?? undefined,
  type: item.type || (item.model_name ? 'Fechamento PRO' : 'IA Insight'),
});