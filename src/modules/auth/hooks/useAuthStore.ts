import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  name: string;
  email: string;
  timezone?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER' | null;
  timezone: string | null;
  user: User | null;
  activeTab: string;
  isAuthenticated: boolean;
  // PIN handoff — true after admin login, false after cashier PIN entry
  needsPinSelection: boolean;
  // Temporarily holds admin JWT during PIN selection phase
  _adminAccessToken: string | null;

  // Actions
  login: (email: string, password: string, targetWorkflow?: 'admin' | 'store') => Promise<boolean>;
  pinLogin: (pin: string) => Promise<'SUCCESS' | 'INVALID' | 'EXPIRED'>;
  skipPinSelection: () => void;
  lockScreen: () => void;
  onboard: (data: any) => Promise<boolean>;
  logout: () => void;
  setActiveTab: (tab: string) => void;
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  fetchProfile: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      role: null,
      timezone: null,
      user: null,
      activeTab: 'dashboard',
      isAuthenticated: false,
      needsPinSelection: false,
      _adminAccessToken: null,

      selectedBranchId: null,

      login: async (email, password, targetWorkflow = 'store') => {
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) return false;
          const response = await res.json();

          const isPosAdmin = response.user.role === 'OWNER' || response.user.role === 'ADMIN';

          if (isPosAdmin && targetWorkflow === 'admin') {
            // Direct Admin Login Workflow: Bypass PIN completely
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              tenantId: response.user.tenantId,
              role: response.user.role,
              timezone: response.user.timezone || 'America/Guayaquil',
              user: {
                name: response.user.name,
                email: response.user.email,
                timezone: response.user.timezone,
              },
              isAuthenticated: true,
              needsPinSelection: false,
              _adminAccessToken: null,
              activeTab: 'dashboard',
            });
          } else {
            // Store / Cashier Workflow (Even for admin): Hold admin token temporarily, require Cashier PIN
            set({
              _adminAccessToken: response.accessToken,
              refreshToken: response.refreshToken,
              tenantId: response.user.tenantId,
              role: response.user.role,
              timezone: response.user.timezone || 'America/Guayaquil',
              user: {
                name: response.user.name,
                email: response.user.email,
                timezone: response.user.timezone,
              },
              isAuthenticated: false,
              needsPinSelection: true,
              activeTab: 'dashboard',
            });
          }
          return true;
          return false;
        } catch (error) {
          console.error('Error de login en backend:', error);
          return false;
        }
      },

      // Cashier PIN handoff
      pinLogin: async (pin) => {
        const state = useAuthStore.getState();
        const adminToken = state._adminAccessToken;
        if (!adminToken) return 'EXPIRED';
        try {
          const res = await fetch(`${API_URL}/auth/pin-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ pin }),
          });
          if (res.status === 401) {
            return 'EXPIRED';
          }
          if (!res.ok) return 'INVALID';
          const response = await res.json();
          if (response && response.accessToken) {
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              tenantId: response.user.tenantId,
              role: response.user.role,
              timezone: response.user.timezone || 'America/Guayaquil',
              user: {
                name: response.user.name,
                email: response.user.email,
                timezone: response.user.timezone,
              },
              isAuthenticated: true,
              needsPinSelection: false,
              _adminAccessToken: adminToken,
              activeTab: 'dashboard',
            });
            return 'SUCCESS';
          }
          return 'INVALID';
        } catch (error) {
          console.error('Error de PIN login:', error);
          return 'INVALID';
        }
      },

      // Skip PIN selection (for OWNER/ADMIN who want to go directly)
      skipPinSelection: () => {
        const state = useAuthStore.getState();
        if (!state._adminAccessToken) return;
        set({
          accessToken: state._adminAccessToken,
          needsPinSelection: false,
          _adminAccessToken: null,
          isAuthenticated: true,
        });
      },

      // Lock current cashier session and return to PIN keyboard
      lockScreen: () => {
        set({
          accessToken: null,
          role: null,
          user: null,
          isAuthenticated: false,
          needsPinSelection: true,
        });
      },

      onboard: async (data) => {
        try {
          // Mapeamos los datos para que coincidan con la estructura plana esperada por OnboardTenantDto
          const payload = {
            tenantName: data.businessName,
            ruc: data.taxId,
            country: data.country,
            currencyCode: data.currency,
            currencySymbol: '$', // Símbolo por defecto para la moneda elegida
            adminName: data.adminName,
            email: data.adminEmail,
            password: data.adminPassword,
            branchName: data.branchName,
            branchAddress: data.branchAddress,
          };

          const res = await fetch(`${API_URL}/auth/onboard`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) return false;
          const response = await res.json();

          if (response && response.accessToken) {
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              tenantId: response.user.tenantId,
              role: response.user.role,
              user: {
                name: response.user.name,
                email: response.user.email,
              },
              isAuthenticated: true,
              activeTab: 'dashboard',
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error de onboarding en backend:', error);
          return false;
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tenantId: null,
          role: null,
          user: null,
          isAuthenticated: false,
          needsPinSelection: false,
          _adminAccessToken: null,
          activeTab: 'dashboard',
          selectedBranchId: null,
        });
      },

      fetchProfile: async () => {
        const state = useAuthStore.getState();
        const token = state.accessToken;
        if (!token) return false;
        try {
          const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            if (res.status === 401) {
              set({ isAuthenticated: false, accessToken: null, user: null });
            }
            return false;
          }
          const profile = await res.json();
          set({
            timezone: profile.tenant.timezone || 'America/Guayaquil',
            user: {
              name: profile.name,
              email: profile.email,
              timezone: profile.tenant.timezone,
            }
          });
          return true;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return false;
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'aura-pos-auth', // Clave en localStorage
    }
  )
);
