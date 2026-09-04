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

export function AppSidebar() {
  const { user, role, activeTab, setActiveTab, logout, lockScreen, publicTenant } = useAuthStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'sales', label: 'Ventas', icon: Receipt, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'products', label: 'Catálogo de Productos', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'purchases', label: 'Ingresos de Mercancía', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'media', label: 'Multimedia / Galería', icon: ImageIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'users', label: 'Personal / Usuarios', icon: Users, roles: ['OWNER', 'ADMIN'] },
    { id: 'customers', label: 'Directorio de Clientes', icon: Contact, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'cash-sessions', label: 'Historial de Cajas', icon: History, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'reports', label: 'Reportes y Utilidades', icon: BarChart3, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'tenant-settings', label: 'Configuración Negocio', icon: Settings, roles: ['OWNER', 'ADMIN'] },
  ]

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(role || ''))

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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-brand-secondary text-brand-secondary-foreground font-bold shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-secondary-foreground' : 'text-zinc-400'}`} />
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
              {role || 'OWNER'}
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
