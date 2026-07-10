import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheData, getCachedData, isOnline } from '../db/offlineService';
import { matchesSearch } from '../lib/utils';

// Hook interno para implementar debounce (retraso en la búsqueda al escribir)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Carga clientes y vehículos (online desde Supabase, offline desde caché) una
 * sola vez y los mantiene cacheados. El filtrado se hace en memoria para poder
 * ignorar acentos, mayúsculas y espacios, y así funciona también sin conexión.
 */
function useSearchSource() {
  return useQuery({
    queryKey: ['search-source'],
    queryFn: async () => {
      if (!isOnline()) {
        const [clientes, vehiculos] = await Promise.all([
          getCachedData('clientes'),
          getCachedData('vehiculos'),
        ]);
        return { clientes: clientes || [], vehiculos: vehiculos || [] };
      }

      try {
        const [clientesRes, vehiculosRes] = await Promise.all([
          supabase.from('clientes').select('*'),
          supabase.from('vehiculos').select('*, clientes ( id, nombre, apellido )'),
        ]);
        if (clientesRes.error) throw clientesRes.error;
        if (vehiculosRes.error) throw vehiculosRes.error;

        const clientes = clientesRes.data || [];
        const vehiculos = vehiculosRes.data || [];
        // Refrescar caché para uso offline
        await Promise.all([
          cacheData('clientes', clientes),
          cacheData('vehiculos', vehiculos),
        ]);
        return { clientes, vehiculos };
      } catch (err) {
        // Fallback a caché si falla la red
        const [clientes, vehiculos] = await Promise.all([
          getCachedData('clientes'),
          getCachedData('vehiculos'),
        ]);
        if ((clientes && clientes.length) || (vehiculos && vehiculos.length)) {
          return { clientes: clientes || [], vehiculos: vehiculos || [] };
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar globalmente clientes y vehículos.
 * Tolerante a acentos, mayúsculas, espacios/puntuación y orden de palabras.
 * @param {string} query - Término de búsqueda
 */
export function useSearch(query) {
  const debouncedQuery = useDebounce(query, 250);
  const { data, isLoading, isFetching } = useSearchSource();

  const resultados = useMemo(() => {
    const q = (debouncedQuery || '').trim();
    if (q.length < 2) return { clientes: [], vehiculos: [] };

    const clientes = (data?.clientes || [])
      .filter(c => matchesSearch(
        `${c.nombre || ''} ${c.apellido || ''} ${c.telefono || ''} ${c.email || ''}`,
        q
      ))
      .slice(0, 10);

    const vehiculos = (data?.vehiculos || [])
      .filter(v => matchesSearch(
        `${v.marca || ''} ${v.modelo || ''} ${v.patente || ''} ` +
        `${v.clientes?.nombre || ''} ${v.clientes?.apellido || ''}`,
        q
      ))
      .slice(0, 10);

    return { clientes, vehiculos };
  }, [data, debouncedQuery]);

  return {
    data: resultados,
    // Cargando solo mientras no haya datos base todavía
    isLoading: isLoading || (isFetching && !data),
  };
}
