import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from './AuthField';

interface ForgotPasswordFormProps {
  isLoading: boolean;
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (email: string) => void;
  onBack: () => void;
}

export const ForgotPasswordForm = ({
  isLoading,
  email,
  onEmailChange,
  onSubmit,
  onBack,
}: ForgotPasswordFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-purple-600 transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Voltar ao login</span>
      </button>

      <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 md:mb-6">
          <Mail className="text-purple-600 w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 mb-2 tracking-tight">
          Recuperar Senha
        </h1>
        <p className="text-zinc-500 text-xs md:text-sm max-w-[240px]">
          Informe seu e-mail para receber as instruções de recuperação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField
          id="forgot-email"
          label="E-mail Cadastrado"
          icon={User}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="pl-12 h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30"
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <LogIn size={20} />
            </motion.div>
          ) : (
            'Enviar Instruções'
          )}
        </Button>
      </form>
    </>
  );
};
