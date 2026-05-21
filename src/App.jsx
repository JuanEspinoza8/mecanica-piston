import { Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingPage from './components/LoadingPage'
import Login from './pages/Login'
import { Toaster } from 'sonner'
import useAppStore from './store/useAppStore'
import ConnectionStatus from './components/ConnectionStatus'
import { useOfflineSync } from './hooks/useOfflineSync'
import { usePrefetch } from './hooks/usePrefetch'

function App() {
  const theme = useAppStore((state) => state.theme);

  // Sincronización offline: procesa cola de pendientes al reconectar
  useOfflineSync();
  
  // Prefetch data en background para caché offline
  usePrefetch();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <ConnectionStatus />
      <Toaster richColors position="top-center" theme={theme} />
      <Routes>
        {/* Ruta pública: Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas: requieren autenticación */}
        <Route path="*" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Layout>
                <Suspense fallback={<LoadingPage />}>
                  <Routes>
                    {routes.map((route) => (
                      <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                  </Routes>
                </Suspense>
              </Layout>
            </ErrorBoundary>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

export default App

