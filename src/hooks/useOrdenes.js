import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheData, cacheOne, getCachedData, getCachedById, getCachedByIndex, removeCached, addPendingSync, isOnline, getPendingCount, generateId } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { toast } from 'sonner';

// Keys para React Query
export const ORDENES_KEYS = {
  all: ['ordenes'],
  lists: () => [...ORDENES_KEYS.all, 'list'],
  list: (filters) => [...ORDENES_KEYS.lists(), { filters }],
  details: () => [...ORDENES_KEYS.all, 'detail'],
  detail: (id) => [...ORDENES_KEYS.details(), id],
  repuestos: (ordenId) => ['repuestos', ordenId],
  tareas: (ordenId) => ['tareas', ordenId],
};

// --- Mappers ---
const mapOrdenToDB = (orden) => {
  // eslint-disable-next-line no-unused-vars
  const { clienteId, vehiculoId, sintoma, ...rest } = orden;
  return {
    ...rest,
    vehiculo_id: vehiculoId,
    descripcion: sintoma,
  };
};

const mapOrdenFromDB = (orden) => {
  if (!orden) return null;
  const totalRepuestos = orden.repuestos?.reduce((sum, rep) => sum + (Number(rep.costo) * Number(rep.cantidad)), 0) || 0;
  return {
    ...orden,
    sintoma: orden.descripcion,
    vehiculoId: orden.vehiculo_id,
    cliente: orden.vehiculos?.clientes,
    vehiculo: orden.vehiculos,
    totalRepuestos,
  };
};

// --- Hooks de Órdenes ---

export function useOrdenes(vehiculoId) {
  return useQuery({
    queryKey: ORDENES_KEYS.list({ vehiculoId }),
    queryFn: async () => {
      if (!isOnline()) {
        let cached;
        if (vehiculoId) {
          cached = await getCachedByIndex('ordenes_trabajo', 'vehiculo_id', vehiculoId);
        } else {
          cached = await getCachedData('ordenes_trabajo');
        }
        return cached.map(mapOrdenFromDB);
      }

      try {
        let query = supabase
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

        if (vehiculoId) {
          query = query.eq('vehiculo_id', vehiculoId);
        }

        const { data, error } = await query;
        if (error) throw error;
        await cacheData('ordenes_trabajo', data);
        return data.map(mapOrdenFromDB);
      } catch (err) {
        throw err;
      }
    },
  });
}

export function useOrden(id) {
  return useQuery({
    queryKey: ORDENES_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      if (!isOnline()) {
        const cached = await getCachedById('ordenes_trabajo', id);
        return cached ? mapOrdenFromDB(cached) : null;
      }
      try {
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
          .eq('id', id)
          .single();

        if (error) throw error;
        await cacheOne('ordenes_trabajo', data);
        return mapOrdenFromDB(data);
      } catch (err) {
        throw err;
      }
    },
    enabled: !!id,
  });
}

export function useCreateOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaOrden) => {
      const dbOrden = mapOrdenToDB(nuevaOrden);

      if (!isOnline()) {
        const tempId = generateId();
        
        // Hidratar relaciones para la lista offline
        let vehiculoData = null;
        if (dbOrden.vehiculo_id) {
          const vehiculo = await getCachedById('vehiculos', dbOrden.vehiculo_id);
          if (vehiculo) {
            const cliente = await getCachedById('clientes', vehiculo.cliente_id);
            vehiculoData = {
              id: vehiculo.id,
              patente: vehiculo.patente,
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
              anio: vehiculo.anio,
              clientes: cliente ? {
                id: cliente.id,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                telefono: cliente.telefono
              } : null
            };
          }
        }

        const ordenConId = { 
          ...dbOrden, 
          id: tempId, 
          created_at: new Date().toISOString(), 
          estado: dbOrden.estado || 'Pendiente',
          vehiculos: vehiculoData // Anidado para mapOrdenFromDB
        };
        
        await cacheOne('ordenes_trabajo', ordenConId);
        await addPendingSync('ordenes_trabajo', 'insert', { ...dbOrden, id: tempId });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Orden guardada localmente');
        return ordenConId; // mapOrdenFromDB expects full nested object
      }

      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .insert([dbOrden])
        .select()
        .single();
      if (error) throw error;
      await cacheOne('ordenes_trabajo', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.all });
    },
  });
}

export function useUpdateOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const dbUpdates = mapOrdenToDB({ ...updates, vehiculoId: updates.vehiculoId || undefined });
      Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

      if (!isOnline()) {
        const cached = await getCachedById('ordenes_trabajo', id);
        const updated = { ...(cached || {}), ...dbUpdates, id };
        await cacheOne('ordenes_trabajo', updated);
        await addPendingSync('ordenes_trabajo', 'update', { id, ...dbUpdates });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Cambios guardados localmente');
        return updated;
      }

      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.detail(variables.id) });
    },
  });
}

// --- Hooks de Repuestos ---

export function useRepuestos(ordenId) {
  return useQuery({
    queryKey: ORDENES_KEYS.repuestos(ordenId),
    queryFn: async () => {
      if (!ordenId) return [];
      if (!isOnline()) {
        const cached = await getCachedByIndex('repuestos', 'orden_id', ordenId);
        return cached || [];
      }
      try {
        const { data, error } = await supabase
          .from('repuestos')
          .select('*')
          .eq('orden_id', ordenId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        await cacheData('repuestos', data);
        return data;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!ordenId,
  });
}

export function useAddRepuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevoRepuesto) => {
      const payload = {
        orden_id: nuevoRepuesto.ordenId,
        nombre: nuevoRepuesto.nombre,
        costo: nuevoRepuesto.costo,
        cantidad: nuevoRepuesto.cantidad
      };

      if (!isOnline()) {
        const tempId = generateId();
        const repConId = { ...payload, id: tempId, created_at: new Date().toISOString() };
        await cacheOne('repuestos', repConId);
        await addPendingSync('repuestos', 'insert', { ...payload, id: tempId });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Repuesto guardado localmente');
        return repConId;
      }

      const { data, error } = await supabase
        .from('repuestos')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      await cacheOne('repuestos', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.repuestos(variables.ordenId) });
    },
  });
}

export function useDeleteRepuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ordenId }) => {
      if (!isOnline()) {
        await removeCached('repuestos', id);
        await addPendingSync('repuestos', 'delete', { id });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Eliminación pendiente de sincronizar');
        return { orden_id: ordenId };
      }

      const { error, data } = await supabase
        .from('repuestos')
        .delete()
        .eq('id', id)
        .select('orden_id')
        .single();
      if (error) throw error;
      await removeCached('repuestos', id);
      return data;
    },
    onSuccess: (data) => {
      if (data && data.orden_id) {
        queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.repuestos(data.orden_id) });
      }
    },
  });
}

// --- Hooks de Tareas ---

export function useTareas(ordenId) {
  return useQuery({
    queryKey: ORDENES_KEYS.tareas(ordenId),
    queryFn: async () => {
      if (!ordenId) return [];
      if (!isOnline()) {
        const cached = await getCachedByIndex('tareas_orden', 'orden_id', ordenId);
        return cached || [];
      }
      try {
        const { data, error } = await supabase
          .from('tareas_orden')
          .select('*')
          .eq('orden_id', ordenId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        await cacheData('tareas_orden', data);
        return data;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!ordenId,
  });
}

export function useAddTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaTarea) => {
      const payload = {
        orden_id: nuevaTarea.ordenId,
        descripcion: nuevaTarea.descripcion,
        estado: nuevaTarea.estado || 'Pendiente'
      };

      if (!isOnline()) {
        const tempId = generateId();
        const tareaConId = { ...payload, id: tempId, created_at: new Date().toISOString() };
        await cacheOne('tareas_orden', tareaConId);
        await addPendingSync('tareas_orden', 'insert', { ...payload, id: tempId });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Tarea guardada localmente');
        return tareaConId;
      }

      const { data, error } = await supabase
        .from('tareas_orden')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.tareas(variables.ordenId) });
    },
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado, ordenId }) => {
      if (!isOnline()) {
        toast.warning('Sin conexión — El cambio se sincronizará al reconectar');
        return { id, orden_id: ordenId, estado };
      }

      const { data, error } = await supabase
        .from('tareas_orden')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.orden_id) {
        queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.tareas(data.orden_id) });
      }
    },
  });
}
