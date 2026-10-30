import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCachedData, isOnline } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { offlineQuery } from './offlineHelpers';

// Las mismas queries que usan las pantallas: así el prefetch deja en caché
// exactamente lo que después se lee (misma clave, misma forma de los datos).
import { clientesQuery } from './useClientes';
import { vehiculosQuery } from './useVehiculos';
import { ordenesQuery } from './useOrdenes';
import { deudasQuery } from './useDeudas';
import { pagosQuery } from './usePagos';
import { archivosQuery } from './useArchivos';
import { notasQuery } from './useNotas';
import { historialQuery } from './useHistorial';

// Repuestos y tareas no tienen pantalla de "todos": solo se cachean
const todosQuery = (tabla) => ({
  queryKey: [tabla, 'all'],
  queryFn: offlineQuery({
    tabla,
    remoto: () => supabase.from(tabla).select('*'),
    local: () => getCachedData(tabla),
  }),
});

const PREFETCH = [
  clientesQuery,
  vehiculosQuery(),
  ordenesQuery(),
  deudasQuery,
  pagosQuery,
  todosQuery('repuestos'),
  todosQuery('tareas_orden'),
  archivosQuery,
  notasQuery,
  historialQuery,
];

/**
 * Hook para pre-cargar silenciosamente todos los datos críticos en background
 * Esto asegura que la caché de IndexedDB esté llena cuando el usuario se quede offline,
 * incluso si no visitó todas las pestañas de la app.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Sin sesión, RLS devuelve listas vacías y la reconciliación vaciaría el caché
    if (!isAuthenticated || !isOnline()) return;

    // Un pequeño delay para no competir con la carga de la pantalla actual
    const timer = setTimeout(() => {
      PREFETCH.forEach(query => {
        queryClient.prefetchQuery({ staleTime: 5 * 60 * 1000, ...query });
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [queryClient, isAuthenticated]);
}
