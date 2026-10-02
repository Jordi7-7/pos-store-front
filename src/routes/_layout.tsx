import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { LayoutContextProvider } from '@/providers/LayoutContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar';
import { Building, ChevronDown, CreditCard } from 'lucide-react';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useRouterState } from '@tanstack/react-router';

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
    availableRegisters,
    selectedCashRegisterId,
    setSelectedCashRegisterId,
    activeSession,
  } = useLayoutContext();

  const getPageTitle = () => {
    if (currentPath.startsWith('/inventario/productos')) return 'Inventario - Catálogo de Productos';
    if (currentPath.startsWith('/inventario/lotes')) return 'Inventario - Lotes de Inventario';
    if (currentPath.startsWith('/inventario/crear')) return 'Inventario - Registrar Producto';
    if (currentPath.startsWith('/dashboard')) return 'Dashboard';
    if (currentPath.startsWith('/pos')) return 'Punto de Venta (POS)';
    if (currentPath.startsWith('/ventas')) return 'Ventas e Historial';
    if (currentPath.startsWith('/compras')) return 'Ingresos de Mercancía';
    if (currentPath.startsWith('/clientes')) return 'Directorio de Clientes';
    if (currentPath.startsWith('/cajas/historial')) return 'Historial de Cajas';
    if (currentPath.startsWith('/cajas/registradoras')) return 'Cajas Registradoras';
    if (currentPath.startsWith('/reportes')) return 'Reportes y Utilidades';
    if (currentPath.startsWith('/usuarios')) return 'Personal y Roles';
    if (currentPath.startsWith('/multimedia')) return 'Multimedia / Galería';
    if (currentPath.startsWith('/configuracion')) return 'Configuración';
    return 'Panel';
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-bg-dark flex text-text-main font-sans w-full overflow-hidden">
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b border-border-card bg-bg-card px-6 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-neutral hover:text-secondary cursor-pointer" />
                <h1 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {getPageTitle()}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Branch Selector */}
                {(() => {
                  const allowedBranches =
                    branches && branches.length > 0
                      ? user?.branchIds && user.branchIds.length > 0
                        ? branches.filter((b: any) => user.branchIds!.includes(b.id))
                        : branches
                      : [];

                  if (allowedBranches.length === 0) return null;

                  return (
                    <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-3 py-1">
                      <Building className="w-3.5 h-3.5 text-neutral" />
                      <select
                        value={selectedBranchId || ''}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        disabled={allowedBranches.length === 1}
                        className="bg-transparent text-xs text-secondary font-semibold focus:outline-none cursor-pointer disabled:cursor-default"
                      >
                        {allowedBranches.map((b: any) => (
                          <option key={b.id} value={b.id} className="bg-bg-card text-secondary">
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* Cash Register Selector */}
                {availableRegisters && availableRegisters.length > 0 && (
                  <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-3 py-1">
                    <CreditCard className="w-3.5 h-3.5 text-neutral" />
                    <select
                      value={selectedCashRegisterId || ''}
                      onChange={(e) => setSelectedCashRegisterId(e.target.value)}
                      disabled={availableRegisters.length === 1}
                      className="bg-transparent text-xs text-secondary font-semibold focus:outline-none cursor-pointer disabled:cursor-default"
                      title={availableRegisters.length === 1 ? 'Caja asignada única' : 'Seleccionar caja registradora'}
                    >
                      {availableRegisters.map((reg: any) => (
                        <option key={reg.id} value={reg.id} className="bg-bg-card text-secondary">
                          {reg.name} {reg.isOpen ? '🟢' : '⚪'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* User quick pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-medium text-secondary">
                  <span className="w-2 h-2 rounded-sm bg-neutral/40" />
                  <span className="font-semibold">{user?.name?.split(' ')[0] || 'Cajero'}</span>
                  <ChevronDown className="w-3 h-3 text-neutral" />
                </div>

                {/* Cash Session Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
                  />
                  <span className="text-neutral font-medium">
                    Caja: <span className="text-secondary font-bold">{activeSession ? 'ABIERTA' : 'CERRADA'}</span>
                    {(activeSession?.openedByName || activeSession?.user?.name) && (
                      <span className="text-[11px] text-neutral font-normal ml-1">
                        ({(activeSession.openedByName || activeSession.user.name).split(' ')[0]})
                      </span>
                    )}
                  </span>
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
