import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SecurityBanner = () => (
  <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
      <ShieldAlert size={20} />
    </div>
    <div>
      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Proteção de Dados Intelligence</h4>
      <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
        Este painel opera sob diretrizes de <strong>Zero Trust</strong>. Dados sensíveis como e-mails são mascarados e senhas são criptografadas com SHA-256 antes do armazenamento local.
      </p>
    </div>
  </div>
);
