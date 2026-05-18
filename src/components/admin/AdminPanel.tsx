import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserDialog } from './UserDialog';
import { UserTable } from './UserTable';
import { DeepSeekConfig } from './DeepSeekConfig';
import { SecurityBanner } from './SecurityBanner';

interface AdminPanelProps {
  users: any[];
  onBack: () => void;
  onCreateOrUpdateUser: (userData: any, editingUser: any) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  deepSeekKey: string;
  onSaveDeepSeekKey: (key: string) => void;
}

export const AdminPanel = ({ 
  users, 
  onBack, 
  onCreateOrUpdateUser, 
  onDeleteUser, 
  onToggleUserStatus,
  deepSeekKey,
  onSaveDeepSeekKey
}: AdminPanelProps) => {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'demo', status: 'active' });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({ email: user.email, password: '', role: user.role, status: user.status });
    setIsUserDialogOpen(true);
  };

  const handleUserDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrUpdateUser(userFormData, editingUser);
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Configurações do Sistema</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">Gerenciamento de usuários e acessos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsUserDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
            <UserPlus size={18} className="mr-2" />
            Novo Usuário
          </Button>
          <Button variant="outline" onClick={onBack} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">
            Voltar
          </Button>
        </div>
      </div>

      <UserDialog 
        isOpen={isUserDialogOpen}
        onOpenChange={(open) => {
          setIsUserDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
          }
        }}
        editingUser={editingUser}
        userFormData={userFormData}
        setUserFormData={setUserFormData}
        onSubmit={handleUserDialogSubmit}
      />

      <UserTable 
        users={users} 
        onEdit={handleEditUser} 
        onToggleStatus={onToggleUserStatus} 
        onDelete={onDeleteUser} 
      />

      <DeepSeekConfig 
        deepSeekKey={deepSeekKey} 
        onSaveDeepSeekKey={onSaveDeepSeekKey} 
      />

      <SecurityBanner />
    </div>
  );
};
