import React, { useEffect } from 'react'
import { LoginScreen } from '@/modules/auth'
import { MainLayout } from '@/components/MainLayout'
import { useAuthStore } from '@/modules/auth'
import { getTenantSlugFromPath } from '@/lib/tenantUrl'
import { getSavedTheme, applyTheme } from '@/lib/themeManager'

const App: React.FC = () => {
  const { isAuthenticated, publicTenant, tenantSlug, tenantId, fetchPublicTenant } = useAuthStore()

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

  if (isAuthenticated) return <MainLayout />
  return <LoginScreen />
}

export default App
