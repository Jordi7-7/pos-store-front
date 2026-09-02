import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type PublicTenantResponse, type OnboardPayload } from '../services/auth.service';

export type PublicTenant = PublicTenantResponse;

interface User {
  name: string;
  email: string;
  timezone?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  publicTenant: PublicTenant | null;
  isLoadingTenant: boolean;
  tenantError: string | null;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER' | null;
  timezone: string | null;
  user: User | null;
  activeTab: string;
  isAuthenticated: boolean;

  // Actions
  fetchPublicTenant: (slug: string) => Promise<boolean>;
  setTenantSlug: (slug: string | null) => void;
  login: (identifier: string, password: string, targetWorkflow?: 'admin' | 'store', slugOverride?: string) => Promise<boolean>;
  pinLogin: (pin: string, slugOverride?: string) => Promise<'SUCCESS' | 'INVALID' | 'EXPIRED' | 'NOT_FOUND'>;
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
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      tenantSlug: null,
      publicTenant: null,
      isLoadingTenant: false,
      tenantError: null,
      role: null,
      timezone: null,
      user: null,
      activeTab: 'dashboard',
      isAuthenticated: false,

      selectedBranchId: null,

      setTenantSlug: (slug) => set({ tenantSlug: slug }),

      fetchPublicTenant: async (slug: string) => {
        if (!slug || !slug.trim()) return false;
        const cleanSlug = slug.toLowerCase().trim();
        set({ isLoadingTenant: true, tenantError: null });
        try {
          const data = await authService.getPublicTenantBySlug(cleanSlug);
          set({
            publicTenant: data,
            tenantSlug: data.slug,
            tenantId: data.id,
            timezone: data.timezone,
            isLoadingTenant: false,
            tenantError: null,
          });
          return true;
        } catch (err: any) {
          console.error('Error fetching public tenant info:', err);
          set({
            publicTenant: null,
            isLoadingTenant: false,
            tenantError: err.message || 'Error al conectar con la tienda',
          });
          return false;
        }
      },

      login: async (identifier, password, targetWorkflow = 'store', slugOverride) => {
        const state = get();
        const effectiveSlug = slugOverride || state.tenantSlug || state.publicTenant?.slug || undefined;

        try {
          const response = await authService.login({
            email: identifier,
            password,
            tenantSlug: effectiveSlug,
          });

          const isPosAdmin = response.user.role === 'OWNER' || response.user.role === 'ADMIN';

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
            activeTab: isPosAdmin && targetWorkflow === 'admin' ? 'dashboard' : 'pos',
          });
          return true;
        } catch (error) {
          console.error('Error de login en backend:', error);
          return false;
        }
      },

      // Direct Cashier PIN login (no admin token required when tenantSlug is known)
      pinLogin: async (pin, slugOverride) => {
        const state = get();
        const effectiveSlug = slugOverride || state.tenantSlug || state.publicTenant?.slug || '';

        try {
          const response = await authService.pinLogin({
            pin,
            tenantSlug: effectiveSlug,
          });

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
              activeTab: 'pos',
            });
            return 'SUCCESS';
          }
          return 'INVALID';
        } catch (error: any) {
          console.error('Error de PIN login:', error);
          if (error.message?.includes('Tienda no encontrada')) {
            return 'NOT_FOUND';
          }
          return 'INVALID';
        }
      },

      // Lock current cashier session and return to fast PIN login
      lockScreen: () => {
        set({
          accessToken: null,
          role: null,
          user: null,
          isAuthenticated: false,
        });
      },

      onboard: async (data) => {
        try {
          const payload: OnboardPayload = {
            tenantName: data.businessName,
            ruc: data.taxId,
            country: data.country,
            currencyCode: data.currency,
            currencySymbol: '$',
            adminName: data.adminName,
            email: data.adminEmail,
            password: data.adminPassword,
            branchName: data.branchName,
            branchAddress: data.branchAddress,
          };

          const response = await authService.onboard(payload);

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
          role: null,
          user: null,
          isAuthenticated: false,
          activeTab: 'dashboard',
          selectedBranchId: null,
        });
      },

      fetchProfile: async () => {
        const state = get();
        const token = state.accessToken;
        if (!token) return false;
        try {
          const profile = await authService.getProfile();
          set({
            timezone: profile.tenant.timezone || 'America/Guayaquil',
            publicTenant: profile.tenant
              ? {
                  id: profile.tenant.id,
                  name: profile.tenant.name,
                  slug: profile.tenant.slug,
                  logoUrl: profile.tenant.logoUrl,
                  country: profile.tenant.country || 'EC',
                  currencyCode: profile.tenant.currencyCode || 'USD',
                  currencySymbol: profile.tenant.currencySymbol || '$',
                  timezone: profile.tenant.timezone || 'America/Guayaquil',
                }
              : state.publicTenant,
            tenantSlug: profile.tenant?.slug || state.tenantSlug,
            user: {
              name: profile.name,
              email: profile.email,
              timezone: profile.tenant.timezone,
            },
          });
          return true;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          set({ isAuthenticated: false, accessToken: null, user: null });
          return false;
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'aura-pos-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenantId: state.tenantId,
        tenantSlug: state.tenantSlug,
        publicTenant: state.publicTenant,
        role: state.role,
        user: state.user,
        timezone: state.timezone,
        selectedBranchId: state.selectedBranchId,
        activeTab: state.activeTab,
      }),
    }
  )
);

