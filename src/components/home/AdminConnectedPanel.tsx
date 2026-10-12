import { AdminPanel } from '@/components/admin/AdminPanel';
import { useAdmin } from '@/hooks/useAdmin';
import { useAiConfiguration } from '@/hooks/useAiConfiguration';

export interface AdminConnectedPanelProps { onBack: () => void; defaultTab: 'users' | 'settings' }
export const AdminConnectedPanel = ({ onBack, defaultTab }: AdminConnectedPanelProps) => {
  const { 
    users, 
    total,
    page,
    pageCount,
    setPage,
    createOrUpdateUser, 
    deleteUser, 
    toggleUserStatus, 
    resetPassword 
  } = useAdmin(defaultTab === 'users');
  
  const { isAiConfigured, saveDeepSeekKey } = useAiConfiguration(defaultTab === 'settings');
  
  return (
    <AdminPanel 
      users={users} 
      totalUsers={total}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      onCreateOrUpdateUser={createOrUpdateUser} 
      onDeleteUser={deleteUser}
      onToggleUserStatus={toggleUserStatus} 
      onResetPassword={resetPassword} 
      isAiConfigured={isAiConfigured}
      onSaveDeepSeekKey={saveDeepSeekKey} 
      onBack={onBack} 
      defaultTab={defaultTab} 
    />
  );
};
