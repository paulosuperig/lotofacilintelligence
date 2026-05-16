import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegisterFormProps {
  onViewChange: (view: 'login' | 'forgot-password' | 'register') => void;
}

export const RegisterForm = ({ onViewChange }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({ name: '', email: '', whatsapp: '', password: '' });
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: { full_name: data.name, whatsapp: data.whatsapp },
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      if (signUpData.session) {
        toast({ title: "Cadastro realizado!", description: "Bem-vindo ao Lotofácil Intelligence." });
      } else {
        toast({ title: "Verifique seu e-mail", description: "Enviamos um link de confirmação para o seu e-mail." });
        onViewChange('login');
      }
    } catch (error: any) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button 
        onClick={() => onViewChange('login')}
        className="flex items-center gap-2 text-zinc-400 hover:text-purple-600 transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Voltar ao login</span>
      </button>

      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
          <UserPlus className="text-purple-600 w-7 h-7" />
        </div>
        <h1 className="text-2xl font-display font-bold text-zinc-900 mb-2 tracking-tight">Criar Conta</h1>
        <p className="text-zinc-500 text-xs">Preencha os dados para solicitar seu acesso premium</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nome Completo</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              placeholder="Seu nome"
              value={data.name}
              onChange={(e) => setData({...data, name: e.target.value})}
              className="pl-11 h-12 rounded-xl border-purple-100 bg-purple-50/30"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              placeholder="(00) 00000-0000"
              value={data.whatsapp}
              onChange={(e) => setData({...data, whatsapp: e.target.value})}
              className="pl-11 h-12 rounded-xl border-purple-100 bg-purple-50/30"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={data.email}
              onChange={(e) => setData({...data, email: e.target.value})}
              className="pl-11 h-12 rounded-xl border-purple-100 bg-purple-50/30"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              type="password"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => setData({...data, password: e.target.value})}
              className="pl-11 h-12 rounded-xl border-purple-100 bg-purple-50/30"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] mt-2"
        >
          {isLoading ? "Enviando..." : "Solicitar Acesso Premium"}
        </Button>
      </form>
    </motion.div>
  );
};
