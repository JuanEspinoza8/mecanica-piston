import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheOne, getCachedData, getCachedById, getCachedByIndex, offlineCascadeDelete } from '../db/offlineService';
import { offlineQuery, offlineMutation, insertarOffline, borrarOffline } from './offlineHelpers';

export const DEUDAS_KEYS = {
  all: ['deudas'],
  cliente: (clienteId) => ['deudas', 'cliente', clienteId],
  orden: (ordenId) => ['deudas', 'orden', ordenId],
  total: ['deudas', 'total'],
};

const DEUDA_CON_ORDEN = '*, ordenes_trabajo(id, descripcion, vehiculos(patente, marca, modelo))';
const estaPendiente = (d) => d.estado === 'pendiente' || d.estado === 'parcial';
const saldo = (d) => Number(d.monto_total || 0) - Number(d.monto_pagado || 0);
const masNuevoPrimero = (a, b) => new Date(b.created_at) - new Date(a.created_at);

// Query de todas las deudas (la usa usePrefetch para llenar el caché offline)
export const deudasQuery = {
  queryKey: DEUDAS_KEYS.all,
  queryFn: offlineQuery({
    tabla: 'deudas',
    remoto: () => supabase
      .from('deudas')
      .select('*, clientes (id, nombre, apellido)')
      .order('created_at', { ascending: false }),
    local: async () => (await getCachedData('deudas')).sort(masNuevoPrimero),
  }),
};

// Deudas de un cliente
export function useDeudas(clienteId) {
  return useQuery({
    queryKey: DEUDAS_KEYS.cliente(clienteId),
    queryFn: offlineQuery({
      tabla: 'deudas',
      remoto: () => supabase
        .from('deudas')
        .select(DEUDA_CON_ORDEN)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false }),
      local: async () => (await getCachedByIndex('deudas', 'cliente_id', clienteId)).sort(masNuevoPrimero),
      alcance: { campo: 'cliente_id', valor: clienteId },
    }),
    enabled: !!clienteId,
  });
}

// Deudas pendientes de un cliente (para selector de pago)
export function useDeudasPendientes(clienteId) {
  return useQuery({
    queryKey: [...DEUDAS_KEYS.cliente(clienteId), 'pendientes'],
    queryFn: offlineQuery({
      tabla: 'deudas',
      remoto: () => supabase
        .from('deudas')
        .select(DEUDA_CON_ORDEN)
        .eq('cliente_id', clienteId)
        .in('estado', ['pendiente', 'parcial'])
        .order('created_at', { ascending: false }),
      local: async () => (await getCachedByIndex('deudas', 'cliente_id', clienteId))
        .filter(estaPendiente)
        .sort(masNuevoPrimero),
      // Filtra por estado: es una parte de las deudas del cliente, no se reconcilia
      alcance: false,
    }),
    enabled: !!clienteId,
  });
}

// Deudas de una orden específica
export function useDeudasOrden(ordenId) {
  return useQuery({
    queryKey: DEUDAS_KEYS.orden(ordenId),
    queryFn: offlineQuery({
      tabla: 'deudas',
      remoto: () => supabase
        .from('deudas')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false }),
      local: async () => (await getCachedByIndex('deudas', 'orden_id', ordenId)).sort(masNuevoPrimero),
      alcance: { campo: 'orden_id', valor: ordenId },
    }),
    enabled: !!ordenId,
  });
}

// Deudas asociadas a órdenes de un vehículo
export function useDeudasVehiculo(vehiculoId) {
  return useQuery({
    queryKey: ['deudas', 'vehiculo', vehiculoId],
    queryFn: offlineQuery({
      tabla: 'deudas',
      remoto: async () => {
        const { data: ordenes, error } = await supabase
          .from('ordenes_trabajo')
          .select('id')
          .eq('vehiculo_id', vehiculoId);
        if (error || ordenes.length === 0) return { data: [], error };
        return supabase
          .from('deudas')
          .select('*')
          .in('orden_id', ordenes.map(o => o.id))
          .order('created_at', { ascending: false });
      },
      // Antes devolvía todas las deudas del caché, de cualquier vehículo
      local: async () => {
        const ordenes = await getCachedByIndex('ordenes_trabajo', 'vehiculo_id', vehiculoId);
        const ordenIds = new Set(ordenes.map(o => o.id));
        return (await getCachedData('deudas')).filter(d => ordenIds.has(d.orden_id)).sort(masNuevoPrimero);
      },
      alcance: false,
    }),
    enabled: !!vehiculoId,
  });
}

// Crear deuda
export function useCreateDeuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async (datos) => {
        const { data, error } = await supabase
          .from('deudas')
          .insert([deudaToDB(datos)])
          .select()
          .single();
        if (error) throw error;
        await cacheOne('deudas', data);
        return data;
      },
      offline: async (datos) => {
        const payload = deudaToDB(datos);

        // Orden y vehículo anidados para que la tarjeta se vea completa offline
        let ordenes_trabajo = null;
        const orden = payload.orden_id ? await getCachedById('ordenes_trabajo', payload.orden_id) : null;
        if (orden) {
          const vehiculo = orden.vehiculo_id ? await getCachedById('vehiculos', orden.vehiculo_id) : null;
          ordenes_trabajo = {
            id: orden.id,
            descripcion: orden.descripcion,
            vehiculos: vehiculo ? { patente: vehiculo.patente, marca: vehiculo.marca, modelo: vehiculo.modelo } : null,
          };
        }

        return insertarOffline('deudas', payload, { ordenes_trabajo });
      },
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['saldo', data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
      toast.success('Deuda registrada correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la deuda');
    },
  });
}

// monto_pagado y estado los calcula Postgres a partir de los pagos
// (migración 003); acá se mandan solo como valor inicial para la copia local.
function deudaToDB({ cliente_id, orden_id, concepto, monto_total, en_cuotas, cantidad_cuotas }) {
  return {
    cliente_id,
    orden_id: orden_id || null,
    concepto,
    monto_total: parseFloat(monto_total),
    monto_pagado: 0,
    en_cuotas: en_cuotas || false,
    cantidad_cuotas: en_cuotas ? parseInt(cantidad_cuotas) : 1,
    estado: 'pendiente',
  };
}

// Eliminar deuda. Sus pagos se conservan sin deuda (ON DELETE SET NULL).
export function useDeleteDeuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, cliente_id }) => {
        const { error } = await supabase
          .from('deudas')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await offlineCascadeDelete('deudas', id);
        return { id, cliente_id };
      },
      offline: async ({ id, cliente_id }) => {
        await borrarOffline('deudas', id);
        return { id, cliente_id };
      },
      tabla: 'deudas',
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['saldo', data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
      toast.success('Deuda eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la deuda');
    },
  });
}

// Saldo total del cliente basado en deudas
export function useSaldoCliente(clienteId) {
  return useQuery({
    queryKey: ['saldo', clienteId],
    queryFn: offlineQuery({
      remoto: () => supabase.rpc('get_saldo_cliente', { p_cliente_id: clienteId }),
      local: async () => (await getCachedByIndex('deudas', 'cliente_id', clienteId))
        .filter(estaPendiente)
        .reduce((sum, d) => sum + saldo(d), 0),
      mapear: (total) => Number(total) || 0,
    }),
    enabled: !!clienteId,
  });
}

// Deuda total global (para Dashboard)
export function useDeudaTotal() {
  return useQuery({
    queryKey: DEUDAS_KEYS.total,
    queryFn: offlineQuery({
      remoto: () => supabase
        .from('deudas')
        .select('monto_total, monto_pagado')
        .in('estado', ['pendiente', 'parcial']),
      local: async () => (await getCachedData('deudas')).filter(estaPendiente),
      mapear: (deudas) => deudas.reduce((sum, d) => sum + saldo(d), 0),
    }),
  });
}
