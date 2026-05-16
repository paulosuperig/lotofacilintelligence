import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, User, LogIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordFormProps {
  onViewChange: (view: 'login' | 'forgot-password' | 'register') => void;
}

export const ForgotPasswordForm = ({ onViewChange }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "E-mail enviado", description: `As instruções de recuperação foram enviadas para ${email}.` });
      onViewChange('login');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="forgot-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button 
        onClick={() => onViewChange('login')}
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
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <LogIn size={20} />
            </motion.div>
          ) : "Enviar Instruções"}
        </Button>
      </form>
    </motion.div>
  );
};
