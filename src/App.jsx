import { Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import Layout from './components/Layout'
import { Toaster } from 'sonner'
import useAppStore from './store/useAppStore'

function App() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <Toaster richColors position="top-center" theme={theme} />
      <Layout>
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Suspense>
      </Layout>
    </>
  )
}

export default App
