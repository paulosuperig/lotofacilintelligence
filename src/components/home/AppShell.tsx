import React, { useCallback, useEffect, useState, startTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import type { ValidatedUser } from '@/lib/security/schemas';
import { trackEvent } from '@/lib/analytics/metaPixel';

import { Sidebar, MobileNav } from '@/components/layout/Navigation';
import { Header } from '@/components/layout/Header';
import { DecorativeBackground } from '@/components/layout/VisualDecorations';
import { AppPanels } from '@/components/home/AppPanels';

export interface AppShellProps { user: ValidatedUser; isAdmin: boolean; signOut: () => Promise<void> }

const AppShell = ({ user, isAdmin, signOut }: AppShellProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (!user) return;
    trackEvent('ViewContent', {
      content_name: `tab:${activeTab}`,
      content_category: 'app_section',
      content_ids: [activeTab],
    });
  }, [activeTab, user]);

  const { latestResult, isLoading, isRefreshing, history, fetchLatestResult, clearHistory, saveToHistory } = useLottery({ realtime: true, analysis: false });

  const handleLogout = useCallback(() => {
    signOut();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu do sistema com sucesso.",
    });
  }, [signOut, toast]);

  const goHome = useCallback(() => startTransition(() => setActiveTab('home')), []);
  const goGenerator = useCallback(() => startTransition(() => setActiveTab('gerador')), []);
  const goSettings = useCallback(() => startTransition(() => setActiveTab('ajustes')), []);

  const navigateToTab = useCallback((tab: string) => {
    startTransition(() => setActiveTab(tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-dvh bg-[#f5f3ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex flex-col md:flex-row relative w-full max-w-[100vw]">
      <DecorativeBackground />

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-dvh min-w-0">
        <Sidebar activeTab={activeTab} setActiveTab={navigateToTab} role={user.role} onLogout={handleLogout} />
        <MobileNav activeTab={activeTab} setActiveTab={navigateToTab} role={user.role} onLogout={handleLogout} />

        <main className="flex-grow w-full min-w-0 md:pl-[5rem] pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-12 min-h-dvh">
          <div
            className="w-full max-w-[min(1600px,100%)] mx-auto p-3 sm:p-6 lg:p-10 transition-all duration-300"
          >
            <Header role={user.role} isRefreshing={isRefreshing} onRefresh={fetchLatestResult} />

              <AppPanels
                activeTab={activeTab}
                isAdmin={isAdmin}
                latestResult={latestResult}
                isLoading={isLoading}
                history={history}
                onNavigate={navigateToTab}
                onGoHome={goHome}
                onGoGenerator={goGenerator}
                onGoSettings={goSettings}
                onClearHistory={clearHistory}
                onSaveGames={saveToHistory}
                role={user.role}
              />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
