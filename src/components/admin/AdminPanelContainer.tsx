import React from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminPanel } from './AdminPanel';

interface Props {
  onBack: () => void;
  deepSeekKey: string;
  onSaveDeepSeekKey: (key: string) => void;
}

/**
 * Loads admin data only when the admin panel is actually rendered.
 * Prevents the admin queries from firing during auth bootstrap.
 */
export const AdminPanelContainer: React.FC<Props> = ({ onBack, deepSeekKey, onSaveDeepSeekKey }) => {
  const { users, createOrUpdateUser, deleteUser, toggleUserStatus, saveDeepSeekKeyToSystem } = useAdmin();

  return (
    <AdminPanel
      users={users}
      onBack={onBack}
      onCreateOrUpdateUser={createOrUpdateUser}
      onDeleteUser={deleteUser}
      onToggleUserStatus={toggleUserStatus}
      deepSeekKey={deepSeekKey}
      onSaveDeepSeekKey={(key) => {
        onSaveDeepSeekKey(key);
        saveDeepSeekKeyToSystem(key);
      }}
    />
  );
};
