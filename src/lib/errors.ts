/**
 * Extração segura de mensagem de erro a partir de `unknown` (TS strict).
 * Evita `any` em blocos catch e garante feedback consistente ao usuário.
 */
export const getErrorMessage = (error: unknown, fallback = 'Ocorreu um erro inesperado.'): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};
