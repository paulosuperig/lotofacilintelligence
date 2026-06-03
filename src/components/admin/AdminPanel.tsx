import React, { useState } from 'react';
import { UserPlus, Settings, Users, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { UserDialog } from './UserDialog';
import { UserTable } from './UserTable';
import { DeepSeekConfig } from './DeepSeekConfig';
import { SecurityBanner } from './SecurityBanner';
import { MetaPixelConfig } from './MetaPixelConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminPanelProps {
  users: any[];
  onBack: () => void;
  onCreateOrUpdateUser: (userData: any, editingUser: any) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  isAiConfigured: boolean;
  onSaveDeepSeekKey: (key: string) => void;
  defaultTab?: 'users' | 'settings';
}

export const AdminPanel = ({ 
  users, 
  onBack, 
  onCreateOrUpdateUser, 
  onDeleteUser, 
  onToggleUserStatus,
  isAiConfigured,
  onSaveDeepSeekKey,
  defaultTab = 'users'
}: AdminPanelProps) => {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'demo', status: 'active' });
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync with defaultTab prop when it changes
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 md:mb-10 gap-6">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Painel Administrativo</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerencie usuários, acessos e configurações do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'users' && (
            <Button onClick={() => setIsUserDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]">
              <UserPlus size={18} className="mr-2" />
              Novo Usuário
            </Button>
          )}
          <Button variant="outline" onClick={onBack} className="rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <ArrowLeft size={18} className="mr-2" />
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

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-12">
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2 h-10">
            <Users size={16} />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2 h-10">
            <Settings size={16} />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl p-1">
            <UserTable 
              users={users} 
              onEdit={handleEditUser} 
              onToggleStatus={onToggleUserStatus} 
              onDelete={onDeleteUser} 
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 gap-8">
            <DeepSeekConfig 
              isConfigured={isAiConfigured}
              onSaveDeepSeekKey={onSaveDeepSeekKey} 
            />
            
            <MetaPixelConfig />
            
            <SecurityBanner />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
