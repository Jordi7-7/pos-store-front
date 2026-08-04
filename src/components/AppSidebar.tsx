import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Truck, 
  Users, 
  Image as ImageIcon,
  LogOut,
  ShieldCheck
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
  const { user, role, tenantId, activeTab, setActiveTab, logout } = useAuthStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'products', label: 'Catálogo de Productos', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'purchases', label: 'Ingresos de Mercancía', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'media', label: 'Multimedia / Galería', icon: ImageIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'users', label: 'Personal / Usuarios', icon: Users, roles: ['OWNER', 'ADMIN'] },
  ]

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(role || ''))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border-card p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-secondary tracking-tight block">POS STORE</span>
            <span className="text-[9px] text-primary font-mono font-semibold truncate">ID: {tenantId?.substring(0, 8)}...</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] uppercase font-bold tracking-wider text-neutral px-3 mb-2">Navegación</SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setActiveTab(item.id)}
                    tooltip={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/10' 
                        : 'text-neutral hover:text-secondary hover:bg-bg-dark'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border-card p-4 bg-bg-dark/40">
        <div className="flex items-center gap-3 px-2 mb-3 group-data-[collapsible=icon]:hidden">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {user?.name?.substring(0, 2).toUpperCase() || 'US'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-secondary block truncate">{user?.name}</span>
            <span className="text-[10px] text-neutral font-medium truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary inline shrink-0" />
              {role}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-xl transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
        </button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
