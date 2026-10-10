import { AiAssistant } from '@/components/ai/AiAssistant';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useAiGameSaver } from '@/hooks/useAiGameSaver';
import type { LotteryResult, SavedGame } from '@/types/lottery';
import type { SaveResult } from '@/lib/lottery/saveConfirmation';

export interface AiConnectedPanelProps {
  latestResult: LotteryResult | null;
  role: 'admin' | 'demo';
  onBack: () => void;
  onGoToSettings: () => void;
  onSaveGames: (games: SavedGame[]) => Promise<SaveResult>;
}

export const AiConnectedPanel = ({ latestResult, role, onBack, onGoToSettings, onSaveGames }: AiConnectedPanelProps) => {
  const { aiChat, isAiLoading, sendMessage, clearChatHistory, isAiConfigured } = useAiAssistant(latestResult);
  const { saveAiGameToHistory } = useAiGameSaver(onSaveGames);
  return <AiAssistant aiChat={aiChat} isAiLoading={isAiLoading} onSendMessage={sendMessage}
    onClearChat={clearChatHistory} isAiConfigured={isAiConfigured} onSaveAiGame={saveAiGameToHistory}
    role={role} onBack={onBack} onGoToSettings={onGoToSettings} />;
};