import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn, Clover } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onViewChange: (view: 'login' | 'forgot-password' | 'register') => void;
}

export const LoginForm = ({ onViewChange }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      toast({ title: "Bem-vindo!", description: "Acesso autorizado com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro de autenticação", description: error.message || "E-mail ou senha incorretos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10 text-center">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3 sm:mb-4 md:mb-6"
        >
          <Clover className="text-white w-7 h-7 md:w-8 md:h-8" />
        </motion.div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-zinc-900 mb-2 tracking-tight">
          Lotofácil <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">Intelligence</span>
        </h1>
        <p className="text-zinc-500 text-xs md:text-sm">Faça login para acessar sua conta premium</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-12 sm:h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30 text-[13px] sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Senha</label>
            <button 
              type="button"
              onClick={() => onViewChange('forgot-password')}
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
              className="pl-12 pr-12 h-12 sm:h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30 text-[13px] sm:text-sm"
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
          className="w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <LogIn size={20} />
            </motion.div>
          ) : "Acessar Sistema"}
        </Button>

        <div className="pt-4 text-center">
          <button 
            type="button"
            onClick={() => onViewChange('register')}
            className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-purple-600 transition-colors"
          >
            Não tem uma conta? <span className="text-purple-600">Solicite acesso</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};
