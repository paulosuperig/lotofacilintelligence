import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';

const Login = () => {
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState<'login' | 'forgot-password' | 'register'>('login');

  return (
    <div className="relative min-h-screen bg-[#f5f3ff] flex flex-col items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-2xl shadow-purple-500/10 border border-purple-100 overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
          {view === 'login' && <LoginForm onViewChange={setView} />}
          {view === 'forgot-password' && <ForgotPasswordForm onViewChange={setView} />}
          {view === 'register' && <RegisterForm onViewChange={setView} />}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-purple-50 text-center" />
      </motion.div>
      
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-0 right-0 px-4"
        aria-label="Rodapé institucional"
      >
        <p className="text-[10px] text-purple-400/70 font-medium text-center flex flex-col gap-1 md:block">
          <span>Lotofácil Intelligence {currentYear}</span>
          <span className="hidden md:inline"> - </span>
          <span>Desenvolvido por: <span className="font-semibold text-purple-500/80">Paulo H. Santos</span></span>
        </p>
      </motion.footer>
    </div>
  );
};

export default Login;
