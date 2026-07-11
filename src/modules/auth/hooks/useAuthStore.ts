import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:3000'; // Default NestJS backend address

interface User {
  name: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER' | null;
  user: User | null;
  activeTab: string;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  onboard: (data: any) => Promise<boolean>;
  logout: () => void;
  setActiveTab: (tab: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      role: null,
      user: null,
      activeTab: 'dashboard',
      isAuthenticated: false,

      login: async (email, password) => {
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
          console.error('Error de login en backend:', error);
          return false;
        }
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
          activeTab: 'dashboard',
        });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'aura-pos-auth', // Clave en localStorage
    }
  )
);
