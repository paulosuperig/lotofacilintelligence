import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingFallbackProps {
  /** Classes extras do contêiner. */
  className?: string;
  /** Classes extras do indicador circular. */
  spinnerClassName?: string;
  /** Texto acessível anunciado por leitores de tela. */
  label?: string;
}

/**
 * Indicador de carregamento reutilizável para Suspense/lazy loading.
 */
export const LoadingFallback = ({
  className,
  spinnerClassName,
  label = 'Carregando…',
}: LoadingFallbackProps) => (
  <div role="status" aria-live="polite" className={cn('flex items-center justify-center', className)}>
    <div
      className={cn('h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin', spinnerClassName)}
    />
    <span className="sr-only">{label}</span>
  </div>
);
