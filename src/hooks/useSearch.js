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
 * Normaliza un texto para búsqueda tolerante:
 * - Quita acentos/tildes (é → e, ñ → n)
 * - Convierte a minúsculas
 * - Quita espacios extras
 */
function normalizeForSearch(text) {
  return text
    .normalize('NFD')                    // Separa letras de sus acentos
    .replace(/[\u0300-\u036f]/g, '')     // Elimina los acentos
    .toLowerCase()
    .trim();
}

/**
 * Hook para buscar globalmente clientes y vehículos
 * Búsqueda inteligente: case-insensitive, ignora acentos, 
 * y para patentes ignora espacios (aaa123 encuentra AAA 123)
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

      // Normalizar el término (quitar acentos para comparación)
      const normalizedQuery = normalizeForSearch(debouncedQuery);
      const searchTerm = `%${normalizedQuery}%`;

      // Versión sin espacios para búsqueda de patentes
      // Así "aaa123" matchea con "AAA 123" y "AA A1 23", etc.
      const searchTermNoSpaces = `%${normalizedQuery.replace(/\s/g, '')}%`;

      // 2. Buscar en la tabla de clientes (nombre, apellido, o teléfono)
      // Usamos ilike que es case-insensitive en PostgreSQL
      const { data: clientesRaw, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},telefono.ilike.${searchTerm}`)
        .limit(10);

      if (errorClientes) throw errorClientes;

      // Filtro adicional client-side para acentos (Supabase ilike no los ignora)
      // Ej: buscar "perez" encontrará "Pérez" 
      const clientes = (clientesRaw || []).filter(c => {
        const nombre = normalizeForSearch(c.nombre || '');
        const apellido = normalizeForSearch(c.apellido || '');
        const telefono = (c.telefono || '').toLowerCase();
        return nombre.includes(normalizedQuery) || 
               apellido.includes(normalizedQuery) || 
               telefono.includes(normalizedQuery);
      });

      // 3. Buscar en la tabla de vehículos (patente, marca o modelo)
      // Para patente: buscamos con y sin espacios
      const { data: vehiculosRaw, error: errorVehiculos } = await supabase
        .from('vehiculos')
        .select(`
          *,
          clientes (
            nombre,
            apellido
          )
        `)
        .or(`patente.ilike.${searchTerm},patente.ilike.${searchTermNoSpaces},modelo.ilike.${searchTerm},marca.ilike.${searchTerm}`)
        .limit(10);

      if (errorVehiculos) throw errorVehiculos;

      // Filtro adicional client-side para:
      // - Acentos en marca/modelo
      // - Patentes sin espacios (ej: usuario escribe "aaa123", BD tiene "AAA 123")
      const vehiculos = (vehiculosRaw || []).filter(v => {
        const patenteSinEspacios = normalizeForSearch((v.patente || '').replace(/\s/g, ''));
        const querySinEspacios = normalizedQuery.replace(/\s/g, '');
        const modelo = normalizeForSearch(v.modelo || '');
        const marca = normalizeForSearch(v.marca || '');
        
        return patenteSinEspacios.includes(querySinEspacios) || 
               modelo.includes(normalizedQuery) || 
               marca.includes(normalizedQuery);
      });

      // 4. Retornar agrupados
      return {
        clientes: clientes,
        vehiculos: vehiculos
      };
    },
    // Solo habilitar la query real de red si hay texto suficiente
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos para búsquedas iguales
  });
}
