import type { SavedGame } from '@/types/lottery';

export interface SaveResult {
  success: boolean;
  duplicate: boolean;
  savedCount: number;
}

/** Generated games are not persisted games until the saver acknowledges them. */
export async function confirmGameSave(
  games: SavedGame[],
  save: (games: SavedGame[]) => Promise<SaveResult>,
): Promise<SaveResult> {
  const outcome = await save(games);
  if (!outcome.success || outcome.savedCount <= 0) {
    return { success: false, duplicate: outcome.duplicate, savedCount: 0 };
  }
  return outcome;
}