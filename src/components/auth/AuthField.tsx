import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Id do input — também usado no `htmlFor` do label. */
  id: string;
  /** Texto do label acima do campo. */
  label: React.ReactNode;
  /** Ícone exibido à esquerda do input. */
  icon: LucideIcon;
  /** Tamanho do ícone em px. */
  iconSize?: number;
  /** Classes extras do label (o padrão cobre o estilo do formulário de login). */
  labelClassName?: string;
  /** Classes extras do wrapper do campo. */
  wrapperClassName?: string;
  /** Conteúdo opcional posicionado à direita dentro do input (ex.: olho da senha). */
  adornment?: React.ReactNode;
  /** Conteúdo opcional ao lado do label (ex.: "Esqueceu a senha?"). */
  labelAction?: React.ReactNode;
}

/**
 * Campo de formulário de autenticação: label + ícone + input.
 * Centraliza a marcação repetida das telas de login, cadastro e recuperação.
 */
export const AuthField = ({
  id,
  label,
  icon: Icon,
  iconSize = 18,
  labelClassName,
  wrapperClassName,
  adornment,
  labelAction,
  className,
  ...inputProps
}: AuthFieldProps) => (
  <div className={cn('space-y-2', wrapperClassName)}>
    <div className={cn('flex items-center ml-1', labelAction ? 'justify-between' : undefined)}>
      <label
        htmlFor={id}
        className={cn(
          'text-xs font-bold text-zinc-500 uppercase tracking-widest block',
          labelClassName,
        )}
      >
        {label}
      </label>
      {labelAction}
    </div>
    <div className="relative">
      <Icon
        aria-hidden="true"
        size={iconSize}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <Input id={id} className={className} {...inputProps} />
      {adornment}
    </div>
  </div>
);
