import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { UserProfile } from '@/types/lottery';
import { userService } from '@/services/userService';

export const adminUsersKey = ['admin', 'users'] as const;

/** Extrai a mensagem de erro de um `unknown` de forma segura (TS strict). */
const errorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : fallback;

interface UserFormData {
  role: 'admin' | 'demo';
  status: 'active' | 'blocked';
}

export const useAdmin = (enabled: boolean = true) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery<UserProfile[]>({
    queryKey: adminUsersKey,
    queryFn: () => userService.fetchProfiles(),
    enabled,
    staleTime: 60 * 1000,
  });

  const users = usersQuery.data ?? [];

  const invalidateUsers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: adminUsersKey }),
    [queryClient],
  );

  const updateMutation = useMutation<void, Error, { userId: string; data: UserFormData }>({
    mutationFn: ({ userId, data }) => userService.updateProfile(userId, data).then(() => undefined),
    onSuccess: () => {
      toast({ title: 'Usuário atualizado', description: 'As alterações foram salvas com sucesso.' });
      invalidateUsers();
    },
    onError: (error) => {
      console.error('[Admin] Update error:', error);
      toast({ title: 'Erro na atualização', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (userId) => userService.deleteProfile(userId).then(() => undefined),
    onSuccess: () => {
      toast({ title: 'Perfil removido', description: 'O perfil foi excluído do banco de dados.' });
      invalidateUsers();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const statusMutation = useMutation<
    { email: string; newStatus: 'active' | 'blocked' },
    Error,
    { userId: string; email: string; newStatus: 'active' | 'blocked' }
  >({
    mutationFn: async ({ userId, email, newStatus }) => {
      await userService.updateStatus(userId, newStatus);
      return { email, newStatus };
    },
    onSuccess: ({ email, newStatus }) => {
      toast({
        title: newStatus === 'active' ? 'Usuário desbloqueado' : 'Usuário bloqueado',
        description: `O acesso para ${email} foi alterado.`,
      });
      invalidateUsers();
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const passwordMutation = useMutation<void, Error, { userId: string; newPassword: string }>({
    mutationFn: async ({ userId, newPassword }) => {
      const result = await userService.updatePassword(userId, newPassword);
      if (result?.error) throw new Error(errorMessage(result.error, 'Falha ao resetar a senha.'));
    },
    onSuccess: () => {
      toast({ title: 'Senha resetada', description: 'A senha do usuário foi alterada com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const createOrUpdateUser = useCallback(
    async (userData: UserFormData, editingUser: { id: string } | null = null) => {
      if (!editingUser) {
        toast({
          title: 'Atenção',
          description: 'Novos usuários devem se cadastrar na tela de login.',
          variant: 'destructive',
        });
        return;
      }
      await updateMutation.mutateAsync({ userId: editingUser.id, data: userData }).catch(() => undefined);
    },
    [toast, updateMutation],
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      await deleteMutation.mutateAsync(userId).catch(() => undefined);
    },
    [deleteMutation],
  );

  const toggleUserStatus = useCallback(
    async (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const newStatus: 'active' | 'blocked' = user.status === 'active' ? 'blocked' : 'active';
      await statusMutation
        .mutateAsync({ userId, email: user.email, newStatus })
        .catch(() => undefined);
    },
    [statusMutation, users],
  );

  const resetPassword = useCallback(
    async (userId: string, newPassword: string) => {
      await passwordMutation.mutateAsync({ userId, newPassword }).catch(() => undefined);
    },
    [passwordMutation],
  );

  return {
    users,
    isLoading: usersQuery.isLoading,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
  };
};
