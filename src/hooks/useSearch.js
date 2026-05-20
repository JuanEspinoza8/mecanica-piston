import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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
 * Hook para buscar globalmente clientes y vehículos
 * @param {string} query - Término de búsqueda
 */
export function useSearch(query) {
  // Aplicamos debounce de 300ms a la query
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      // 1. Validar que tenga al menos 2 caracteres
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { clientes: [], vehiculos: [] };
      }

      // Preparar el término para la búsqueda ILIKE (no distingue mayúsculas/minúsculas y busca en cualquier parte de la cadena)
      const searchTerm = `%${debouncedQuery}%`;

      // 2. Buscar en la tabla de clientes (nombre, apellido, o teléfono)
      const { data: clientes, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},telefono.ilike.${searchTerm}`)
        .limit(10); // Limitamos a 10 resultados para no sobrecargar el dropdown

      if (errorClientes) throw errorClientes;

      // 3. Buscar en la tabla de vehículos (patente, marca o modelo)
      // Hacemos un JOIN implícito para traer también los datos básicos del dueño
      const { data: vehiculos, error: errorVehiculos } = await supabase
        .from('vehiculos')
        .select(`
          *,
          clientes (
            nombre,
            apellido
          )
        `)
        .or(`patente.ilike.${searchTerm},modelo.ilike.${searchTerm},marca.ilike.${searchTerm}`)
        .limit(10);

      if (errorVehiculos) throw errorVehiculos;

      // 4. Retornar agrupados
      return {
        clientes: clientes || [],
        vehiculos: vehiculos || []
      };
    },
    // Solo habilitar la query real de red si hay texto suficiente
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos para búsquedas iguales
  });
}
