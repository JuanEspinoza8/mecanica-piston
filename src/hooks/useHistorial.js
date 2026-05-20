import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheData, getCachedData, getCachedByIndex, isOnline } from '../db/offlineService';

export const HISTORIAL_KEYS = {
  vehiculo: (vehiculoId) => ['historial', vehiculoId],
  reciente: ['historial', 'reciente'],
};

// Mapear tipo_accion de BD a tipo de ícono del componente HistorialTimeline
const mapTipoAccion = (tipoAccion) => {
  const lower = tipoAccion?.toLowerCase() || '';
  if (lower.includes('creada') || lower.includes('nueva')) return 'reparacion';
  if (lower.includes('cerrada') || lower.includes('terminad') || lower.includes('entregad') || lower.includes('completad')) return 'completado';
  if (lower.includes('esperando') || lower.includes('alerta') || lower.includes('eliminad')) return 'alerta';
  return 'nota';
};

/**
 * Historial de modificaciones de un vehículo.
 * Consume la tabla historial_modificaciones filtrada por vehiculo_id.
 */
export function useHistorialModificaciones(vehiculoId) {
  return useQuery({
    queryKey: HISTORIAL_KEYS.vehiculo(vehiculoId),
    queryFn: async () => {
      if (!vehiculoId) return [];

      try {
        const { data, error } = await supabase
          .from('historial_modificaciones')
          .select('*')
          .eq('vehiculo_id', vehiculoId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Cache en IndexedDB
        await cacheData('historial_modificaciones', data);

        // Mapear al formato que espera HistorialTimeline
        return data.map((item) => ({
          id: item.id,
          tipo: mapTipoAccion(item.tipo_accion),
          titulo: item.tipo_accion,
          descripcion: item.descripcion,
          fecha: item.created_at,
        }));
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedByIndex('historial_modificaciones', 'vehiculo_id', vehiculoId);
          if (cached.length > 0) {
            return cached
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 50)
              .map((item) => ({
                id: item.id,
                tipo: mapTipoAccion(item.tipo_accion),
                titulo: item.tipo_accion,
                descripcion: item.descripcion,
                fecha: item.created_at,
              }));
          }
        }
        throw err;
      }
    },
    enabled: !!vehiculoId,
  });
}

/**
 * Actividad reciente global (para el Dashboard).
 * Trae los últimos 10 registros de historial sin filtrar por vehículo.
 */
export function useActividadReciente() {
  return useQuery({
    queryKey: HISTORIAL_KEYS.reciente,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('historial_modificaciones')
          .select(`
            *,
            vehiculos (
              id,
              patente,
              marca,
              modelo
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Cache raw data
        await cacheData('historial_modificaciones', data);

        return data.map((item) => ({
          id: item.id,
          tipo: mapTipoAccion(item.tipo_accion),
          titulo: item.tipo_accion,
          descripcion: item.descripcion,
          fecha: item.created_at,
          vehiculo: item.vehiculos,
          vehiculo_id: item.vehiculo_id,
        }));
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedData('historial_modificaciones');
          if (cached.length > 0) {
            return cached
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 10)
              .map((item) => ({
                id: item.id,
                tipo: mapTipoAccion(item.tipo_accion),
                titulo: item.tipo_accion,
                descripcion: item.descripcion,
                fecha: item.created_at,
                vehiculo: item.vehiculos || null,
                vehiculo_id: item.vehiculo_id,
              }));
          }
        }
        throw err;
      }
    },
  });
}
