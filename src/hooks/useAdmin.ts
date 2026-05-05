import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { validateEmail, generateSecureId, hashData } from '@/lib/security/utils';

export const useAdmin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('intelligence_system_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [
        { id: '1', email: 'admin@admin.com.br', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
        { id: '2', email: 'demo@demo.com.br', role: 'demo', status: 'active', createdAt: new Date().toISOString() }
      ];
      setUsers(initialUsers);
      localStorage.setItem('intelligence_system_users', JSON.stringify(initialUsers));
    }
  }, []);

  const saveUsers = (updatedUsers: any[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('intelligence_system_users', JSON.stringify(updatedUsers));
  };

  const createOrUpdateUser = async (userData: any, editingUser: any = null) => {
    if (!validateEmail(userData.email)) {
      toast({ 
        title: "Erro de validação", 
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...userData } : u);
      saveUsers(updated);
      toast({ title: "Usuário atualizado", description: "As alterações foram salvas com sucesso." });
    } else {
      // Securely hash password before storing (simulated with hashData utility)
      const hashedPassword = await hashData(userData.password);
      const newUser = {
        ...userData,
        password: hashedPassword,
        id: generateSecureId(),
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);
      toast({ title: "Usuário criado", description: "O novo usuário foi cadastrado com sucesso." });
    }
  };

  const deleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    toast({ title: "Usuário excluído", description: "O usuário foi removido do sistema." });
  };

  const toggleUserStatus = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'blocked' : 'active';
        toast({ 
          title: newStatus === 'active' ? "Usuário desbloqueado" : "Usuário bloqueado", 
          description: `O acesso para ${u.email} foi ${newStatus === 'active' ? 'restaurado' : 'suspenso'}.` 
        });
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUsers(updated);
  };

  return {
    users,
    createOrUpdateUser,
    deleteUser,
    toggleUserStatus
  };
};
