import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { UserProfile } from '@/types/lottery';
import { userService } from '@/services/userService';

type UserFormData = { role: 'admin' | 'demo'; status: 'active' | 'blocked' };

export const useAdmin = (enabled: boolean = true) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery<UserProfile[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => userService.fetchProfiles(),
    enabled,
    staleTime: 30 * 1000,
  });

  const users = usersQuery.data ?? [];
  const refetchUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Erro desconhecido');

  const createOrUpdateUser = async (userData: UserFormData, editingUser: UserProfile | null = null) => {
    if (!editingUser) {
      toast({
        title: 'Atenção',
        description: 'Novos usuários devem se cadastrar na tela de login.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await userService.updateProfile(editingUser.id, { role: userData.role, status: userData.status });
      toast({ title: 'Usuário atualizado', description: 'As alterações foram salvas com sucesso.' });
      await refetchUsers();
    } catch (error) {
      console.error('[Admin] Update error:', error);
      toast({ title: 'Erro na atualização', description: errMsg(error), variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await userService.deleteProfile(userId);
      if (error) throw error;
      toast({ title: 'Usuário excluído', description: 'A conta e o perfil foram removidos definitivamente.' });
      await refetchUsers();
    } catch (error) {
      toast({ title: 'Erro', description: errMsg(error), variant: 'destructive' });
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      await userService.updateStatus(userId, newStatus);
      toast({
        title: newStatus === 'active' ? 'Usuário desbloqueado' : 'Usuário bloqueado',
        description: `O acesso para ${user.email} foi alterado.`,
      });
      await refetchUsers();
    } catch (error) {
      toast({ title: 'Erro', description: errMsg(error), variant: 'destructive' });
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await userService.updatePassword(userId, newPassword);
      if (error) throw error;
      toast({ title: 'Senha resetada', description: 'A senha do usuário foi alterada com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: errMsg(error), variant: 'destructive' });
    }
  };

  return {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
  };
};
