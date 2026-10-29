import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';

export interface RegisterInput {
  name: string;
  email: string;
  whatsapp: string;
  password: string;
}

/**
 * Ações de autenticação usadas pelas telas públicas e privadas.
 * Concentra chamadas ao Supabase, estado de carregamento e feedback ao usuário.
 */
export const useAuthActions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;

        toast({ title: 'Bem-vindo!', description: 'Acesso autorizado com sucesso.' });
        return true;
      } catch (error: unknown) {
        toast({
          title: 'Erro de autenticação',
          description: getErrorMessage(error, 'E-mail ou senha incorretos.'),
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;

        toast({
          title: 'E-mail enviado',
          description: `As instruções de recuperação foram enviadas para ${email}.`,
        });
        return true;
      } catch (error: unknown) {
        toast({
          title: 'Erro',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        toast({
          title: "Senha atualizada",
          description: "Sua nova senha foi salva com sucesso.",
        });
        return true;
      } catch (error: unknown) {
        toast({
          title: "Erro",
          description: getErrorMessage(error),
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          options: {
            data: { full_name: input.name, whatsapp: input.whatsapp },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.session) {
          toast({
            title: 'Cadastro realizado!',
            description: 'Bem-vindo ao Lotofácil Sistema Inteligente.',
          });
          return true;
        }

        toast({
          title: 'Verifique seu e-mail',
          description: 'Enviamos um link de confirmação para o seu e-mail.',
        });
        return false;
      } catch (error: unknown) {
        toast({
          title: 'Erro no cadastro',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  return { isLoading, signIn, requestPasswordReset, updatePassword, signUp };
};
