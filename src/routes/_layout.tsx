import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { LayoutContextProvider, useLayoutContext } from '@/providers/LayoutContext';
import type { Branch } from '@/modules/branches';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar';
import { Building, ChevronDown } from 'lucide-react';

export const Route = createFileRoute('/_layout')({
  beforeLoad: () => {
    const { isAuthenticated, accessToken, user } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken || !user) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      navigate({ to: '/login', replace: true });
    }
  }, [isAuthenticated, accessToken, navigate]);

  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <LayoutContextProvider>
      <DashboardShell />
    </LayoutContextProvider>
  );
}

function DashboardShell() {
  const { user } = useAuthStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranchName,
    isOwner,
  } = useLayoutContext();

  const getPageTitle = () => {
    if (currentPath.startsWith('/inventario/productos')) return 'Inventario - Catálogo de Productos';
    if (currentPath.startsWith('/inventario/lotes')) return 'Inventario - Lotes de Inventario';
    if (currentPath.startsWith('/inventario/crear')) return 'Inventario - Registrar Producto';
    if (currentPath.startsWith('/dashboard')) return 'Dashboard';
    if (currentPath.startsWith('/pos')) return 'Punto de Venta (POS)';
    if (currentPath.startsWith('/ventas')) return 'Ventas e Historial';
    if (currentPath.startsWith('/compras')) return 'Compras';
    if (currentPath.startsWith('/clientes')) return 'Directorio de Clientes';
    if (currentPath.startsWith('/cajas/historial')) return 'Historial de Cajas';
    if (currentPath.startsWith('/cajas/registradoras')) return 'Cajas Registradoras';
    if (currentPath.startsWith('/reportes/costo-ventas')) return 'Reportes - Costo de Ventas';
    if (currentPath.startsWith('/reportes/ventas-productos')) return 'Reportes - Ventas por Producto';
    if (currentPath.startsWith('/reportes/existencias-valuadas')) return 'Reportes - Existencias Valuadas';
    if (currentPath.startsWith('/reportes')) return 'Reportes y Utilidades';
    if (currentPath.startsWith('/usuarios')) return 'Personal y Roles';
    if (currentPath.startsWith('/multimedia')) return 'Multimedia / Galería';
    if (currentPath.startsWith('/configuracion')) return 'Configuración';
    return 'Panel';
  };

  // Check scope of the current page: branch-specific vs company-wide global
  const isBranchSpecific = 
    currentPath.startsWith('/pos') ||
    currentPath.startsWith('/inventario/productos') ||
    currentPath.startsWith('/inventario/lotes') ||
    currentPath.startsWith('/cajas') ||
    currentPath.startsWith('/ventas') ||
    currentPath.startsWith('/compras') ||
    currentPath.startsWith('/dashboard') ||
    currentPath.startsWith('/reportes');

  const isAllBranches = !selectedBranchId;
  const activeBranchName = selectedBranchName;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-bg-dark flex text-text-main font-sans w-full overflow-hidden">
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b border-border-card bg-bg-card px-6 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-neutral hover:text-secondary cursor-pointer" />
                <div className="flex items-center gap-2">
                  <h1 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    {getPageTitle()}
                  </h1>

                  {/* Context Badge: Branch-specific vs Global */}
                  {isBranchSpecific ? (
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isAllBranches
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      <Building className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[150px]">{activeBranchName}</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Global Empresa
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Branch Selector */}
                {branches && branches.length > 0 && (
                  <div className="relative flex items-center gap-2 bg-bg-dark hover:bg-neutral/5 border border-border-card rounded-xl px-3 py-1.5 transition-all">
                    <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                    <select
                      value={selectedBranchId ?? ''}
                      onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
                      disabled={!isOwner && branches.length === 1}
                      className="bg-transparent text-xs text-secondary font-bold focus:outline-none cursor-pointer disabled:cursor-default pr-4 appearance-none"
                    >
                      {isOwner && (
                        <option value="" className="bg-bg-card text-secondary font-bold">
                          Todas las Sucursales
                        </option>
                      )}
                      {branches.map((b: Branch) => (
                        <option key={b.id} value={b.id} className="bg-bg-card text-secondary">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {(isOwner || branches.length > 1) && (
                      <ChevronDown className="w-3 h-3 text-neutral pointer-events-none -ml-3" />
                    )}
                  </div>
                )}

                {/* User quick pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-medium text-secondary">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  <span className="font-semibold">{user?.name}</span>
                </div>
              </div>
            </header>

            {/* Dynamic Outlet with auto route rendering */}
            <main className="flex-1 overflow-y-auto p-6 bg-bg-dark relative">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
