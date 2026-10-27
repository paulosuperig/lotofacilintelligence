import type { UserProfile } from '@/types/lottery';
import type { UserRowActions } from './user-table/types';
import { UserDesktopTable } from './user-table/UserDesktopTable';
import { UserMobileList } from './user-table/UserMobileList';

interface UserTableProps extends UserRowActions {
  users: UserProfile[];
}

export const UserTable = ({ users, onEdit, onToggleStatus, onDelete }: UserTableProps) => (
  <div className="w-full">
    {/* Desktop View */}
    <UserDesktopTable users={users} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />

    {/* Mobile View */}
    <UserMobileList users={users} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
  </div>
);
