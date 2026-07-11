export interface UserSession {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER';
  user: {
    name: string;
    email: string;
  };
}
