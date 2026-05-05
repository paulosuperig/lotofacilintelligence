import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  History, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Bell as BellIcon,
  ChevronRight,
  Trophy,
  Calendar,
  Sparkles,
  ArrowUpRight,
  PieChart,
  Target,
  ShieldCheck,
  Trash2,
  Flame,
  Snowflake,
  Clover,
  Edit,
  UserPlus,
  Ban,
  CheckCircle,
  MoreVertical,
  Mail,
  Lock,
  Cpu,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ball } from "@/components/lottery/Ball";
import { getLatestResult } from "@/services/lotteryApi";
import { LotteryResult } from "@/types/lottery";
import { GameGenerator } from "@/components/lottery/GameGenerator";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import Login from '@/components/Login';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Index = () => {
  const [user, setUser] = useState<{ email: string, role: 'admin' | 'demo' } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'demo', status: 'active' });
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) setDeepSeekKey(savedKey);
  }, []);

  const saveDeepSeekKey = () => {
    localStorage.setItem('deepseek_api_key', deepSeekKey);
    toast({
      title: "Configuração Salva",
      description: "A chave da API DeepSeek foi armazenada com sucesso.",
    });
  };

  const handleSendAiMessage = async (e?: React.FormEvent, customMessage?: string) => {
    if (e) e.preventDefault();
    const messageToSend = customMessage || aiMessage;
    
    if (!messageToSend.trim()) return;
    if (!deepSeekKey) {
      toast({
        title: "API Key Ausente",
        description: "Configure a chave da API DeepSeek nas configurações para usar a IA.",
        variant: "destructive"
      });
      return;
    }

    const newMessage = { role: 'user' as const, content: messageToSend };
    setAiChat(prev => [...prev, newMessage]);
    if (!customMessage) setAiMessage('');
    setIsAiLoading(true);

    try {
      const systemPrompt = `Você é o "Lotofácil Intelligence AI", um especialista em estatística, probabilidade e análise de loterias brasileiras, especialmente a Lotofácil. 
      Seu objetivo é ajudar usuários a analisar tendências, sugerir números baseados em lógica matemática e fornecer insights sobre fechamentos.
      Sempre mantenha um tom profissional, técnico e encorajador. 
      Lembre-se: jogos de loteria são baseados em sorte, use termos como "probabilidades", "tendências" e "estatísticas".
      
      IMPORTANTE: Sempre que você sugerir jogos/números (sequências de 15 a 20 números), formate-os em blocos de código ou listas claras.
      Se o usuário pedir para gerar um jogo, sugira 15 números formatados como: 01, 02, 03...`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepSeekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...aiChat,
            newMessage
          ],
          stream: false
        })
      });

      if (!response.ok) throw new Error('Falha na comunicação com a API');

      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.choices[0].message.content };
      setAiChat(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro na IA:", error);
      toast({
        title: "Erro na Inteligência Artificial",
        description: "Não foi possível processar sua solicitação. Verifique sua API Key.",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveAiGameToHistory = (content: string) => {
    // Tenta extrair números do conteúdo (ex: 01, 02, 03... ou 01-02-03...)
    const numbers = content.match(/\b\d{2}\b/g);
    
    if (numbers && (numbers.length >= 15 && numbers.length <= 20)) {
      const uniqueNumbers = [...new Set(numbers)].sort((a, b) => parseInt(a) - parseInt(b)).slice(0, 15);
      
      const newGame = {
        id: Math.random().toString(36).substr(2, 9),
        numbers: uniqueNumbers,
        timestamp: Date.now(),
        type: 'IA Insight'
      };

      const existingHistory = JSON.parse(localStorage.getItem('lottery_history') || '[]');
      const updatedHistory = [newGame, ...existingHistory];
      localStorage.setItem('lottery_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
      
      toast({
        title: "Jogo salvo!",
        description: "Os números sugeridos pela IA foram adicionados ao seu histórico.",
      });
    } else {
      toast({
        title: "Não foi possível salvar",
        description: "Não identificamos uma sequência válida de 15 dezenas no texto.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('intelligence_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  useEffect(() => {
    const savedUsers = localStorage.getItem('intelligence_system_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [
        { id: '1', email: 'admin@admin.com.br', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
        { id: '2', email: 'demo@demo.com.br', role: 'demo', status: 'active', createdAt: new Date().toISOString() }
      ];
      setUsers(initialUsers);
      localStorage.setItem('intelligence_system_users', JSON.stringify(initialUsers));
    }
  }, []);

  const saveUsers = (updatedUsers: any[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('intelligence_system_users', JSON.stringify(updatedUsers));
  };

  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...userFormData } : u);
      saveUsers(updated);
      toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." });
    } else {
      const newUser = {
        ...userFormData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);
      toast({ title: "Usuário criado", description: "O novo usuário foi cadastrado com sucesso." });
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    toast({ title: "Usuário excluído", description: "O usuário foi removido do sistema." });
  };

  const toggleUserStatus = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'blocked' : 'active';
        toast({ 
          title: newStatus === 'active' ? "Usuário desbloqueado" : "Usuário bloqueado", 
          description: `O acesso para ${u.email} foi ${newStatus === 'active' ? 'restaurado' : 'suspenso'}.` 
        });
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUsers(updated);
  };

  const handleLogin = (userData: { email: string, role: 'admin' | 'demo' }) => {
    setUser(userData);
    localStorage.setItem('intelligence_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('intelligence_user');
    toast({
      title: "Sessão encerrada",
      description: "Você saiu do sistema com sucesso.",
    });
  };


  useEffect(() => {
    const saved = localStorage.getItem('lottery_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setHistory(parsed.filter((g: any) => g.timestamp > sevenDaysAgo));
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeTab]);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const data = await getLatestResult();
      setLatestResult(data);
    } catch (error) {
      console.error("Error fetching latest result:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível carregar os últimos resultados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('lottery_history');
    setHistory([]);
    toast({
      title: "Histórico limpo",
      description: "Todos os seus jogos salvos foram removidos com sucesso.",
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] text-zinc-900 selection:bg-purple-500/30 overflow-x-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Sidebar Navigation - Desktop */}
      <aside className="fixed left-8 top-1/2 -translate-y-1/2 w-16 h-auto max-h-none flex-col items-center justify-center gap-2 rounded-[2rem] p-2 bg-white/80 backdrop-blur-xl border border-purple-100 z-50 shadow-xl shadow-purple-500/10 transition-all duration-300 hidden md:flex">
        <div className="flex w-12 h-12 items-center justify-center shrink-0">
           <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-300">
             <Trophy size={20} className="text-white" />
           </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 w-12">
          <NavIcon icon={<LayoutDashboard size={20} strokeWidth={1.5} />} active={activeTab === 'home'} label="Home" onClick={() => setActiveTab('home')} />
          <NavIcon icon={<Zap size={20} strokeWidth={1.5} />} active={activeTab === 'gerador'} label="Gerador" onClick={() => {
            setActiveTab('gerador');
            document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
          }} />
          <NavIcon icon={<TrendingUp size={20} strokeWidth={1.5} />} active={activeTab === 'stats'} label="Stats" onClick={() => {
            setActiveTab('stats');
            toast({ title: "Módulo de Estatísticas", description: "Carregando análises detalhadas..." });
          }} />
          <NavIcon icon={<History size={20} strokeWidth={1.5} />} active={activeTab === 'historico'} label="Histórico" onClick={() => {
            setActiveTab('historico');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
          <NavIcon 
            icon={<Cpu size={20} strokeWidth={1.5} />} 
            active={activeTab === 'ia'} 
            label="IA" 
            onClick={() => setActiveTab('ia')}
            highlight
          />
        </div>
        <div className="flex w-12 flex-col gap-2 items-center pt-2 border-t border-purple-100/70">
           {user.role === 'admin' && (
             <NavIcon icon={<Settings size={20} strokeWidth={1.5} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
           )}
           <NavIcon icon={<LogOut size={20} strokeWidth={1.5} />} label="Sair" onClick={handleLogout} />
        </div>
      </aside>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-auto bg-white/95 backdrop-blur-xl border-t border-purple-100 z-50 flex items-center justify-between px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_25px_-5px_rgba(168,85,247,0.1)] md:hidden">
        <NavIcon icon={<LayoutDashboard size={20} strokeWidth={1.5} />} active={activeTab === 'home'} label="Início" onClick={() => setActiveTab('home')} />
        <NavIcon icon={<Zap size={20} strokeWidth={1.5} />} active={activeTab === 'gerador'} label="Gerar" onClick={() => {
          setActiveTab('gerador');
          document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
        }} />
        <NavIcon icon={<History size={20} strokeWidth={1.5} />} active={activeTab === 'historico'} label="Histórico" onClick={() => setActiveTab('historico')} />
        <NavIcon 
          icon={<Cpu size={20} strokeWidth={1.5} />} 
          active={activeTab === 'ia'} 
          label="IA" 
          onClick={() => setActiveTab('ia')} 
          highlight
        />
        {user.role === 'admin' ? (
          <NavIcon icon={<Settings size={20} strokeWidth={1.5} />} active={activeTab === 'ajustes'} label="Ajustes" onClick={() => setActiveTab('ajustes')} />
        ) : (
          <NavIcon icon={<LogOut size={20} strokeWidth={1.5} />} label="Sair" onClick={handleLogout} />
        )}
      </nav>

      {user.role === 'demo' && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 text-center z-[100] shadow-sm">
          Modo de Demonstração — Algumas funcionalidades podem estar limitadas
        </div>
      )}




      <main className="pb-24 md:pb-12 md:pl-32">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-12 lg:p-16">
          
          {/* Top Header - Minimalist */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 md:mt-0 mb-10 md:mb-16 gap-6 md:gap-8 relative">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-auto flex flex-col items-center md:items-start text-center md:text-left"
            >
              <div className="flex flex-col md:flex-row items-center gap-2 mb-2 md:mb-4">
                <div className="flex items-center gap-2">
                  <Clover size={14} className="text-purple-600 animate-pulse md:order-last" />
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse hidden md:block" />
                </div>
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] md:tracking-[0.25em] text-purple-600/60">Membro Premium Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-zinc-900">
                Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end"
            >
              <button 
                onClick={fetchData}
                disabled={isRefreshing}
                className="hidden md:flex w-10 h-10 rounded-xl bg-white border border-purple-100 items-center justify-center text-purple-600 hover:border-purple-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
                  <Sparkles size={18} />
                </motion.div>
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900">{user.role === 'admin' ? 'Administrador' : 'Membro VIP'}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">{user.role === 'admin' ? 'Acesso Total' : 'Acesso Demonstrativo'}</p>

              </div>
              <div className="hidden md:flex w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 border border-purple-100 items-center justify-center text-sm font-display font-bold text-white group cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                <span className="group-hover:scale-110 transition-transform duration-500">VIP</span>
              </div>
            </motion.div>
          </header>

          {/* Bento Grid Layout */}
          <AnimatePresence mode="wait">
            {activeTab === 'historico' ? (
              <motion.div
                key="history-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-3xl md:rounded-[2rem] p-6 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-1 md:mb-2">Seu Histórico</h2>
                      <p className="text-zinc-500 text-xs">Jogos salvos nos últimos 7 dias</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {history.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={18} className="mr-2" />
                              Limpar Histórico
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Todos os seus jogos salvos serão removidos permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={clearHistory} className="bg-red-500 hover:bg-red-600 text-white">
                                Limpar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('home')}
                        className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                      >
                        Voltar ao Início
                      </Button>
                    </div>
                  </div>

                  {history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map((item, idx) => (
                        <div key={idx} className="p-6 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                              {new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const text = `Confira meu jogo da Lotofácil gerado pelo Intelligence: ${item.numbers.map((n: number) => n.toString().padStart(2, '0')).join(', ')}`;
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
                                title="Compartilhar no WhatsApp"
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.624 1.435h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z\" />
                                </svg>
                              </button>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.numbers.map((num: number, i: number) => (
                              <span key={i} className="w-8 h-8 rounded-lg bg-white border border-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shadow-sm">
                                {num.toString().padStart(2, '0')}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-200 mb-6">
                        <History size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">Nenhum jogo encontrado</h3>
                      <p className="text-zinc-500 max-w-xs">Gere novos jogos no Gerador Inteligente para vê-los aqui.</p>
                      <Button 
                        onClick={() => setActiveTab('gerador')}
                        className="mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-8"
                      >
                        Ir para Gerador
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'stats' ? (
              <motion.div
                key="fechamentos-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-3xl md:rounded-[2rem] p-6 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-1 md:mb-2">Fechamentos PRO</h2>
                      <p className="text-zinc-500 text-xs">Modelos matemáticos exclusivos</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar ao Início
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: "R7 - 14 Pontos", desc: "Fechamento garantindo 14 pontos se acertar 15 números.", numbers: 15 },
                      { title: "Especial Ímpares", desc: "Foco total na tendência de 8 ou 9 ímpares.", numbers: 20 },
                      { title: "Redução de Quadrantes", desc: "Distribuição inteligente em todos os quadrantes.", numbers: 18 },
                      { title: "Ciclo Mestre", desc: "Modelos baseados no ciclo das dezenas.", numbers: 22 },
                      { title: "VIP 25-15-14", desc: "Sistema premium de alta performance.", numbers: 25 },
                      { title: "Filtro de Soma", desc: "Jogos balanceados por soma de dezenas.", numbers: 15 }
                    ].map((model, i) => (
                      <div key={i} className="p-8 bg-purple-50/50 border border-purple-100 rounded-[2rem] hover:border-purple-300 transition-all group flex flex-col">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform shrink-0">
                          <ShieldCheck size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 mb-2 leading-tight min-h-[3.5rem]">{model.title}</h4>
                        <p className="text-xs text-zinc-500 mb-6 leading-relaxed flex-grow">{model.desc}</p>
                        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-purple-100">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{model.numbers} Dezenas</span>
                          <Button 
                            onClick={() => {
                              const numbers: number[] = [];
                              const pool = Array.from({ length: 25 }, (_, idx) => idx + 1);
                              for (let k = 0; k < model.numbers && pool.length > 0; k++) {
                                const randIdx = Math.floor(Math.random() * pool.length);
                                numbers.push(pool.splice(randIdx, 1)[0]);
                              }
                              const sorted = numbers.sort((a, b) => a - b);
                              const saved = JSON.parse(localStorage.getItem('lottery_history') || '[]');
                              const newGame = { numbers: sorted, timestamp: Date.now(), model: model.title };
                              localStorage.setItem('lottery_history', JSON.stringify([newGame, ...saved].slice(0, 100)));
                              toast({
                                title: `Modelo "${model.title}" gerado!`,
                                description: `${model.numbers} dezenas: ${sorted.map(n => n.toString().padStart(2, '0')).join(' ')}`,
                              });
                            }}
                            className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-purple-500/20"
                          >
                            Usar Modelo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'dicas' ? (
              <motion.div
                key="dicas-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-10 gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                      <h2 className="text-3xl font-display font-bold text-zinc-900 mb-2">Dicas do Especialista</h2>
                      <p className="text-zinc-500 text-sm">Análises estratégicas baseadas nos últimos 5 anos de resultados</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar ao Início
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-[2.5rem]">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                          <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Números "Quentes" (5 Anos)</h3>
                      </div>
                      <p className="text-sm text-zinc-600 mb-8 leading-relaxed">Dezenas que apareceram em mais de 65% dos sorteios desde 2021.</p>
                      <div className="flex flex-wrap gap-3">
                        {[13, 20, 24, 10, 1, 11, 25, 4].map(num => (
                          <Ball key={num} number={num.toString()} active size="md" />
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-white border border-purple-100 rounded-[2.5rem] shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                          <TrendingUp size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">Estratégia de Quadrantes</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q1 (01-05)</span>
                          <span className="text-sm font-bold text-purple-600">Alta Frequência</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q3 (11-15)</span>
                          <span className="text-sm font-bold text-emerald-500">Equilibrado</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Q5 (21-25)</span>
                          <span className="text-sm font-bold text-amber-500">Padrão de Repetição</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-8 bg-zinc-900 rounded-[2.5rem] text-white overflow-hidden relative group">
                    <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                      <Target size={200} />
                    </div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <Sparkles className="text-purple-400" /> Insight Premium
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      A análise histórica mostra que jogos com soma entre 180 e 210 representam 72% dos ganhadores da faixa principal nos últimos 5 anos. Evite jogos com soma inferior a 150 ou superior a 240.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pares Ideal</p>
                        <p className="text-lg font-bold">7 ou 8</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Primos Ideal</p>
                        <p className="text-lg font-bold">5 ou 6</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Repetidos</p>
                        <p className="text-lg font-bold">9 ou 10</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Moldura</p>
                        <p className="text-lg font-bold">10 ou 11</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            ) : activeTab === 'ia' ? (
              <motion.div
                key="ia-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-3xl md:rounded-[2rem] p-4 md:p-8 shadow-xl shadow-purple-500/5 min-h-[600px] flex flex-col">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <div className="flex flex-col items-center md:items-start">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                          <Cpu size={20} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900">Intelligence AI</h2>
                      </div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] ml-1">Análises & Probabilidades em Tempo Real</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('home')}
                      className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                    >
                      Voltar
                    </Button>
                  </div>

                  <div className="flex-grow flex flex-col bg-purple-50/30 rounded-[2rem] border border-purple-100 overflow-hidden relative">
                    {!deepSeekKey && user.role === 'admin' ? (
                      <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                        <div className="max-w-md">
                          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Key size={32} />
                          </div>
                          <h3 className="text-lg font-bold mb-2">Configuração Necessária</h3>
                          <p className="text-sm text-zinc-500 mb-6">A API do DeepSeek ainda não foi configurada. Vá em Configurações para inserir sua chave.</p>
                          <Button onClick={() => setActiveTab('ajustes')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                            Configurar Agora
                          </Button>
                        </div>
                      </div>
                    ) : !deepSeekKey && user.role !== 'admin' ? (
                      <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                        <div className="max-w-md">
                          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} />
                          </div>
                          <h3 className="text-lg font-bold mb-2">IA Indisponível</h3>
                          <p className="text-sm text-zinc-500">A Inteligência Artificial está temporariamente desativada pelo administrador.</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[450px]">
                      {aiChat.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-6">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-purple-400 mb-4">
                            <Cpu size={32} />
                          </div>
                          <p className="text-sm text-zinc-500 max-w-xs mb-8">Olá! Eu sou seu assistente inteligente. Como posso ajudar com suas análises hoje?</p>
                          
                          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <button 
                              onClick={() => handleSendAiMessage(undefined, "Quais são as dezenas mais quentes para o próximo concurso?")}
                              className="p-4 bg-white border border-purple-100 rounded-2xl text-left hover:border-purple-300 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Flame size={18} />
                              </div>
                              <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Dezenas Quentes</p>
                              <p className="text-[10px] text-zinc-400">Análise de frequência dos últimos 10 concursos</p>
                            </button>

                            <button 
                              onClick={() => handleSendAiMessage(undefined, "Pode gerar uma sugestão de jogo com 15 dezenas baseada em tendências?")}
                              className="p-4 bg-white border border-purple-100 rounded-2xl text-left hover:border-purple-300 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Sparkles size={18} />
                              </div>
                              <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Gerar com IA</p>
                              <p className="text-[10px] text-zinc-400">Criação de jogos baseada em lógica matemática</p>
                            </button>

                            <button 
                              onClick={() => handleSendAiMessage(undefined, "Quais são os padrões de pares e ímpares que mais saem?")}
                              className="p-4 bg-white border border-purple-100 rounded-2xl text-left hover:border-purple-300 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <PieChart size={18} />
                              </div>
                              <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Padrões e Somas</p>
                              <p className="text-[10px] text-zinc-400">Verificação de equilíbrio e comportamento estatístico</p>
                            </button>

                            <button 
                              onClick={() => handleSendAiMessage(undefined, "Explique os melhores fechamentos para quem quer garantir 14 pontos")}
                              className="p-4 bg-white border border-purple-100 rounded-2xl text-left hover:border-purple-300 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={18} />
                              </div>
                              <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Dicas de Fechamento</p>
                              <p className="text-[10px] text-zinc-400">Estratégias avançadas para aumentar as chances</p>
                            </button>
                          </div>
                        </div>
                      ) : (
                        aiChat.map((msg, i) => (
                          <div key={i} className={cn(
                            "flex flex-col max-w-[90%] md:max-w-[85%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group/msg",
                              msg.role === 'user' 
                                ? "bg-purple-600 text-white rounded-tr-none" 
                                : "bg-white text-zinc-700 border border-purple-100 rounded-tl-none"
                            )}>
                              {msg.role === 'assistant' ? (
                                <>
                                  <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-zinc-900 prose-h1:text-base prose-h2:text-base prose-h3:text-sm prose-h4:text-sm prose-p:my-2 prose-p:leading-relaxed prose-strong:text-purple-700 prose-strong:font-bold prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-hr:my-3 prose-hr:border-purple-100 prose-code:text-purple-700 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                  </div>
                                  <div className="flex justify-end mt-2 pt-2 border-t border-purple-50">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg gap-1.5"
                                      onClick={() => saveAiGameToHistory(msg.content)}
                                    >
                                      <History size={12} /> Salvar Jogo
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-widest px-1">
                              {msg.role === 'user' ? 'Você' : 'Lotofácil Intelligence'}
                            </span>
                          </div>
                        ))
                      )}
                      {isAiLoading && (
                        <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-widest">Analisando dados...</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendAiMessage} className="p-4 bg-white border-t border-purple-100 flex gap-2">
                      <Input 
                        placeholder="Pergunte ao especialista..." 
                        value={aiMessage}
                        onChange={(e) => setAiMessage(e.target.value)}
                        className="rounded-xl border-purple-100"
                        disabled={isAiLoading || !deepSeekKey}
                      />
                      <Button 
                        type="submit" 
                        disabled={isAiLoading || !deepSeekKey}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl w-12 h-10 p-0 shrink-0"
                      >
                        <Send size={18} />
                      </Button>
                    </form>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'ajustes' && user.role === 'admin' ? (
              <motion.div
                key="ajustes-page"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="bg-white border border-purple-200 rounded-3xl md:rounded-[2rem] p-6 md:p-12 shadow-xl shadow-purple-500/5">
                  <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-1 md:mb-2">Configurações do Sistema</h2>
                      <p className="text-zinc-500 text-xs">Gerenciamento de usuários e acessos</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                        setIsUserDialogOpen(open);
                        if (!open) {
                          setEditingUser(null);
                          setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                            <UserPlus size={18} className="mr-2" />
                            Novo Usuário
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
                            <DialogDescription>
                              Preencha os dados do usuário abaixo.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">E-mail</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <Input 
                                  id="email" 
                                  type="email" 
                                  className="pl-10 rounded-xl"
                                  placeholder="email@exemplo.com"
                                  value={userFormData.email}
                                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                                  required
                                />
                              </div>
                            </div>
                            {!editingUser && (
                              <div className="space-y-2">
                                <Label htmlFor="password">Senha Temporária</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                  <Input 
                                    id="password" 
                                    type="password" 
                                    className="pl-10 rounded-xl"
                                    placeholder="••••••••"
                                    value={userFormData.password}
                                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                                    required={!editingUser}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="role">Perfil de Acesso</Label>
                              <Select 
                                value={userFormData.role} 
                                onValueChange={(value: any) => setUserFormData({...userFormData, role: value})}
                              >
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="demo">Demonstrativo (VIP)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter className="pt-4">
                              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12">
                                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('home')}
                        className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-purple-100">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-purple-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Usuário</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Perfil</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  u.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-zinc-100 text-zinc-500"
                                )}>
                                  {u.role === 'admin' ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-900">{u.email}</p>
                                  <p className="text-[10px] text-zinc-500">
                                    Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-700"
                              )}>
                                {u.role === 'admin' ? 'Admin' : 'Demo'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                                )}></span>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase">
                                  {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setEditingUser(u);
                                    setUserFormData({ email: u.email, password: '', role: u.role, status: u.status });
                                    setIsUserDialogOpen(true);
                                  }} className="cursor-pointer">
                                    <Edit size={14} className="mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleUserStatus(u.id)} className="cursor-pointer">
                                    {u.status === 'active' ? (
                                      <><Ban size={14} className="mr-2 text-amber-500" /> Bloquear</>
                                    ) : (
                                      <><CheckCircle size={14} className="mr-2 text-emerald-500" /> Desbloquear</>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 cursor-pointer">
                                        <Trash2 size={14} className="mr-2" /> Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. O usuário {u.email} perderá acesso imediato ao sistema.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteUser(u.id)}
                                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                        >
                                          Confirmar Exclusão
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 p-8 border-t border-purple-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Cpu size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 leading-none">Integração DeepSeek AI</h3>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Configuração de Inteligência Artificial</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl mb-8">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">API Key do DeepSeek</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <Input 
                              type={showKey ? "text" : "password"} 
                              placeholder="sk-..." 
                              value={deepSeekKey}
                              onChange={(e) => setDeepSeekKey(e.target.value)}
                              className="pl-10 rounded-xl border-purple-100"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-600 transition-colors"
                            >
                              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <Button 
                            onClick={saveDeepSeekKey}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
                          >
                            Salvar Chave
                          </Button>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                          A chave será armazenada localmente e usada para alimentar o especialista em IA.
                        </p>
                      </div>
                    </div>

                    {/* IA section removed from Settings for non-admins and access logic moved back to Navbar */}
                  </div>

                  <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                      <Target size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 mb-1">Painel de Controle</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Como administrador, você tem acesso total às estatísticas e pode visualizar todos os usuários cadastrados no sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="home-page"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
              >
                
                {/* Generator Bento - Main Focus */}
                <motion.div id="generator-section" variants={itemVariants} className="lg:col-span-8 lg:row-span-3">
                  <div className="h-full bg-white border border-purple-200 rounded-3xl md:rounded-[2rem] p-0 flex flex-col shadow-xl shadow-purple-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-purple-900 pointer-events-none hidden md:block">
                      <Zap size={200} strokeWidth={0.5} />
                    </div>
                    <GameGenerator />
                  </div>
                </motion.div>

                {/* Official Result Bento - Secondary Focus */}
                <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-2 bg-white/50 border border-purple-100 rounded-3xl md:rounded-[2rem] p-6 md:p-8 relative group overflow-hidden shadow-sm hover:bg-white transition-colors duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 text-purple-900 hidden md:block">
                    <Trophy size={180} strokeWidth={0.5} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-4 md:mb-6">
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[8px] font-bold mb-3 md:mb-4 uppercase tracking-widest">
                        <History size={10} /> Sorteio
                      </div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 mb-1 md:mb-2">
                        Nº {latestResult?.concurso || "---"}
                      </h2>
                      <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={12} strokeWidth={2} /> {latestResult ? latestResult.data : "---"}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-6 md:mb-8">
                      {isLoading ? (
                        Array(15).fill(0).map((_, i) => (
                          <div key={i} className="aspect-square rounded-full bg-purple-100/50 animate-pulse" />
                        ))
            ) : (
                        latestResult?.dezenas.map((num) => (
                          <Ball key={num} number={num} active size="sm" />
                        ))
                      )}
                    </div>

                    <div className="mt-auto space-y-4 pt-6 border-t border-purple-50">
                      <div className="bg-emerald-50/50 px-4 py-3 rounded-2xl border border-emerald-100/50 text-center">
                        <p className="text-[8px] text-emerald-600/70 uppercase font-bold tracking-[0.2em] mb-1.5">Próximo Prêmio</p>
                        <p className="text-xl font-display font-bold text-emerald-500 tabular-nums leading-none whitespace-nowrap">
                          {latestResult ? formatCurrency(latestResult.valorEstimadoProximoConcurso || 0) : "R$ ---"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center px-2">
                          <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Pares</p>
                          <p className="text-lg font-display font-bold text-zinc-800">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 === 0).length : "0"}</p>
                        </div>
                        <div className="text-center px-2">
                          <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Ímpares</p>
                          <p className="text-lg font-display font-bold text-zinc-800">{latestResult ? latestResult.dezenas.filter(n => parseInt(n) % 2 !== 0).length : "0"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Frequência Bento */}
                <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-3xl md:rounded-[2rem] p-6 md:p-7 flex flex-col group overflow-hidden relative shadow-sm">
                  <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:scale-110 transition-transform duration-700 text-purple-900 pointer-events-none hidden md:block">
                    <PieChart size={160} strokeWidth={1} />
                  </div>

                  <div className="flex flex-col items-center justify-between mb-4 md:mb-5 relative z-10 text-center md:text-left md:flex-row md:items-start">
                    <div className="flex flex-col items-center md:items-start">
                      <h3 className="text-lg md:text-xl font-display font-bold mb-1 flex items-center gap-2">
                        <Target size={18} className="text-purple-600" /> Tendências
                      </h3>
                      <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Últimos 10 jogos</p>
                    </div>
                    <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                      Live
                    </span>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {/* Quentes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Flame size={10} /> Mais Quentes
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400">↑ Frequência alta</span>
                      </div>
                      <div className="flex gap-2">
                        {["20", "10", "25", "01", "13"].map(num => (
                          <Ball key={`hot-${num}`} number={num} active size="sm" />
                        ))}
                      </div>
                    </div>

                    {/* Frias */}
                    <div className="pt-3 border-t border-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Snowflake size={10} /> Mais Frias
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400">↓ Atrasadas</span>
                      </div>
                      <div className="flex gap-2">
                        {["04", "07", "12", "18", "22"].map(num => (
                          <span key={`cold-${num}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-bold">
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="pt-3 border-t border-purple-50 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Pares</p>
                        <p className="text-base font-display font-bold text-purple-700">53%</p>
                      </div>
                      <div className="text-center border-x border-purple-50">
                        <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Primos</p>
                        <p className="text-base font-display font-bold text-purple-700">27%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Soma Méd.</p>
                        <p className="text-base font-display font-bold text-purple-700">194</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Insights Bento */}
                <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 hover:bg-purple-50/50 shadow-sm relative">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 premium-border flex items-center justify-center text-emerald-400">
                      <TrendingUp size={24} />
                    </div>
                    <div className="text-right">
                      {history.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Limpar Histórico">
                              <Trash2 size={16} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Deseja apagar todos os seus jogos salvos do histórico?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={clearHistory} className="bg-red-500 hover:bg-red-600 text-white">
                                Limpar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 mb-1">Status do Histórico</h4>
                    <p className="text-xs text-premium-text-muted">
                      {history.length > 0 
                        ? `Você possui ${history.length} ${history.length === 1 ? 'jogo salvo' : 'jogos salvos'} no histórico.`
                        : "Nenhum jogo salvo recentemente."}
                    </p>
                  </div>
                </motion.div>

            {/* Fechamentos Card - Elegant Action */}
            <motion.div 
              variants={itemVariants} 
              onClick={() => {
                setActiveTab('stats');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="lg:col-span-4 lg:row-span-1 bg-white border border-purple-100 rounded-[2rem] p-8 flex items-center gap-6 group cursor-pointer hover:bg-purple-50/50 transition-all shadow-sm"
            >
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-lg font-display font-bold text-zinc-900">Fechamentos Pro</h4>
                <p className="text-sm text-premium-text-muted">Acesse 42 modelos matemáticos exclusivos.</p>
              </div>
              <ArrowUpRight size={20} className="ml-auto text-premium-text-muted group-hover:text-purple-600 transition-colors" />
            </motion.div>

                {/* Smart Alerts */}
                <motion.div 
                  variants={itemVariants} 
                  onClick={() => {
                    setActiveTab('dicas');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="lg:col-span-4 lg:row-span-1 bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-500 rounded-3xl md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl shadow-purple-500/10 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                    <Sparkles size={80} />
                  </div>
                  <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2 md:mb-1">Dica do Especialista</p>
                    <h4 className="text-lg md:text-xl font-display font-bold leading-tight mb-6">
                      "Ciclo das dezenas prestes a fechar. Foque no número 08 e 22."
                    </h4>
                    <button 
                      className="w-full py-3.5 md:py-4 bg-white text-purple-900 font-display font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/10 hover:bg-purple-50 transition-colors active:scale-95"
                    >
                      Ver Análise Completa
                    </button>
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

const NavIcon = ({ 
  icon, 
  active = false, 
  label, 
  onClick, 
  highlight = false 
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  label: string, 
  onClick?: () => void,
  highlight?: boolean
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex h-full flex-1 flex-col items-center justify-center gap-1 group relative outline-none transition-transform active:scale-90 md:h-12 md:w-12 md:flex-none md:p-0",
      highlight && !active && "relative"
    )}
  >
    {highlight && !active && (
      <motion.div
        layoutId="highlight-pulse"
        className="absolute inset-0 rounded-full bg-purple-400/20 md:hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    )}
    <div className={cn(
      "w-10 h-10 rounded-[1.15rem] flex items-center justify-center transition-all duration-300 md:w-12 md:h-12 md:rounded-[1.25rem] md:group-hover:bg-purple-100/50",
      active 
        ? "text-purple-600 md:bg-purple-100/50" 
        : highlight 
          ? "text-purple-500 bg-purple-50 md:bg-transparent" 
          : "text-zinc-500 hover:text-purple-600"
    )}>
      <motion.div
        animate={highlight && !active ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={highlight && !active ? { 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } : {}}
      >
        {icon}
      </motion.div>
    </div>
    <span className={cn(
      "text-[9px] font-bold uppercase tracking-[0.1em] mt-1 md:hidden",
      active ? "text-purple-600" : highlight ? "text-purple-500" : "text-zinc-500"
    )}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="hidden md:block absolute -left-2 w-1 h-5 bg-purple-600 rounded-full"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    {highlight && !active && (
      <span className="absolute top-1 right-1 md:top-0 md:right-0 w-2 h-2 bg-fuchsia-500 rounded-full border-2 border-white animate-bounce" />
    )}
  </button>
);

const StatDetail = ({ label, value, percentage, color }: { label: string, value: string, percentage: number, color: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] text-premium-text-muted uppercase font-bold tracking-[0.2em]">{label}</span>
      <span className="text-2xl font-display font-bold text-zinc-900">{value}</span>
    </div>
    <div className="w-20 h-1 bg-purple-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
      />
    </div>
  </div>
);

export default Index;
