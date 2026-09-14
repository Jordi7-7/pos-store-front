import React, { useEffect } from 'react'
import { LoginScreen } from '@/modules/auth'
import { MainLayout } from '@/components/MainLayout'
import { useAuthStore } from '@/modules/auth'
import { getTenantSlugFromPath } from '@/lib/tenantUrl'
import { getSavedTheme, applyTheme } from '@/lib/themeManager'

const App: React.FC = () => {
  const { accessToken, user, isAuthenticated, publicTenant, tenantSlug, tenantId, _hasHydrated, fetchPublicTenant, fetchProfile } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = React.useState<boolean>(true)

  // Una vez que Zustand termina de hidratar desde localStorage
  useEffect(() => {
    if (!_hasHydrated) return

    if (accessToken) {
      // Si ya hay token y usuario guardado en localStorage, permitimos entrar inmediatamente y sincronizamos en segundo plano
      if (user) {
        setIsCheckingAuth(false)
        fetchProfile().catch(() => {})
      } else {
        // Si hay token pero falta el usuario, validamos con /auth/profile
        fetchProfile().finally(() => {
          setIsCheckingAuth(false)
        })
      }
    } else {
      setIsCheckingAuth(false)
    }
  }, [_hasHydrated, accessToken])

  // Apply tenant theme on load and tenant change
  useEffect(() => {
    const theme = getSavedTheme(tenantId || publicTenant?.id)
    applyTheme(theme)
  }, [tenantId, publicTenant?.id])

  useEffect(() => {
    const slugFromUrl = getTenantSlugFromPath()
    if (slugFromUrl) {
      // Si el usuario está autenticado en otra tienda y navega a una URL con un slug distinto,
      // cerramos la sesión para forzar el login en la nueva tienda.
      if (isAuthenticated && tenantSlug && tenantSlug.toLowerCase() !== slugFromUrl.toLowerCase()) {
        useAuthStore.getState().logout()
        fetchPublicTenant(slugFromUrl)
        return
      }

      if (!publicTenant || publicTenant.slug !== slugFromUrl) {
        fetchPublicTenant(slugFromUrl)
      }
    } else if (tenantSlug && !publicTenant) {
      fetchPublicTenant(tenantSlug)
    }
  }, [isAuthenticated, publicTenant, tenantSlug, fetchPublicTenant])

  // Pantalla de carga mínima mientras se valida el token con /auth/profile
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">Validando sesión...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) return <MainLayout />
  return <LoginScreen />
}

export default App
