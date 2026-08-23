import React from 'react'
import { LoginScreen, CashierPinScreen } from '@/modules/auth'
import { MainLayout } from '@/components/MainLayout'
import { useAuthStore } from '@/modules/auth'

const App: React.FC = () => {
  const { isAuthenticated, needsPinSelection } = useAuthStore()

  if (needsPinSelection) return <CashierPinScreen />
  if (isAuthenticated) return <MainLayout />
  return <LoginScreen />
}

export default App
