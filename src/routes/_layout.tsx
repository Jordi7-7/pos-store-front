import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore, selectIsAuthenticated, useIsAuthenticated, useTenant, useTenantFormatKey, SessionExpiredModal, useIdleTimer } from '@/modules/auth';
import { LayoutContextProvider, useLayoutContext } from '@/providers/LayoutContext';
import type { Branch } from '@/modules/branches';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar';
import { AutoCollapseSidebar } from '@/components/AutoCollapseSidebar';
import { Building, ChevronDown, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/_layout')({
  beforeLoad: () => {
    if (!selectIsAuthenticated(useAuthStore.getState())) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const isAuthenticated = useIsAuthenticated();
  const tenantSlug = useTenant()?.slug;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      if (tenantSlug) {
        navigate({ to: '/login/$tenantSlug', params: { tenantSlug }, replace: true });
      } else {
        navigate({ to: '/login', replace: true });
      }
    }
  }, [isAuthenticated, tenantSlug, navigate]);

  // Monitoreo de inactividad real del usuario y renovación silenciosa proactiva
  useIdleTimer();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <LayoutContextProvider>
      <DashboardShell />
      <SessionExpiredModal />
    </LayoutContextProvider>
  );
}

function DashboardShell() {
  const { user } = useAuthStore();
  // Si cambia la moneda, el país o la zona horaria de la tienda, el contenido se repinta con el formato nuevo.
  const tenantFormatKey = useTenantFormatKey();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    isOwner,
  } = useLayoutContext();

  const getPageTitle = () => {
    if (currentPath.startsWith('/inventario/productos')) return 'Inventario - Productos';
    if (currentPath.startsWith('/inventario/lotes')) return 'Inventario - Lotes';
    if (currentPath.startsWith('/inventario/crear')) return 'Inventario - Crear producto';
    if (currentPath.startsWith('/dashboard')) return 'Dashboard';
    if (currentPath.startsWith('/pos')) return 'Punto de Venta (POS)';
    if (currentPath.startsWith('/ventas')) return 'Ventas';
    if (currentPath.startsWith('/compras/registrar')) return 'Compras - Registrar compra';
    if (currentPath.startsWith('/compras/historial')) return 'Compras - Historial';
    if (currentPath.startsWith('/compras/proveedores')) return 'Compras - Proveedores';
    if (currentPath.startsWith('/compras')) return 'Compras';
    if (currentPath.startsWith('/clientes')) return 'Clientes';
    if (currentPath.startsWith('/cajas/historial')) return 'Cajas - Historial de turnos';
    if (currentPath.startsWith('/cajas/registradoras')) return 'Cajas - Cajas registradoras';
    if (currentPath.startsWith('/reportes/costo-ventas')) return 'Reportes - Costo de ventas';
    if (currentPath.startsWith('/reportes/ventas-productos')) return 'Reportes - Ventas por producto';
    if (currentPath.startsWith('/reportes/existencias-valuadas')) return 'Reportes - Existencias valuadas';
    if (currentPath.startsWith('/reportes')) return 'Reportes';
    if (currentPath.startsWith('/usuarios')) return 'Personal y roles';
    if (currentPath.startsWith('/multimedia')) return 'Galería';
    if (currentPath.startsWith('/configuracion')) return 'Configuración';
    return 'Panel';
  };

  // 'Inventario - Productos' → ['Inventario', 'Productos']: dónde está la persona dentro de la app.
  const breadcrumb = getPageTitle().split(' - ')

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={typeof window === 'undefined' || window.innerWidth >= 1024} style={{ '--sidebar-width-icon': '4rem' } as React.CSSProperties}>
        <AutoCollapseSidebar />
        <div className="min-h-screen bg-bg-dark flex text-text-main font-sans w-full overflow-hidden">
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 border-b border-border-card bg-bg-card px-3 sm:px-6 flex items-center justify-between gap-2 z-20 shrink-0">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="text-neutral hover:text-secondary cursor-pointer" />
                <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
                  {breadcrumb.map((part, index) => (
                    <span key={part} className={`items-center gap-1.5 ${index === breadcrumb.length - 1 ? 'flex' : 'hidden sm:flex'}`}>
                      {index > 0 && <ChevronRight className="hidden h-3.5 w-3.5 sm:block" />}
                      <span className={index === breadcrumb.length - 1 ? 'font-medium text-secondary' : ''}>{part}</span>
                    </span>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Branch Selector */}
                {branches && branches.length > 0 && (
                  <div className="relative flex items-center gap-2 bg-bg-dark hover:bg-neutral/5 border border-border-card rounded-xl px-3 py-1.5 transition-all">
                    <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                    <select
                      value={selectedBranchId ?? ''}
                      onChange={(e) => setSelectedBranchId(e.target.value ? e.target.value : null)}
                      disabled={!isOwner && branches.length === 1}
                      className="max-w-[34vw] truncate bg-transparent text-xs text-secondary font-bold focus:outline-none cursor-pointer disabled:cursor-default pr-4 appearance-none sm:max-w-[220px]"
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-medium text-secondary" title={user?.name}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  <span className="hidden font-semibold md:inline">{user?.name}</span>
                </div>
              </div>
            </header>

            {/* Dynamic Outlet with auto route rendering */}
            <main className="flex-1 overflow-y-auto bg-bg-dark relative">
              {/* Contenedor único: mismo ancho máximo, margen y separación entre bloques en todas las pantallas */}
              <div className={currentPath.startsWith('/pos') ? 'h-full p-3 sm:p-6' : 'mx-auto flex w-full max-w-[1440px] flex-col gap-5 p-3 sm:p-6'}>
                <Outlet key={tenantFormatKey} />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
