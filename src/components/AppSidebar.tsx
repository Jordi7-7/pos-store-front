import { useAuthStore } from "@/modules/auth/presentation/stores/useAuthStore"
import { useRoleName, useTenant, useUser } from "@/modules/auth/presentation/hooks/useSession"
import { LogOut, ChevronDown } from "lucide-react"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NAV_SECTIONS, navigationConfig, type NavItem } from "@/config/navigation.config"
import { Link, useRouterState, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

/** Fila del menú: misma altura, tipografía y estados para todo (enlaces y grupos). */
const ROW = "flex h-8 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
const ROW_IDLE = "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
const ROW_ACTIVE = "bg-brand-secondary text-brand-secondary-foreground font-semibold"

export function AppSidebar() {
  const { logout, can } = useAuthStore()
  const user = useUser()
  const tenant = useTenant()
  const roleName = useRoleName()
  const navigate = useNavigate()
  const { state: sidebarState, setOpen } = useSidebar()
  const isIconCollapsed = sidebarState === "collapsed"
  const currentPath = useRouterState().location.pathname

  const handleLogout = () => {
    logout()
    navigate({ to: "/login", replace: true })
  }

  // Un grupo se abre solo cuando la pantalla actual es una de sus páginas; el resto, cuando la persona lo pide.
  const [toggled, setToggled] = useState<Record<string, boolean>>({})

  const isVisible = (item: NavItem) => {
    if (item.permission && !can(item.permission)) return false
    if (item.children) return item.children.some((child) => !child.permission || can(child.permission))
    return true
  }
  const visible = navigationConfig.filter(isVisible)
  const topLevel = visible.filter((item) => !item.section)

  const renderItem = (item: NavItem) => {
    const Icon = item.icon

    if (item.children) {
      const children = item.children.filter((child) => !child.permission || can(child.permission))
      const isGroupActive = children.some((child) => currentPath.startsWith(child.path))
      const isOpen = toggled[item.id] ?? isGroupActive
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => {
              if (isIconCollapsed) {
                setOpen(true)
                setToggled((prev) => ({ ...prev, [item.id]: true }))
                return
              }
              setToggled((prev) => ({ ...prev, [item.id]: !isOpen }))
            }}
            tooltip={item.label}
            aria-expanded={isOpen}
            className={`${ROW} justify-between ${isGroupActive ? "!text-white" : ROW_IDLE}`}
          >
            <span className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
              <Icon className={`h-[18px] w-[18px] shrink-0 ${isGroupActive ? "text-brand-secondary" : ""}`} />
              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${isOpen ? "rotate-180" : ""}`} />
          </SidebarMenuButton>

          {isOpen && !isIconCollapsed && (
            <ul className="mb-1 ml-[18px] mt-0.5 space-y-px border-l border-zinc-800 pl-2">
              {children.map((child) => {
                const isActive = currentPath === child.path
                return (
                  <li key={child.id}>
                    <Link
                      to={child.path}
                      className={`flex h-7 items-center rounded-md px-3 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                        isActive ? "bg-brand-secondary font-semibold text-brand-secondary-foreground" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </SidebarMenuItem>
      )
    }

    const target = item.path || "/"
    const isActive = currentPath === target
    return (
      <SidebarMenuItem key={item.id}>
        <Link to={target} title={isIconCollapsed ? item.label : undefined} className={`${ROW} ${isActive ? ROW_ACTIVE : ROW_IDLE}`}>
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
        </Link>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-[#222225] bg-brand-primary text-zinc-300">
      {/* Marca: logo y nombre de la tienda, en una sola línea */}
      <SidebarHeader className="border-b border-[#222225] px-4 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-700 bg-[#161618]">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="max-h-full max-w-full object-contain opacity-90 invert" />
            ) : (
              <span className="text-xs font-bold text-zinc-200">{(tenant?.name || "POS").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold leading-tight text-zinc-100">{tenant?.name || "POS Store"}</p>
            <p className="text-xs leading-tight text-zinc-500">Punto de venta</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 py-2.5 group-data-[collapsible=icon]:px-2">
        {topLevel.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarMenu className="gap-0.5">{topLevel.map(renderItem)}</SidebarMenu>
          </SidebarGroup>
        )}

        {NAV_SECTIONS.map((section) => {
          const items = visible.filter((item) => item.section === section)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={section} className="mt-3 p-0 group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:border-t group-data-[collapsible=icon]:border-zinc-800 group-data-[collapsible=icon]:pt-2">
              <SidebarGroupLabel className="mb-0.5 h-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 group-data-[collapsible=icon]:hidden">
                {section}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">{items.map(renderItem)}</SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      {/* Persona y salida, en una sola fila */}
      <SidebarFooter className="border-t border-[#222225] bg-brand-primary p-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 shrink-0 border border-zinc-700 bg-zinc-200 group-data-[collapsible=icon]:hidden">
            <AvatarFallback className="bg-zinc-200 text-xs font-bold text-zinc-900">{user?.name?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[13px] font-medium leading-tight text-zinc-100">{user?.name}</p>
            <p className="truncate text-xs leading-tight text-zinc-500">{roleName}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors group-data-[collapsible=icon]:size-10 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
