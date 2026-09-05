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
      if (!publicTenant || publicTenant.slug !== slugFromUrl) {
        fetchPublicTenant(slugFromUrl)
      }
    } else if (tenantSlug && !publicTenant) {
      fetchPublicTenant(tenantSlug)
    }
  }, [publicTenant, tenantSlug, fetchPublicTenant])

  if (isAuthenticated) return <MainLayout />
  return <LoginScreen />
}

export default App
