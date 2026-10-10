export enum SystemRole {
  OWNER = 'OWNER',
}

export type RoleType = SystemRole.OWNER | 'ADMIN' | 'CASHIER' | 'MANAGER' | string;

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  role: RoleType;
  user: {
    name: string;
    email: string;
  };
}

