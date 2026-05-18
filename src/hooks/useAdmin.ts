import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/lottery';

export const useAdmin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true }) // Admin first for clarity
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formatted = data.map((u: any) => ({
          ...u,
          createdAt: u.created_at || new Date().toISOString()
        }));
        setUsers(formatted as UserProfile[]);
      }
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
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: userData.role,
            status: userData.status
          })
          .eq('id', editingUser.id);
        
        if (profileError) throw profileError;

        // Sync with user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: editingUser.id, role: userData.role }, { onConflict: 'user_id,role' });
        
        if (roleError) throw roleError;

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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;

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
