import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLottery } from '@/hooks/useLottery';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useAiGameSaver } from '@/hooks/useAiGameSaver';
import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar, MobileNav } from '@/components/layout/Navigation';
import { Header } from '@/components/layout/Header';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { DecorativeBackground, DemoBanner } from '@/components/layout/VisualDecorations';
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
    saveToHistory
  } = useLottery();

  const {
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    sendMessage,
    clearChatHistory,
    deepSeekKey,
    saveDeepSeekKey
  } = useAiAssistant(latestResult);

  const {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus
  } = useAdmin();

  const { saveAiGameToHistory } = useAiGameSaver(saveToHistory);

  const handleLogout = () => {
    signOut();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  if (loading) return null; // Prevent flicker during auth check
  
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex flex-col md:flex-row relative">
      <DecorativeBackground />

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />

        {user.role === 'demo' && <DemoBanner />}

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
                  onSaveDeepSeekKey={saveDeepSeekKey}
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
