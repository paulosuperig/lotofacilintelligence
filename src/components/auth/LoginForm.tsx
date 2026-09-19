import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clover, Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from './AuthField';

const INPUT_CLASS =
  'pl-12 h-12 sm:h-14 rounded-2xl border-purple-100 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30 text-[13px] sm:text-sm';

interface LoginFormProps {
  isLoading: boolean;
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (email: string, password: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export const LoginForm = ({
  isLoading,
  email,
  onEmailChange,
  onSubmit,
  onForgotPassword,
  onRegister,
}: LoginFormProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <>
      <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10 text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3 sm:mb-4 md:mb-6"
        >
          <Clover className="text-white w-7 h-7 md:w-8 md:h-8" />
        </motion.div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-zinc-900 mb-2 tracking-tight">
          Lotofácil{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">
            Intelligence
          </span>
        </h1>
        <p className="text-zinc-500 text-xs md:text-sm">Faça login para acessar sua conta premium</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <AuthField
          id="login-email"
          label="E-mail"
          icon={User}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={INPUT_CLASS}
          required
        />

        <AuthField
          id="login-password"
          label="Senha"
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${INPUT_CLASS} pr-12`}
          required
          labelAction={
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[10px] font-bold text-purple-600 uppercase tracking-widest hover:text-purple-700 transition-colors"
            >
              Esqueceu a senha?
            </button>
          }
          adornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          }
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <LogIn size={20} />
            </motion.div>
          ) : (
            'Acessar Sistema'
          )}
        </Button>

        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={onRegister}
            className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-purple-600 transition-colors"
          >
            Não tem uma conta? <span className="text-purple-600">Solicite acesso</span>
          </button>
        </div>
      </form>
    </>
  );
};
