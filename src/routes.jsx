import { lazy } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClientesList = lazy(() => import('./pages/ClientesList'))
const ClienteDetail = lazy(() => import('./pages/ClienteDetail'))
const VehiculoDetail = lazy(() => import('./pages/VehiculoDetail'))
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
    path: '/clientes/:id',
    element: <ClienteDetail />,
  },
  {
    path: '/vehiculos/:id',
    element: <VehiculoDetail />,
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
