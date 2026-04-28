import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes } from './routes'

function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Suspense>
  )
}

export default App
