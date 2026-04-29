import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import Layout from './components/Layout'
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Toaster richColors position="top-center" />
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
