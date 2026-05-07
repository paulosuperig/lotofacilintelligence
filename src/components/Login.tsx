import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clover, Lock, User, Eye, EyeOff, LogIn, ArrowLeft, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  onLogin: (user: { email: string; role: 'admin' | 'demo' }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email === 'admin@admin.com.br' && password === '81260642') {
        onLogin({ email, role: 'admin' });
        toast({
          title: "Bem-vindo, Admin!",
          description: "Acesso total liberado.",
        });
      } else if (email === 'demo@demo.com.br' && password === '123456') {
        onLogin({ email, role: 'demo' });
        toast({
          title: "Acesso Demonstrativo",
          description: "Você está visualizando a versão demo.",
        });
      } else {
        toast({
          title: "Erro de autenticação",
          description: "E-mail ou senha incorretos.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
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

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-purple-500/10 border border-purple-100 overflow-hidden"
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
              <div className="flex flex-col items-center mb-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
                  <Clover size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">
                  Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
                </h1>
                <p className="text-zinc-500 text-sm">Faça login para acessar sua conta premium</p>
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
              </form>
            </motion.div>
          ) : (
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

              <div className="flex flex-col items-center mb-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
                  <Mail size={32} className="text-purple-600" />
                </div>
                <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Recuperar Senha</h1>
                <p className="text-zinc-500 text-sm max-w-[240px]">Informe seu e-mail para receber as instruções de recuperação.</p>
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

        <div className="mt-10 pt-8 border-t border-purple-50 text-center space-y-3">
          <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold">
            Membro Premium Intelligence
          </p>
          <p className="text-[10px] text-zinc-300 font-medium italic">
            Desenvolvido por: Paulo H. Santos
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;