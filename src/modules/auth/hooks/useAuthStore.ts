import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type PublicTenantResponse, type OnboardPayload } from '../services/auth.service';

export type PublicTenant = PublicTenantResponse;

export interface AssignedCashRegister {
  id: string;
  name: string;
  code: number;
  branchId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  branchIds?: string[];
  cashRegisters?: AssignedCashRegister[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  publicTenant: PublicTenant | null;
  isLoadingTenant: boolean;
  tenantError: string | null;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER' | string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
  timezone: string | null;
  user: User | null;
  branchIds: string[];
  cashRegisters: AssignedCashRegister[];
  activeTab: string;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Actions & Helpers
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
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
  selectedCashRegisterId: string | null;
  setSelectedCashRegisterId: (registerId: string | null) => void;
  fetchProfile: () => Promise<boolean>;
}

let inFlightProfilePromise: Promise<boolean> | null = null;

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
      roleId: null,
      roleName: null,
      permissions: [],
      timezone: null,
      user: null,
      branchIds: [],
      cashRegisters: [],
      activeTab: 'dashboard',
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      selectedBranchId: null,
      selectedCashRegisterId: null,
      setSelectedCashRegisterId: (registerId) => set({ selectedCashRegisterId: registerId }),

      can: (permission: string) => {
        const state = get();
        if (!state.accessToken || !state.user) return false;
        if (state.role === 'OWNER' || state.permissions.includes('*')) return true;
        return state.permissions.includes(permission);
      },

      canAny: (perms: string[]) => {
        const state = get();
        if (!state.accessToken || !state.user) return false;
        if (state.role === 'OWNER' || state.permissions.includes('*')) return true;
        return perms.some((p) => state.permissions.includes(p));
      },

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

          if (!response || !response.accessToken) {
            return false;
          }

          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            tenantSlug: effectiveSlug || state.tenantSlug,
          });

          const profileOk = await get().fetchProfile();
          if (!profileOk) {
            get().logout();
            return false;
          }

          const currentRole = get().role;
          const isPosAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';
          set({
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
              tenantSlug: effectiveSlug || state.tenantSlug,
            });

            const profileOk = await get().fetchProfile();
            if (!profileOk) {
              get().logout();
              return 'INVALID';
            }

            set({ activeTab: 'pos' });
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
          roleId: null,
          roleName: null,
          permissions: [],
          user: null,
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
            });

            const profileOk = await get().fetchProfile();
            if (!profileOk) {
              get().logout();
              return false;
            }

            set({ activeTab: 'dashboard' });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error de onboarding en backend:', error);
          return false;
        }
      },

      logout: () => {
        // Notificar al backend de forma asíncrona (fire & forget) para revocar refresh_token en Redis
        authService.logout().catch(() => {});

        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          roleId: null,
          roleName: null,
          permissions: [],
          user: null,
          activeTab: 'dashboard',
          selectedBranchId: null,
          selectedCashRegisterId: null,
        });
      },

      fetchProfile: async () => {
        if (inFlightProfilePromise) {
          return inFlightProfilePromise;
        }

        inFlightProfilePromise = (async () => {
          const state = get();
          const token = state.accessToken;
          if (!token) return false;
          try {
            const profile = await authService.getProfile();
            set({
              tenantId: profile.tenant?.id || state.tenantId,
              timezone: profile.tenant.timezone || 'America/Guayaquil',
              role: profile.role,
              roleId: profile.roleId || null,
              roleName: profile.roleName || profile.role,
              permissions: profile.permissions || [],
              branchIds: profile.branchIds || [],
              cashRegisters: profile.cashRegisters || [],
              selectedBranchId: (profile.branchIds && profile.branchIds.length === 1) ? profile.branchIds[0] : (state.selectedBranchId || null),
              selectedCashRegisterId: (profile.cashRegisters && profile.cashRegisters.length === 1) ? profile.cashRegisters[0].id : (state.selectedCashRegisterId || null),
              publicTenant: profile.tenant
                ? {
                    id: profile.tenant.id,
                    name: profile.tenant.name,
                    ruc: profile.tenant.ruc,
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
                id: profile.id,
                name: profile.name,
                email: profile.email,
                timezone: profile.tenant.timezone,
                branchIds: profile.branchIds || [],
                cashRegisters: profile.cashRegisters || [],
              },
              isAuthenticated: true,
            });
            return true;
          } catch (error) {
            console.error('Error fetching user profile (token inválido o expirado):', error);
            get().logout();
            return false;
          } finally {
            inFlightProfilePromise = null;
          }
        })();

        return inFlightProfilePromise;
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'aura-pos-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenantId: state.tenantId,
        tenantSlug: state.tenantSlug,
        publicTenant: state.publicTenant,
        role: state.role,
        roleId: state.roleId,
        roleName: state.roleName,
        permissions: state.permissions,
        user: state.user,
        branchIds: state.branchIds,
        cashRegisters: state.cashRegisters,
        timezone: state.timezone,
        selectedBranchId: state.selectedBranchId,
        selectedCashRegisterId: state.selectedCashRegisterId,
        activeTab: state.activeTab,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

