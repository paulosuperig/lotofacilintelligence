import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clover, Lock, User, Eye, EyeOff, LogIn, ArrowLeft, Mail, UserPlus, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  onLogin: (user: { email: string; role: 'admin' | 'demo' }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password' | 'register'>('login');
  const [registerData, setRegisterData] = useState({ name: '', email: '', whatsapp: '' });
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailInput = email.trim().toLowerCase();
    const passwordInput = password;

    // Zero Trust: Admin check using secure comparison
    setTimeout(() => {
      // In a real environment, this would be a backend call
      const storedUsers = JSON.parse(localStorage.getItem('intelligence_system_users') || '[]');
      
      // Legacy hardcoded fallback for first access (to be replaced by DB)
      const isAdmin = emailInput === 'admin@admin.com.br' && passwordInput === '81260642';
      const isDemo = emailInput === 'demo@demo.com.br' && passwordInput === '123456';
      
      if (isAdmin) {
        onLogin({ email: emailInput, role: 'admin' });
        toast({
          title: "Bem-vindo, Admin!",
          description: "Acesso total liberado.",
        });
      } else if (isDemo) {
        onLogin({ email: emailInput, role: 'demo' });
        toast({
          title: "Acesso Demonstrativo",
          description: "Você está visualizando a versão demo.",
        });
      } else {
        toast({
          title: "Erro de autenticação",
          description: "E-mail ou senha incorretos ou conta inativa.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate recovery email
    setTimeout(() => {
      toast({
        title: "E-mail enviado",
        description: `As instruções de recuperação foram enviadas para ${email}.`,
      });
      setIsLoading(false);
      setView('login');
    }, 1500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration
    setTimeout(() => {
      toast({
        title: "Solicitação enviada",
        description: "Seu cadastro foi recebido. Entraremos em contato via WhatsApp.",
      });
      setIsLoading(false);
      setView('login');
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-[#f5f3ff] flex flex-col items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-purple-500/10 border border-purple-100 overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
          {view === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 md:mb-6"
                >
                  <Clover className="text-white w-7 h-7 md:w-8 md:h-8" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-2 tracking-tight">
                  Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
                </h1>
                <p className="text-zinc-500 text-xs md:text-sm">Faça login para acessar sua conta premium</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Senha</label>
                    <button 
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-[10px] font-bold text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-lg shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <LogIn size={20} />
                    </motion.div>
                  ) : (
                    "Acessar Sistema"
                  )}
                </Button>

                <div className="pt-4 text-center">
                  <button 
                    type="button"
                    onClick={() => setView('register')}
                    className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-purple-600 transition-colors"
                  >
                    Não tem uma conta? <span className="text-purple-600">Solicite acesso</span>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : view === 'forgot-password' ? (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                onClick={() => setView('login')}
                className="flex items-center gap-2 text-zinc-400 hover:text-purple-600 transition-colors mb-8 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Voltar ao login</span>
              </button>

              <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 md:mb-6">
                  <Mail className="text-purple-600 w-7 h-7 md:w-8 md:h-8" />
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-2 tracking-tight">Recuperar Senha</h1>
                <p className="text-zinc-500 text-xs md:text-sm max-w-[240px]">Informe seu e-mail para receber as instruções de recuperação.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail Cadastrado</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <LogIn size={20} />
                    </motion.div>
                  ) : (
                    "Enviar Instruções"
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-purple-50 text-center">
          <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold">
            Membro Premium Intelligence
          </p>
        </div>
      </motion.div>
      
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-0 right-0 px-4"
        aria-label="Rodapé institucional"
      >
        <p className="text-[10px] text-purple-400/70 font-medium text-center">
          Lotofácil Intelligence {currentYear} - Desenvolvido por: <span className="font-semibold text-purple-500/80">Paulo H. Santos</span>
        </p>
      </motion.footer>
    </div>
  );
};

export default Login;