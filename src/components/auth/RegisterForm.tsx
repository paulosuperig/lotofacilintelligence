import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthField } from './AuthField';
import type { RegisterInput } from '@/hooks/useAuthActions';

const INPUT_CLASS = 'pl-11 h-12 rounded-xl border-purple-100 bg-purple-50/30';
const LABEL_CLASS = 'text-[10px]';

const EMPTY_FORM: RegisterInput = { name: '', email: '', whatsapp: '', password: '' };

interface RegisterFormProps {
  isLoading: boolean;
  onSubmit: (data: RegisterInput) => void;
  onBack: () => void;
}

export const RegisterForm = ({ isLoading, onSubmit, onBack }: RegisterFormProps) => {
  const [form, setForm] = useState<RegisterInput>(EMPTY_FORM);

  const setField = (field: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <>
      <button
        onClick={onBack}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="register-name"
          label="Nome Completo"
          icon={User}
          iconSize={16}
          autoComplete="name"
          placeholder="Seu nome"
          value={form.name}
          onChange={setField('name')}
          className={INPUT_CLASS}
          labelClassName={LABEL_CLASS}
          wrapperClassName="space-y-1.5"
          required
        />

        <AuthField
          id="register-whatsapp"
          label="WhatsApp"
          icon={Phone}
          iconSize={16}
          type="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={form.whatsapp}
          onChange={setField('whatsapp')}
          className={INPUT_CLASS}
          labelClassName={LABEL_CLASS}
          wrapperClassName="space-y-1.5"
          required
        />

        <AuthField
          id="register-email"
          label="E-mail"
          icon={Mail}
          iconSize={16}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={form.email}
          onChange={setField('email')}
          className={INPUT_CLASS}
          labelClassName={LABEL_CLASS}
          wrapperClassName="space-y-1.5"
          required
        />

        <AuthField
          id="register-password"
          label="Senha"
          icon={Lock}
          iconSize={16}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={setField('password')}
          className={INPUT_CLASS}
          labelClassName={LABEL_CLASS}
          wrapperClassName="space-y-1.5"
          required
          minLength={6}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] mt-2"
        >
          {isLoading ? 'Enviando...' : 'Solicitar Acesso Premium'}
        </Button>
      </form>
    </>
  );
};
