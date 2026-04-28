import { lazy } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClientesList = lazy(() => import('./pages/ClientesList'))
const ClienteNuevo = lazy(() => import('./pages/ClienteNuevo'))
const ClienteDetail = lazy(() => import('./pages/ClienteDetail'))
const VehiculoDetail = lazy(() => import('./pages/VehiculoDetail'))
const OrdenesList = lazy(() => import('./pages/OrdenesList'))
const OrdenDetail = lazy(() => import('./pages/OrdenDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))

export const routes = [
  {
    path: '/',
    element: <Dashboard />,
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
    path: '/vehiculos/:id',
    element: <VehiculoDetail />,
  },
  {
    path: '/ordenes',
    element: <OrdenesList />,
  },
  {
    path: '/ordenes/:id',
    element: <OrdenDetail />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]
