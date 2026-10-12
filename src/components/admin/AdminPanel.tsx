import React, { useState } from 'react';
import { UserPlus, Settings, Users, ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserDialog } from './UserDialog';
import { UserTable } from './UserTable';
import { DeepSeekConfig } from './DeepSeekConfig';
import { SecurityBanner } from './SecurityBanner';
import { MetaPixelConfig } from './MetaPixelConfig';
import { UserProfile, UserFormData } from '@/types/lottery';

export interface AdminPanelProps {
  users: UserProfile[];
  onBack: () => void;
  onCreateOrUpdateUser: (userData: UserFormData, editingUser: UserProfile | null) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  isAiConfigured: boolean;
  onSaveDeepSeekKey: (key: string) => void;
  defaultTab?: 'users' | 'settings';
  // Pagination props
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  totalUsers?: number;
}

export const AdminPanel = ({ 
  users, 
  onBack, 
  onCreateOrUpdateUser, 
  onDeleteUser, 
  onToggleUserStatus,
  onResetPassword,
  isAiConfigured,
  onSaveDeepSeekKey,
  defaultTab = 'users',
  page = 0,
  pageCount = 1,
  onPageChange,
  totalUsers = 0
}: AdminPanelProps) => {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({ email: '', password: '', role: 'demo', status: 'active' });
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>(defaultTab);

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserFormData({ email: user.email, password: '', role: user.role, status: user.status });
    setIsUserDialogOpen(true);
  };

  const handleExportContacts = () => {
    if (!users || users.length === 0) return;

    const headers = ['ID', 'Email', 'WhatsApp', 'Perfil', 'Status', 'Cadastro'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => [
        u.id,
        u.email,
        u.whatsapp || '',
        u.role === 'admin' ? 'Admin' : 'Usuário',
        u.status === 'active' ? 'Ativo' : 'Bloqueado',
        new Date(u.createdAt).toLocaleDateString('pt-BR')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUserDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrUpdateUser(userFormData, editingUser);
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-10 gap-6">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2 break-words">
            {activeTab === 'users' ? 'Usuários Cadastrados' : 'Painel Administrativo'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
            {activeTab === 'users' ? `Exibindo ${users.length} de ${totalUsers} usuários` : 'Gerencie usuários, acessos e configurações do sistema'}
          </p>
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto">
          {activeTab === 'users' && (
            <>
              <Button
                variant="outline"
                onClick={handleExportContacts}
                className="w-full sm:w-auto px-3 sm:px-4 rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Download size={18} className="mr-2 shrink-0" />
                Exportar
              </Button>
              <Button onClick={() => setIsUserDialogOpen(true)} className="w-full sm:w-auto px-3 sm:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]">
                <UserPlus size={18} className="mr-2 shrink-0" />
                <span className="whitespace-nowrap">Novo Usuário</span>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={onBack}
            className={`w-full sm:w-auto px-3 sm:px-4 rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${activeTab === 'users' ? 'min-[360px]:col-span-2 sm:col-auto' : ''}`}
          >
            <ArrowLeft size={18} className="mr-2 shrink-0" />
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
        onResetPassword={(newPassword) => { if (editingUser) onResetPassword(editingUser.id, newPassword); }}
      />

      {activeTab === 'users' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-1">
            <UserTable 
              users={users} 
              onEdit={handleEditUser} 
              onToggleStatus={onToggleUserStatus} 
              onDelete={onDeleteUser} 
            />
          </div>
          
          {pageCount > 1 && onPageChange && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="rounded-xl"
              >
                <ChevronLeft size={20} />
              </Button>
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                Página {page + 1} de {pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount - 1}
                className="rounded-xl"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-8">
            <DeepSeekConfig 
              isConfigured={isAiConfigured}
              onSaveDeepSeekKey={onSaveDeepSeekKey} 
            />
            <MetaPixelConfig />
            <SecurityBanner />
          </div>
        </div>
      )}
    </div>
  );
};
