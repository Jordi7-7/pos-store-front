export interface UserRoleInfo {
  id: string;
  name: string;
}

export interface UserBranchInfo {
  id: string;
  name: string;
  address?: string | null;
}

/** Usuario de la tienda (personal): su rol, sus sucursales y si tiene PIN. */
export interface UserEntity {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  isOwner: boolean;
  role: UserRoleInfo | null;
  customPermissions?: string[] | null;
  hasPin: boolean;
  isActive: boolean;
  branches: UserBranchInfo[];
  createdAt: string;
  updatedAt: string;
}
