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
  const { user, login, logout, loading, isAdmin } = useAuth();
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
    deepSeekKey,
    aiChat,
    isAiLoading,
    aiMessage,
    setAiMessage,
    saveDeepSeekKey,
    sendMessage
  } = useAiAssistant();

  const {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus
  } = useAdmin();

  const handleLogin = (userData: { email: string, role: 'admin' | 'demo' }) => {
    login(userData.email, userData.role);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  const saveAiGameToHistory = useCallback((content: string) => {
    // Better regex to match both 1 and 2 digit numbers accurately
    const allNumbers = content.match(/\b\d{1,2}\b/g);
    
    if (allNumbers && allNumbers.length >= 15) {
      const gamesToSave = [];
      for (let i = 0; i < allNumbers.length; i += 15) {
        if (i + 15 <= allNumbers.length) {
          const gameNumbers = allNumbers.slice(i, i + 15).sort((a, b) => parseInt(a) - parseInt(b));
          gamesToSave.push(gameNumbers);
        }
      }

      if (gamesToSave.length > 0) {
        const newGames = gamesToSave.map(nums => ({
          id: generateSecureId(),
          numbers: nums,
          timestamp: Date.now(),
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

  if (loading) return null; // Prevent flicker during auth check
  
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] flex flex-col md:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} onLogout={handleLogout} />

      {user.role === 'demo' && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[clamp(8px,1.5vw,10px)] font-bold uppercase tracking-[0.2em] py-1.5 text-center z-[100] shadow-sm">
          Modo de Demonstração — Acesso VIP Intelligence
        </div>
      )}

      <main className="flex-grow w-full md:pl-[5rem] pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12 min-h-screen">
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
  );
};

export default Index;
