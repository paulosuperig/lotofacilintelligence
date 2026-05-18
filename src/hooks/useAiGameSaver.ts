import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSecureId } from '@/lib/security/utils';
import { SavedGame } from '@/types/lottery';

export const useAiGameSaver = (saveToHistory: (games: SavedGame[]) => Promise<any>) => {
  const { toast } = useToast();

  const saveAiGameToHistory = useCallback(async (content: string) => {
    // Better regex to match both 1 and 2 digit numbers accurately
    const allNumbers = content.match(/\b\d{1,2}\b/g);
    
    if (allNumbers && allNumbers.length >= 15) {
      // Convert to numbers and filter to valid Lotofácil range (1-25)
      const validNums = allNumbers
        .map(n => parseInt(n, 10))
        .filter(n => Number.isInteger(n) && n >= 1 && n <= 25);

      const gamesToSave: number[][] = [];
      const seenInBatch = new Set<string>();
      for (let i = 0; i + 15 <= validNums.length; i += 15) {
        const slice = validNums.slice(i, i + 15);
        // Ensure 15 unique numbers in this game
        const unique = Array.from(new Set(slice));
        if (unique.length !== 15) continue;
        const sorted = unique.sort((a, b) => a - b);
        const sig = sorted.join(',');
        if (seenInBatch.has(sig)) continue;
        seenInBatch.add(sig);
        gamesToSave.push(sorted);
      }

      if (gamesToSave.length > 0) {
        const newGames = gamesToSave.map(nums => ({
          id: generateSecureId(),
          numbers: nums,
          timestamp: Date.now(),
          sum: nums.reduce((a, b) => a + b, 0),
          type: 'IA Insight'
        }));

        await saveToHistory(newGames);
        
        toast({
          title: gamesToSave.length === 1 ? "Jogo salvo!" : `${gamesToSave.length} jogos salvos!`,
          description: "As sugestões da IA foram adicionadas ao seu histórico.",
        });
        return;
      }
    }
    
    toast({
      title: "Não foi possível salvar",
      description: "Não identificamos uma sequência válida de 15 dezenas no texto.",
      variant: "destructive"
    });
  }, [saveToHistory, toast]);

  return { saveAiGameToHistory };
};
