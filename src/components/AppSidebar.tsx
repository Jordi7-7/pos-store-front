import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { LogOut, ShieldCheck, ChevronDown } from "lucide-react"
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { navigationConfig } from "@/config/navigation.config"
import { Link, useRouterState, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

export function AppSidebar() {
  const { user, role, roleName, logout, publicTenant, can } = useAuthStore()
  const navigate = useNavigate()
  const { state: sidebarState } = useSidebar()
  const isIconCollapsed = sidebarState === 'collapsed'

  const handleLogout = () => {
    logout()
    navigate({ to: '/login', replace: true })
  }

  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Check if inventory section is active
  const isInventoryActive = currentPath.startsWith('/inventario')
  const [isInventoryOpen, setIsInventoryOpen] = useState(true)

  // Filter items based on permissions
  const visibleMenuItems = navigationConfig.filter((item) => {
    if (item.permission && !can(item.permission)) return false
    return true
  })

  return (
    <Sidebar collapsible="icon" className="bg-brand-primary text-zinc-300 border-r border-[#222225]">
      {/* Header with Oval Logo & Brand Title */}
      <SidebarHeader className="p-4 pb-3 border-b border-[#222225]/80">
        <div className="flex flex-col items-center justify-center text-center gap-2 group-data-[collapsible=icon]:p-0">
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

              // Collapsible Group (e.g. Inventario)
              if (item.children && item.children.length > 0) {
                const visibleChildren = item.children.filter((child) => !child.permission || can(child.permission))
                if (visibleChildren.length === 0) return null

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isInventoryActive}
                      onClick={() => setIsInventoryOpen((prev) => !prev)}
                      tooltip={item.label}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isInventoryActive 
                          ? '!bg-zinc-800/80 !text-white shadow-sm [&>div>svg]:!text-brand-secondary-foreground [&>div>svg]:!opacity-100' 
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 [&>div>svg]:text-zinc-300 hover:[&>div>svg]:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isInventoryActive ? '!text-brand-secondary-foreground !opacity-100 stroke-[2.2]' : 'text-zinc-300'}`} />
                        <span className="group-data-[collapsible=icon]:hidden tracking-tight">{item.label}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${isInventoryOpen ? 'rotate-180 text-white' : ''}`} />
                    </SidebarMenuButton>

                    {/* Submenu Items */}
                    {isInventoryOpen && !isIconCollapsed && (
                      <SidebarMenuSub className="mt-1 space-y-1 pl-4 border-l border-zinc-800/80">
                        {visibleChildren.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = currentPath === subItem.path

                          return (
                            <SidebarMenuSubItem key={subItem.id}>
                              <Link
                                to={subItem.path}
                                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  isSubActive
                                    ? '!bg-brand-secondary !text-brand-secondary-foreground font-semibold shadow-xs [&>svg]:!text-brand-secondary-foreground'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 [&>svg]:text-zinc-400 hover:[&>svg]:text-zinc-200'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{subItem.label}</span>
                              </Link>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              }

              // Standard Link Item
              const targetUrl = item.path || '/'
              const isActive = currentPath === targetUrl

              return (
                <SidebarMenuItem key={item.id}>
                  <Link
                    to={targetUrl}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? '!bg-brand-secondary !text-brand-secondary-foreground shadow-sm [&>svg]:!text-brand-secondary-foreground [&>svg]:!opacity-100' 
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 [&>svg]:text-zinc-300 hover:[&>svg]:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? '!text-brand-secondary-foreground !opacity-100 stroke-[2.2]' : 'text-zinc-300'}`} />
                    <span className="group-data-[collapsible=icon]:hidden tracking-tight">{item.label}</span>
                  </Link>
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

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
        </button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
