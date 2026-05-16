import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserTable } from './sub-components/UserTable';
import { DeepSeekConfig } from './sub-components/DeepSeekConfig';
import { UserDialog } from './sub-components/UserDialog';

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
  const [showEmails, setShowEmails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrUpdateUser(userFormData, editingUser);
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({ email: user.email, password: '', role: user.role, status: user.status });
    setIsUserDialogOpen(true);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Configurações do Sistema</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">Gerenciamento de usuários e acessos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEmails(!showEmails)}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400"
          >
            {showEmails ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
            {showEmails ? 'Ocultar E-mails' : 'Revelar E-mails'}
          </Button>
          
          <Button 
            onClick={() => setIsUserDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            <UserPlus size={18} className="mr-2" />
            Novo Usuário
          </Button>

          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar
          </Button>
        </div>
      </div>

      <UserTable 
        users={users} 
        showEmails={showEmails} 
        onEdit={handleEditUser} 
        onToggleStatus={onToggleUserStatus} 
        onDelete={onDeleteUser} 
      />

      <DeepSeekConfig initialKey={deepSeekKey} onSave={onSaveDeepSeekKey} />

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
        formData={userFormData}
        onFormChange={setUserFormData}
        onSubmit={handleSubmit}
      />

      <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Proteção de Dados Intelligence</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
            Este painel opera sob diretrizes de <strong>Zero Trust</strong>. Dados sensíveis como e-mails são mascarados e senhas são criptografadas com SHA-256 antes do armazenamento local.
          </p>
        </div>
      </div>
    </div>
  );
};
