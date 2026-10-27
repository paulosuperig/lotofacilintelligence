import type { UserProfile } from '@/types/lottery';

/** Ações que cada usuário listado oferece ao administrador. */
export interface UserRowActions {
  onEdit: (user: UserProfile) => void;
  onToggleStatus: (userId: string) => void;
  onDelete: (userId: string) => void;
}
