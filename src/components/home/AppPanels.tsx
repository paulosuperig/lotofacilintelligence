import React, { lazy, Suspense, useEffect } from 'react';
import { LoadingFallback } from '@/components/ui/spinner';
import { BentoGrid } from '@/components/home/BentoGrid';
import type { LotteryResult, SavedGame } from '@/types/lottery';
import type { SaveResult } from '@/lib/lottery/saveConfirmation';
import { prefetchWhenIdle } from '@/lib/perf/idlePrefetch';

const loadAdmin = () => import('./AdminConnectedPanel');
const loadAi = () => import('./AiConnectedPanel');
const loadHistory = () => import('@/components/history/HistoryPanel');
const loadFechamentos = () => import('@/components/home/FechamentosPanel');
const loadTips = () => import('@/components/home/TipsPanel');
const loadStats = () => import('@/components/home/StatsPanel');
const loadBacktest = () => import('@/components/home/BacktestPanel');
const loadConferidor = () => import('@/components/home/ConferidorPanel');
const loadBolao = () => import('@/components/home/BolaoPanel');

const AdminPanel = lazy(() => loadAdmin().then((m) => ({ default: m.AdminConnectedPanel })));
const AiAssistant = lazy(() => loadAi().then((m) => ({ default: m.AiConnectedPanel })));
const HistoryPanel = lazy(() => loadHistory().then((m) => ({ default: m.HistoryPanel })));
const FechamentosPanel = lazy(() => loadFechamentos().then((m) => ({ default: m.FechamentosPanel })));
const TipsPanel = lazy(() => loadTips().then((m) => ({ default: m.TipsPanel })));
const StatsPanel = lazy(() => loadStats().then((m) => ({ default: m.StatsPanel })));
const BacktestPanel = lazy(() => loadBacktest().then((m) => ({ default: m.BacktestPanel })));
const ConferidorPanel = lazy(() => loadConferidor().then((m) => ({ default: m.ConferidorPanel })));
const BolaoPanel = lazy(() => loadBolao().then((m) => ({ default: m.BolaoPanel })));

/** Prefetch panel code after first paint; admin code only for administrators. */
const usePanelPrefetch = (isAdmin: boolean) => {
  useEffect(() => {
    const loaders: Array<() => Promise<unknown>> = [loadHistory, loadConferidor, loadFechamentos, loadBolao, loadTips, loadBacktest, loadAi, loadStats];
    if (isAdmin) loaders.push(loadAdmin);
    return prefetchWhenIdle(loaders);
  }, [isAdmin]);
};


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
  onSaveGames: (games: SavedGame[]) => Promise<SaveResult>;
  role: 'admin' | 'demo';
}

export const AppPanels = React.memo(({
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
  role,
}: AppPanelsProps) => {
  usePanelPrefetch(isAdmin);
  return (
  <Suspense fallback={<LoadingFallback className="min-h-[500px] py-16" />}>
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

    {activeTab === 'ia' && <AiAssistant latestResult={latestResult} role={role} onSaveGames={onSaveGames} onBack={onGoHome} onGoToSettings={onGoSettings} />}

    {(activeTab === 'usuarios' || activeTab === 'ajustes') && isAdmin && (
      <AdminPanel onBack={onGoHome} defaultTab={activeTab === 'usuarios' ? 'users' : 'settings'} />
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
});

AppPanels.displayName = 'AppPanels';
