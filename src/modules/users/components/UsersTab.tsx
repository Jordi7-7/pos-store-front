import React from 'react';
import type { UserItem } from '../services/users.service';
import { UsersList } from './UsersList';
import { Loader2 } from 'lucide-react';

interface UsersTabProps {
  users: UserItem[];
  isLoading: boolean;
  currentAuthUserId?: string;
  searchTerm: string;
  roleFilter: string;
  onOpenCreate: () => void;
  onGeneratePin: (user: UserItem) => void;
  onEditUser: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  isLoading,
  currentAuthUserId,
  searchTerm,
  roleFilter,
  onOpenCreate,
  onGeneratePin,
  onEditUser,
  onToggleActive,
}) => {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-neutral">Cargando personal...</p>
      </div>
    );
  }

  return (
    <UsersList
      users={users}
      currentAuthUserId={currentAuthUserId}
      searchTerm={searchTerm}
      roleFilter={roleFilter}
      onOpenCreate={onOpenCreate}
      onGeneratePin={onGeneratePin}
      onEditUser={onEditUser}
      onToggleActive={onToggleActive}
    />
  );
};
