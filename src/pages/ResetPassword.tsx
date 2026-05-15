import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, Mail, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua nova senha foi salva com sucesso.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-purple-100"
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-purple-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Voltar ao login</span>
        </button>

        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
            <Lock className="text-purple-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-zinc-900 mb-2">Nova Senha</h1>
          <p className="text-zinc-500 text-sm">Defina sua nova senha de acesso.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
          >
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
