import React, { lazy, Suspense } from 'react';
import { LoadingFallback } from '@/components/ui/spinner';
import { BentoGrid } from '@/components/home/BentoGrid';
import type { LotteryResult, SavedGame } from '@/types/lottery';
import type { AiAssistantProps } from '@/components/ai/AiAssistant';
import type { AdminPanelProps } from '@/components/admin/AdminPanel';

// Painéis pesados: carregados sob demanda para reduzir o bundle inicial.
const AdminPanel = lazy(() => import('@/components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const AiAssistant = lazy(() => import('@/components/ai/AiAssistant').then((m) => ({ default: m.AiAssistant })));
const HistoryPanel = lazy(() => import('@/components/history/HistoryPanel').then((m) => ({ default: m.HistoryPanel })));
const FechamentosPanel = lazy(() =>
  import('@/components/home/FechamentosPanel').then((m) => ({ default: m.FechamentosPanel })),
);
const TipsPanel = lazy(() => import('@/components/home/TipsPanel').then((m) => ({ default: m.TipsPanel })));
const StatsPanel = lazy(() => import('@/components/home/StatsPanel').then((m) => ({ default: m.StatsPanel })));
const BacktestPanel = lazy(() => import('@/components/home/BacktestPanel').then((m) => ({ default: m.BacktestPanel })));
const ConferidorPanel = lazy(() =>
  import('@/components/home/ConferidorPanel').then((m) => ({ default: m.ConferidorPanel })),
);
const BolaoPanel = lazy(() => import('@/components/home/BolaoPanel').then((m) => ({ default: m.BolaoPanel })));

export interface AppPanelsProps {
  activeTab: string;
  isAdmin: boolean;
  latestResult: LotteryResult | null;
  isLoading: boolean;
  history: SavedGame[];
  onNavigate: (tab: string) => void;
  onGoHome: () => void;
  onGoGenerator: () => void;
  onGoSettings: () => void;
  onClearHistory: () => void;
  onSaveGames: (games: SavedGame[]) => void;
  ai: Omit<AiAssistantProps, 'onBack' | 'onGoToSettings'>;
  admin: Omit<AdminPanelProps, 'onBack' | 'defaultTab'>;
}

/**
 * Seleciona o painel exibido conforme a aba ativa.
 * Mantém `Index` responsável apenas pelo layout e pela composição dos dados.
 */
export const AppPanels = ({
  activeTab,
  isAdmin,
  latestResult,
  isLoading,
  history,
  onNavigate,
  onGoHome,
  onGoGenerator,
  onGoSettings,
  onClearHistory,
  onSaveGames,
  ai,
  admin,
}: AppPanelsProps) => (
  <Suspense fallback={<LoadingFallback className="py-16" />}>
    {activeTab === 'historico' && (
      <HistoryPanel
        history={history}
        onBack={onGoHome}
        onClearHistory={onClearHistory}
        onGoToGenerator={onGoGenerator}
        latestResult={latestResult}
      />
    )}

    {activeTab === 'stats' && <FechamentosPanel onBack={onGoHome} onSaveGames={onSaveGames} />}

    {activeTab === 'dicas' && <TipsPanel onBack={onGoHome} />}

    {activeTab === 'estatisticas' && <StatsPanel onBack={onGoHome} />}

    {activeTab === 'provareal' && <BacktestPanel onBack={onGoHome} />}

    {activeTab === 'conferidor' && (
      <ConferidorPanel onBack={onGoHome} defaultConcurso={latestResult?.concurso} history={history} />
    )}

    {activeTab === 'bolao' && (
      <BolaoPanel onBack={onGoHome} defaultConcurso={latestResult?.concurso} history={history} />
    )}

    {activeTab === 'ia' && <AiAssistant {...ai} onBack={onGoHome} onGoToSettings={onGoSettings} />}

    {(activeTab === 'usuarios' || activeTab === 'ajustes') && isAdmin && (
      <AdminPanel {...admin} onBack={onGoHome} defaultTab={activeTab === 'usuarios' ? 'users' : 'settings'} />
    )}

    {(activeTab === 'home' || activeTab === 'gerador') && (
      <BentoGrid
        latestResult={latestResult}
        isLoading={isLoading}
        historyLength={history.length}
        onClearHistory={onClearHistory}
        onNavigate={onNavigate}
      />
    )}
  </Suspense>
);
