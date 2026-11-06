import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './providers/QueryProvider'
import { restoreSessionOnStart, setupApiClient } from './app/configure-api-client'

setupApiClient()

// El token de acceso vive solo en memoria: antes de pintar se recupera con la cookie de renovación, para que las
// guardas de ruta ya sepan si hay sesión (si no, una recarga mandaría al login a quien sigue conectado).
void restoreSessionOnStart().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </StrictMode>,
  )
})
