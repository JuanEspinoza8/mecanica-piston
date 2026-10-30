import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCachedData, getCachedByIndex } from '../db/offlineService';
import { offlineQuery } from './offlineHelpers';

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

// Formato que espera HistorialTimeline
const mapItem = (item) => ({
  id: item.id,
  tipo: mapTipoAccion(item.tipo_accion),
  titulo: item.tipo_accion,
  descripcion: item.descripcion,
  fecha: item.created_at,
  vehiculo: item.vehiculos || null,
  vehiculo_id: item.vehiculo_id,
});

const ultimos = (items, cantidad) => [...items]
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  .slice(0, cantidad);

// Query de todo el historial (la usa usePrefetch para llenar el caché offline)
export const historialQuery = {
  queryKey: ['historial', 'all'],
  queryFn: offlineQuery({
    tabla: 'historial_modificaciones',
    remoto: () => supabase
      .from('historial_modificaciones')
      .select('*')
      .order('created_at', { ascending: false }),
    local: () => getCachedData('historial_modificaciones'),
  }),
};

/**
 * Historial de modificaciones de un vehículo.
 * Consume la tabla historial_modificaciones filtrada por vehiculo_id.
 */
export function useHistorialModificaciones(vehiculoId) {
  return useQuery({
    queryKey: HISTORIAL_KEYS.vehiculo(vehiculoId),
    queryFn: offlineQuery({
      tabla: 'historial_modificaciones',
      remoto: () => supabase
        .from('historial_modificaciones')
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .order('created_at', { ascending: false })
        .limit(50),
      local: () => getCachedByIndex('historial_modificaciones', 'vehiculo_id', vehiculoId),
      // Consulta con limit: guarda sin reconciliar
      alcance: false,
      mapear: (items) => ultimos(items, 50).map(mapItem),
    }),
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
    queryFn: offlineQuery({
      tabla: 'historial_modificaciones',
      remoto: () => supabase
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
        .limit(10),
      local: () => getCachedData('historial_modificaciones'),
      alcance: false,
      mapear: (items) => ultimos(items, 10).map(mapItem),
    }),
  });
}
