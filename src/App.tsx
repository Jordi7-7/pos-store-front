import React from 'react'
import { LoginScreen } from '@/modules/auth'
import { MainLayout } from '@/components/MainLayout'
import { useAuthStore } from '@/modules/auth'

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      {isAuthenticated ? <MainLayout /> : <LoginScreen />}
    </>
  )
}

export default App
