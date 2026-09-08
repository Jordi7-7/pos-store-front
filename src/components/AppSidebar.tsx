import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Package, 
  Truck, 
  Users, 
  Image as ImageIcon,
  LogOut,
  ShieldCheck,
  Lock,
  Settings,
  BarChart3,
  Contact,
  History
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import { APP_PERMISSIONS } from "@/constants/permissions"

export function AppSidebar() {
  const { user, role, roleName, activeTab, setActiveTab, logout, lockScreen, publicTenant, can } = useAuthStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: APP_PERMISSIONS.VIEW_DASHBOARD },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag, permission: APP_PERMISSIONS.VIEW_POS },
    { id: 'sales', label: 'Ventas', icon: Receipt, permission: APP_PERMISSIONS.VIEW_SALES },
    { id: 'products', label: 'Catálogo de Productos', icon: Package, permission: APP_PERMISSIONS.VIEW_PRODUCTS },
    { id: 'purchases', label: 'Ingresos de Mercancía', icon: Truck, permission: APP_PERMISSIONS.VIEW_PURCHASES },
    { id: 'customers', label: 'Directorio de Clientes', icon: Contact, permission: APP_PERMISSIONS.VIEW_CUSTOMERS },
    { id: 'cash-sessions', label: 'Historial de Cajas', icon: History, permission: APP_PERMISSIONS.VIEW_CASH_SESSIONS },
    { id: 'reports', label: 'Reportes y Utilidades', icon: BarChart3, permission: APP_PERMISSIONS.VIEW_REPORTS },
    { id: 'users', label: 'Personal y Roles', icon: Users, permission: APP_PERMISSIONS.VIEW_USERS },
    { id: 'media', label: 'Multimedia / Galería', icon: ImageIcon, permission: APP_PERMISSIONS.VIEW_MEDIA },
    { id: 'tenant-settings', label: 'Configuración Negocio', icon: Settings, permission: APP_PERMISSIONS.VIEW_SETTINGS },
  ]

  const visibleMenuItems = menuItems.filter(item => can(item.permission))

  return (
    <Sidebar collapsible="icon" className="bg-brand-primary text-zinc-300 border-r border-[#222225]">
      {/* Header with Oval Logo & Brand Title */}
      <SidebarHeader className="p-4 pb-3 border-b border-[#222225]/80">
        <div className="flex flex-col items-center justify-center text-center gap-2 group-data-[collapsible=icon]:p-0">
          {/* Circular/Oval Brand Logo */}
          <div className="w-16 h-10 rounded-full border border-zinc-600/80 bg-[#161618] flex items-center justify-center px-2 py-1 shadow-inner shrink-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
            {publicTenant?.logoUrl ? (
              <img 
                src={publicTenant.logoUrl} 
                alt={publicTenant.name} 
                className="max-h-full max-w-full object-contain filter invert opacity-90"
              />
            ) : (
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-200 uppercase truncate">
                {publicTenant?.name || 'KRISHER'}
              </span>
            )}
          </div>
          
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold text-[11px] tracking-wider text-zinc-100 uppercase block">
              POS STORE
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 px-2 mb-2">
            Navegación
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1.5">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setActiveTab(item.id)}
                    tooltip={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? '!bg-brand-secondary !text-brand-secondary-foreground data-[active=true]:!bg-brand-secondary data-[active=true]:!text-brand-secondary-foreground shadow-sm [&>svg]:!text-brand-secondary-foreground [&>svg]:!opacity-100' 
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 [&>svg]:text-zinc-300 hover:[&>svg]:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? '!text-brand-secondary-foreground !opacity-100 stroke-[2.2]' : 'text-zinc-300'}`} />
                    <span className="group-data-[collapsible=icon]:hidden tracking-tight">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#222225] p-3 bg-brand-primary">
        {/* User avatar and role */}
        <div className="flex items-center gap-2.5 px-1 mb-3 group-data-[collapsible=icon]:hidden">
          <Avatar className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-200">
            <AvatarFallback className="bg-zinc-200 text-zinc-900 font-extrabold text-[11px]">
              {user?.name?.substring(0, 2).toUpperCase() || 'IM'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-zinc-100 block truncate">{user?.name || 'Imi y Cristian'}</span>
            <span className="text-[10px] text-zinc-400 font-medium truncate flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-zinc-400 inline shrink-0" />
              {roleName || role || 'Propietario'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {role === 'CASHIER' && (
            <button 
              onClick={lockScreen}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Bloquear Caja</span>
            </button>
          )}

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión de Admin</span>
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
