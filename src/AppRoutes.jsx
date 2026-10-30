import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClientesList = lazy(() => import('./pages/ClientesList'))
const ClienteNuevo = lazy(() => import('./pages/ClienteNuevo'))
const ClienteDetail = lazy(() => import('./pages/ClienteDetail'))
const VehiculosList = lazy(() => import('./pages/VehiculosList'))
const VehiculoNuevo = lazy(() => import('./pages/VehiculoNuevo'))
const VehiculoDetail = lazy(() => import('./pages/VehiculoDetail'))
const OrdenesList = lazy(() => import('./pages/OrdenesList'))
const OrdenNueva = lazy(() => import('./pages/OrdenNueva'))
const OrdenDetail = lazy(() => import('./pages/OrdenDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Economia = lazy(() => import('./pages/Economia'))

// Las páginas se cargan bajo demanda (code splitting)
const routes = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/economia',
    element: <Economia />,
  },
  {
    path: '/clientes',
    element: <ClientesList />,
  },
  {
    path: '/clientes/nuevo',
    element: <ClienteNuevo />,
  },
  {
    path: '/clientes/:id',
    element: <ClienteDetail />,
  },
  {
    path: '/vehiculos',
    element: <VehiculosList />,
  },
  {
    path: '/vehiculos/nuevo',
    element: <VehiculoNuevo />,
  },
  {
    path: '/vehiculos/:id',
    element: <VehiculoDetail />,
  },
  {
    path: '/ordenes',
    element: <OrdenesList />,
  },
  {
    path: '/ordenes/nueva',
    element: <OrdenNueva />,
  },
  {
    path: '/ordenes/:id',
    element: <OrdenDetail />,
  },
  {
    path: '/buscar',
    element: <SearchResults />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export default function AppRoutes() {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  )
}
