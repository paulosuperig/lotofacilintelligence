import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { generateSecureId } from '@/lib/security/utils';

import { Sidebar, MobileNav } from '@/components/layout/Navigation';
import { Header } from '@/components/layout/Header';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import Login from '@/components/Login';

import { FechamentosPanel } from '@/components/home/FechamentosPanel';
import { TipsPanel } from '@/components/home/TipsPanel';
import { BentoGrid } from '@/components/home/BentoGrid';

const Index = () => {
  const { toast } = useToast();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const { 
    latestResult, 
    isLoading, 
    isRefreshing, 
    history, 
    fetchLatestResult, 
    clearHistory,
    saveToHistory,
    loadMore,
    hasMore
  } = useLottery();

  const {
    deepSeekKey,
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    saveDeepSeekKey,
    sendMessage,
    clearChatHistory
  } = useAiAssistant(latestResult);

  const {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus,
    saveDeepSeekKeyToSystem
  } = useAdmin();

  const handleLogout = () => {
    signOut();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  const saveAiGameToHistory = useCallback((content: string) => {
    const allNumbers = content.match(/\b\d{1,2}\b/g);
    if (allNumbers && allNumbers.length >= 15) {
      const validNums = allNumbers
        .map(n => parseInt(n, 10))
        .filter(n => Number.isInteger(n) && n >= 1 && n <= 25);
      const gamesToSave: number[][] = [];
      const seenInBatch = new Set<string>();
      for (let i = 0; i + 15 <= validNums.length; i += 15) {
        const slice = validNums.slice(i, i + 15);
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
        saveToHistory(newGames);
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

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#f5f3ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex flex-col md:flex-row relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-300/10 dark:bg-zinc-800/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />

        {user.role === 'demo' && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[clamp(8px,1.5vw,10px)] font-bold uppercase tracking-[0.2em] py-1.5 text-center z-[100] shadow-sm">
            Modo de Demonstração — Acesso VIP Intelligence
          </div>
        )}

        <main className="flex-grow w-full md:pl-[5rem] pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-12 min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[min(1600px,95%)] mx-auto p-4 sm:p-6 lg:p-10 transition-all duration-300"
          >
            <Header role={user.role} isRefreshing={isRefreshing} onRefresh={fetchLatestResult} />

            <AnimatePresence mode="wait">
              {activeTab === 'historico' && (
                <HistoryPanel 
                  history={history} 
                  onBack={() => setActiveTab('home')} 
                  onClearHistory={clearHistory} 
                  onGoToGenerator={() => setActiveTab('gerador')} 
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                />
              )}
              
              {activeTab === 'stats' && (
                <FechamentosPanel 
                  onBack={() => setActiveTab('home')} 
                  onSaveGame={(game) => saveToHistory([game])} 
                />
              )}

              {activeTab === 'dicas' && (
                <TipsPanel onBack={() => setActiveTab('home')} />
              )}

              {activeTab === 'ia' && (
                <AiAssistant 
                  deepSeekKey={deepSeekKey}
                  aiChat={aiChat}
                  isAiLoading={isAiLoading}
                  aiMessage={aiMessage}
                  onSendMessage={(e, msg) => sendMessage(msg || aiMessage)}
                  onSetAiMessage={setAiMessage}
                  onSaveAiGame={saveAiGameToHistory}
                  onClearChat={clearChatHistory}
                  onBack={() => setActiveTab('home')}
                  onGoToSettings={() => setActiveTab('ajustes')}
                  role={user.role}
                />
              )}

              {activeTab === 'ajustes' && isAdmin && (
                <AdminPanel 
                  users={users}
                  onBack={() => setActiveTab('home')}
                  onCreateOrUpdateUser={createOrUpdateUser}
                  onDeleteUser={deleteUser}
                  onToggleUserStatus={toggleUserStatus}
                  deepSeekKey={deepSeekKey}
                   onSaveDeepSeekKey={(key) => {
                     saveDeepSeekKey(key);
                     saveDeepSeekKeyToSystem(key);
                   }}
                 />
              )}

              {activeTab === 'home' || activeTab === 'gerador' ? (
                <BentoGrid 
                  latestResult={latestResult} 
                  isLoading={isLoading} 
                  historyLength={history.length}
                  onClearHistory={clearHistory}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : null}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;