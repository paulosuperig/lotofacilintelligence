import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthActions, type RegisterInput } from '@/hooks/useAuthActions';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

type AuthView = 'login' | 'forgot-password' | 'register';

const VIEW_MOTION: Record<AuthView, { initialX: number; exitX: number }> = {
  login: { initialX: -20, exitX: 20 },
  'forgot-password': { initialX: 20, exitX: -20 },
  register: { initialX: 20, exitX: -20 },
};

const Login = () => {
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const { isLoading, signIn, requestPasswordReset, signUp } = useAuthActions();

  const goToLogin = () => setView('login');

  const handleForgotPassword = async (value: string) => {
    const sent = await requestPasswordReset(value);
    if (sent) goToLogin();
  };

  const handleRegister = async (data: RegisterInput) => {
    const signedIn = await signUp(data);
    if (!signedIn) goToLogin();
  };

  const motionProps = VIEW_MOTION[view];

  return (
    <div className="relative min-h-dvh bg-[#f5f3ff] flex flex-col items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-2xl shadow-purple-500/10 border border-purple-100 overflow-hidden relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: motionProps.initialX }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: motionProps.exitX }}
            transition={{ duration: 0.3 }}
          >
            {view === 'login' && (
              <LoginForm
                isLoading={isLoading}
                email={email}
                onEmailChange={setEmail}
                onSubmit={signIn}
                onForgotPassword={() => setView('forgot-password')}
                onRegister={() => setView('register')}
              />
            )}

            {view === 'forgot-password' && (
              <ForgotPasswordForm
                isLoading={isLoading}
                email={email}
                onEmailChange={setEmail}
                onSubmit={handleForgotPassword}
                onBack={goToLogin}
              />
            )}

            {view === 'register' && (
              <RegisterForm isLoading={isLoading} onSubmit={handleRegister} onBack={goToLogin} />
            )}
          </motion.div>
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
          <span>
            Desenvolvido por: <span className="font-semibold text-purple-500/80">Paulo H. Santos</span>
          </span>
        </p>
      </motion.footer>
    </div>
  );
};

export default Login;
