import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { isOnline, cacheData } from '../db/offlineService';

// Import keys to use for prefetching
import { CLIENTES_KEYS } from './useClientes';
import { VEHICULOS_KEYS } from './useVehiculos';
import { ORDENES_KEYS } from './useOrdenes';
import { DEUDAS_KEYS } from './useDeudas';

/**
 * Hook para pre-cargar silenciosamente todos los datos críticos en background
 * Esto asegura que la caché de IndexedDB esté llena cuando el usuario se quede offline,
 * incluso si no visitó todas las pestañas de la app.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOnline()) return;

    const prefetchData = async () => {
      try {
        // 1. Prefetch Clientes
        queryClient.prefetchQuery({
          queryKey: CLIENTES_KEYS.all,
          queryFn: async () => {
            const { data, error } = await supabase.from('clientes').select('*').order('nombre');
            if (error) throw error;
            await cacheData('clientes', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 2. Prefetch Vehículos
        queryClient.prefetchQuery({
          queryKey: VEHICULOS_KEYS.all,
          queryFn: async () => {
            const { data, error } = await supabase
              .from('vehiculos')
              .select('*, clientes (id, nombre, apellido)')
              .order('created_at', { ascending: false });
            if (error) throw error;
            await cacheData('vehiculos', data);
            return data.map(v => {
              const { anio, cliente_id, clientes, ...rest } = v;
              return { ...rest, año: anio, clienteId: cliente_id, cliente: clientes || null };
            });
          },
          staleTime: 5 * 60 * 1000
        });

        // 3. Prefetch Órdenes de Trabajo (y sus dependencias)
        queryClient.prefetchQuery({
          queryKey: ORDENES_KEYS.list({ vehiculoId: undefined }),
          queryFn: async () => {
            const { data, error } = await supabase
              .from('ordenes_trabajo')
              .select(`
                *,
                vehiculos (
                  id, patente, marca, modelo, anio,
                  clientes ( id, nombre, apellido, telefono )
                ),
                repuestos ( costo, cantidad )
              `)
              .order('created_at', { ascending: false });
            if (error) throw error;
            await cacheData('ordenes_trabajo', data);
            return data.map(orden => {
              const totalRepuestos = orden.repuestos?.reduce((sum, rep) => sum + (Number(rep.costo) * Number(rep.cantidad)), 0) || 0;
              return {
                ...orden,
                sintoma: orden.descripcion,
                vehiculoId: orden.vehiculo_id,
                cliente: orden.vehiculos?.clientes,
                vehiculo: orden.vehiculos,
                totalRepuestos,
              };
            });
          },
          staleTime: 5 * 60 * 1000
        });

        // 4. Prefetch Deudas
        queryClient.prefetchQuery({
          queryKey: DEUDAS_KEYS.all,
          queryFn: async () => {
            const { data, error } = await supabase
              .from('deudas')
              .select('*, clientes (id, nombre, apellido)')
              .order('created_at', { ascending: false });
            if (error) throw error;
            await cacheData('deudas', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 5. Prefetch Pagos
        queryClient.prefetchQuery({
          queryKey: ['pagos', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('pagos')
              .select('*')
              .order('fecha', { ascending: false });
            if (error) throw error;
            await cacheData('pagos', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 6. Prefetch Repuestos
        queryClient.prefetchQuery({
          queryKey: ['repuestos', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('repuestos')
              .select('*');
            if (error) throw error;
            await cacheData('repuestos', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 7. Prefetch Tareas
        queryClient.prefetchQuery({
          queryKey: ['tareas_orden', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('tareas_orden')
              .select('*');
            if (error) throw error;
            await cacheData('tareas_orden', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 8. Prefetch Archivos
        queryClient.prefetchQuery({
          queryKey: ['archivos', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('archivos')
              .select('*');
            if (error) throw error;
            await cacheData('archivos', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 9. Prefetch Notas
        queryClient.prefetchQuery({
          queryKey: ['notas', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('notas')
              .select('*');
            if (error) throw error;
            await cacheData('notas', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

        // 10. Prefetch Historial
        queryClient.prefetchQuery({
          queryKey: ['historial', 'all'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('historial_modificaciones')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) throw error;
            await cacheData('historial_modificaciones', data);
            return data;
          },
          staleTime: 5 * 60 * 1000
        });

      } catch (error) {
        console.error('Error prefetching data for offline cache:', error);
      }
    };

    // Ejecutar prefetch inicial, usando un pequeño delay para no bloquear el renderizado principal
    const timer = setTimeout(prefetchData, 2000);

    return () => clearTimeout(timer);
  }, [queryClient]);
}
