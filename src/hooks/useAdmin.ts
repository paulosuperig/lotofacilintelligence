import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { UserProfile } from '@/types/lottery';
import { userService } from '@/services/userService';

type UserFormData = { role: 'admin' | 'demo'; status: 'active' | 'blocked' };

export const useAdmin = (enabled: boolean = true) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const formatted = await userService.fetchProfiles();
      setUsers(formatted);
    } catch (error) {
      console.error("[Admin] Error fetching users:", error);
      toast({ title: "Erro de rede", description: "Não foi possível carregar a lista de usuários.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (enabled) fetchUsers();
  }, [enabled, fetchUsers]);

  const createOrUpdateUser = async (userData: UserFormData, editingUser: UserProfile | null = null) => {
    if (editingUser) {
      try {
        await userService.updateProfile(editingUser.id, {
          role: userData.role,
          status: userData.status
        });
        toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." });
        await fetchUsers();
      } catch (error) {
        console.error("[Admin] Update error:", error);
        toast({ title: "Erro na atualização", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
      }
    } else {
      toast({ 
        title: "Atenção", 
        description: "Novos usuários devem se cadastrar na tela de login.",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await userService.deleteProfile(userId);
      if (error) throw error;
      toast({ title: "Usuário excluído", description: "A conta e o perfil foram removidos definitivamente." });
      await fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    
    try {
      await userService.updateStatus(userId, newStatus);
      toast({ 
        title: newStatus === 'active' ? "Usuário desbloqueado" : "Usuário bloqueado", 
        description: `O acesso para ${user.email} foi alterado.` 
      });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await userService.updatePassword(userId, newPassword);
      if (error) throw error;
      toast({ title: "Senha resetada", description: "A senha do usuário foi alterada com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    }
  };

  return {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword
  };
};
