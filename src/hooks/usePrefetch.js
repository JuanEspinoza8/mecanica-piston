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
          staleTime: 5 * 60 * 1000 // 5 minutos
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

        // 3. Prefetch Órdenes (las más recientes)
        queryClient.prefetchQuery({
          queryKey: ORDENES_KEYS.list({ vehiculoId: undefined }), // Lista principal
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

        // 4. Prefetch Deudas (Para la pantalla de Finanzas)
        queryClient.prefetchQuery({
          queryKey: DEUDAS_KEYS.total,
          queryFn: async () => {
            const { data, error } = await supabase
              .from('deudas')
              .select('id, monto_total, monto_pagado')
              .in('estado', ['pendiente', 'parcial']);
            if (error) throw error;
            await cacheData('deudas', data);
            return data.reduce((sum, d) => sum + (Number(d.monto_total) - Number(d.monto_pagado)), 0);
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
