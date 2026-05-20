import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheData, getCachedData, getCachedByIndex, removeCached, addPendingSync, isOnline, getPendingCount } from '../db/offlineService';
import useAppStore from '../store/useAppStore';

export const DEUDAS_KEYS = {
  all: ['deudas'],
  cliente: (clienteId) => ['deudas', 'cliente', clienteId],
  orden: (ordenId) => ['deudas', 'orden', ordenId],
  total: ['deudas', 'total'],
};

// Deudas de un cliente
export function useDeudas(clienteId) {
  return useQuery({
    queryKey: DEUDAS_KEYS.cliente(clienteId),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('*, ordenes_trabajo(id, descripcion, vehiculos(patente, marca, modelo))')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        await cacheData('deudas', data);
        return data;
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedByIndex('deudas', 'cliente_id', clienteId);
          if (cached.length > 0) return cached;
        }
        throw err;
      }
    },
    enabled: !!clienteId,
  });
}

// Deudas pendientes de un cliente (para selector de pago)
export function useDeudasPendientes(clienteId) {
  return useQuery({
    queryKey: [...DEUDAS_KEYS.cliente(clienteId), 'pendientes'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('*, ordenes_trabajo(id, descripcion, vehiculos(patente, marca, modelo))')
          .eq('cliente_id', clienteId)
          .in('estado', ['pendiente', 'parcial'])
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedByIndex('deudas', 'cliente_id', clienteId);
          return cached.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');
        }
        throw err;
      }
    },
    enabled: !!clienteId,
  });
}

// Deudas de una orden específica
export function useDeudasOrden(ordenId) {
  return useQuery({
    queryKey: DEUDAS_KEYS.orden(ordenId),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .eq('orden_id', ordenId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        await cacheData('deudas', data);
        return data;
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedByIndex('deudas', 'orden_id', ordenId);
          if (cached.length > 0) return cached;
        }
        throw err;
      }
    },
    enabled: !!ordenId,
  });
}

// Deudas asociadas a órdenes de un vehículo
export function useDeudasVehiculo(vehiculoId) {
  return useQuery({
    queryKey: ['deudas', 'vehiculo', vehiculoId],
    queryFn: async () => {
      try {
        const { data: ordenes } = await supabase
          .from('ordenes_trabajo')
          .select('id')
          .eq('vehiculo_id', vehiculoId);
        if (!ordenes || ordenes.length === 0) return [];
        const ordenIds = ordenes.map(o => o.id);
        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .in('orden_id', ordenIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        await cacheData('deudas', data);
        return data;
      } catch (err) {
        if (!isOnline()) {
          // Fallback: get all cached deudas (can't filter by vehicle offline easily)
          const cached = await getCachedData('deudas');
          return cached;
        }
        throw err;
      }
    },
    enabled: !!vehiculoId,
  });
}

// Crear deuda
export function useCreateDeuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cliente_id, orden_id, concepto, monto_total, en_cuotas, cantidad_cuotas }) => {
      const payload = {
        cliente_id,
        orden_id: orden_id || null,
        concepto,
        monto_total: parseFloat(monto_total),
        monto_pagado: 0,
        en_cuotas: en_cuotas || false,
        cantidad_cuotas: en_cuotas ? parseInt(cantidad_cuotas) : 1,
        estado: 'pendiente',
      };

      if (!isOnline()) {
        const offlineId = crypto.randomUUID();
        const offlineData = { ...payload, id: offlineId, created_at: new Date().toISOString() };
        await addPendingSync('deudas', 'insert', payload);
        const count = await getPendingCount();
        useAppStore.getState().setPendingSyncCount(count);
        return offlineData;
      }

      const { data, error } = await supabase
        .from('deudas')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['saldo', data.cliente_id] });
      toast.success('Deuda registrada correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la deuda');
    },
  });
}

// Eliminar deuda
export function useDeleteDeuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cliente_id }) => {
      if (!isOnline()) {
        await removeCached('deudas', id);
        await addPendingSync('deudas', 'delete', { id });
        const count = await getPendingCount();
        useAppStore.getState().setPendingSyncCount(count);
        return { id, cliente_id };
      }

      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, cliente_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['saldo', data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
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
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_saldo_cliente', { p_cliente_id: clienteId });
        if (error) throw error;
        return data || 0;
      } catch (err) {
        if (!isOnline()) {
          // Calcular saldo offline desde cache
          const deudas = await getCachedByIndex('deudas', 'cliente_id', clienteId);
          return deudas.reduce((sum, d) => sum + (Number(d.monto_total) - Number(d.monto_pagado)), 0);
        }
        throw err;
      }
    },
    enabled: !!clienteId,
  });
}

// Deuda total global (para Dashboard)
export function useDeudaTotal() {
  return useQuery({
    queryKey: DEUDAS_KEYS.total,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('monto_total, monto_pagado')
          .in('estado', ['pendiente', 'parcial']);
        if (error) throw error;
        await cacheData('deudas', data);
        return data.reduce((sum, d) => sum + (Number(d.monto_total) - Number(d.monto_pagado)), 0);
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedData('deudas');
          const pendientes = cached.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');
          return pendientes.reduce((sum, d) => sum + (Number(d.monto_total) - Number(d.monto_pagado)), 0);
        }
        throw err;
      }
    },
  });
}
