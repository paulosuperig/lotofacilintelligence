import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSecureId } from '@/lib/security/utils';
import { SavedGame } from '@/types/lottery';
import { extractGamesFromText } from '@/lib/ai/extractGames';

interface SaveResult { success: boolean; duplicate: boolean }

export const useAiGameSaver = (
  saveToHistory: (games: SavedGame[]) => Promise<SaveResult | void>
) => {
  const { toast } = useToast();

  const saveAiGameToHistory = useCallback(async (content: string) => {
    // Extração linha a linha (remove rótulos "Jogo NN:" e ignora a análise),
    // evitando o antigo bug de fatiar todos os números da mensagem de 15 em 15.
    const gamesToSave = extractGamesFromText(content);

    if (gamesToSave.length === 0) {
      toast({
        title: "Não foi possível salvar",
        description: "Não identificamos uma sequência válida de 15 dezenas no texto.",
        variant: "destructive",
      });
      return;
    }

    const newGames: SavedGame[] = gamesToSave.map((nums) => ({
      id: generateSecureId(),
      numbers: nums,
      timestamp: Date.now(),
      sum: nums.reduce((a, b) => a + b, 0),
      type: 'IA Insight',
    }));

    const result = await saveToHistory(newGames);

    // saveToHistory deduplica contra o histórico existente.
    if (result && 'success' in result && !result.success) {
      toast({
        title: result.duplicate ? "Jogos já salvos" : "Não foi possível salvar",
        description: result.duplicate
          ? "Essas sugestões já estão no seu histórico."
          : "Tente novamente em instantes.",
        variant: result.duplicate ? "default" : "destructive",
      });
      return;
    }

    toast({
      title: gamesToSave.length === 1 ? "Jogo salvo!" : `${gamesToSave.length} jogos salvos!`,
      description: "As sugestões da IA foram adicionadas ao seu histórico.",
    });
  }, [saveToHistory, toast]);

  return { saveAiGameToHistory };
};
