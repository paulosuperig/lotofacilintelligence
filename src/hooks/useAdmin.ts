import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { UserProfile } from '@/types/lottery';
import { userService } from '@/services/userService';

export const useAdmin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);

  const fetchUsers = async () => {
    try {
      const formatted = await userService.fetchProfiles();
      setUsers(formatted);
    } catch (error: any) {
      console.error("[Admin] Error fetching users:", error);
      toast({ title: "Erro de rede", description: "Não foi possível carregar a lista de usuários.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createOrUpdateUser = async (userData: any, editingUser: any = null) => {
    if (editingUser) {
      try {
        await userService.updateProfile(editingUser.id, {
          role: userData.role,
          status: userData.status
        });
        toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." });
        await fetchUsers();
      } catch (error: any) {
        console.error("[Admin] Update error:", error);
        toast({ title: "Erro na atualização", description: error.message, variant: "destructive" });
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
      await userService.deleteProfile(userId);
      toast({ title: "Perfil removido", description: "O perfil foi excluído do banco de dados." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
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
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus
  };
};
