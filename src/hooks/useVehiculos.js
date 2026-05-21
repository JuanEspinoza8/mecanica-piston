import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheData, cacheOne, getCachedData, getCachedById, getCachedByIndex, removeCached, offlineCascadeDelete, addPendingSync, isOnline, getPendingCount, generateId } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { toast } from 'sonner';

// Keys para react-query
export const VEHICULOS_KEYS = {
  all: ['vehiculos'],
  list: (clienteId) => ['vehiculos', { clienteId }],
  detail: (id) => ['vehiculos', id],
};

// Función auxiliar para mapear de BD (anio) a UI (año)
const mapFromDB = (vehiculo) => {
  if (!vehiculo) return null;
  const { anio, cliente_id, clientes, ...rest } = vehiculo;
  return {
    ...rest,
    año: anio,
    clienteId: cliente_id,
    cliente: clientes || null // si se hizo JOIN
  };
};

// Función auxiliar para mapear de UI (año) a BD (anio)
const mapToDB = (vehiculo) => {
  const { año, clienteId, color, ...rest } = vehiculo;
  return {
    ...rest,
    anio: año,
    cliente_id: clienteId
  };
};

// 1. Obtener vehículos (opcionalmente filtrados por cliente)
export function useVehiculos(clienteId = null) {
  return useQuery({
    queryKey: clienteId ? VEHICULOS_KEYS.list(clienteId) : VEHICULOS_KEYS.all,
    queryFn: async () => {
      if (!isOnline()) {
        let cached;
        if (clienteId) {
          cached = await getCachedByIndex('vehiculos', 'cliente_id', clienteId);
        } else {
          cached = await getCachedData('vehiculos');
        }
        return cached.map(mapFromDB);
      }
      try {
        let query = supabase
          .from('vehiculos')
          .select(`
            *,
            clientes (
              id,
              nombre,
              apellido
            )
          `)
          .order('created_at', { ascending: false });
        
        if (clienteId) {
          query = query.eq('cliente_id', clienteId);
        }

        const { data, error } = await query;
        
        if (error) throw new Error(error.message);
        
        // Cache raw data (antes del map) para offline
        await cacheData('vehiculos', data);
        return data.map(mapFromDB);
      } catch (err) {
        let cached;
        if (clienteId) {
          cached = await getCachedByIndex('vehiculos', 'cliente_id', clienteId);
        } else {
          cached = await getCachedData('vehiculos');
        }
        if (cached && cached.length > 0) return cached.map(mapFromDB);
        throw err;
      }
    },
  });
}

// 2. Obtener un vehículo por ID
export function useVehiculo(id) {
  return useQuery({
    queryKey: VEHICULOS_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      if (!isOnline()) {
        const cached = await getCachedById('vehiculos', id);
        return cached ? mapFromDB(cached) : null;
      }
      try {
        const { data, error } = await supabase
          .from('vehiculos')
          .select(`
            *,
            clientes (
              id,
              nombre,
              apellido,
              telefono,
              email
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) throw new Error(error.message);
        
        await cacheOne('vehiculos', data);
        return mapFromDB(data);
      } catch (err) {
        const cached = await getCachedById('vehiculos', id);
        if (cached) return mapFromDB(cached);
        throw err;
      }
    },
    enabled: !!id,
  });
}

// 3. Crear vehículo
export function useCreateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoVehiculo) => {
      const dbVehiculo = mapToDB(nuevoVehiculo);

      if (!isOnline()) {
        const tempId = generateId();
        
        let clienteData = null;
        if (dbVehiculo.cliente_id) {
          const cliente = await getCachedById('clientes', dbVehiculo.cliente_id);
          if (cliente) {
            clienteData = {
              id: cliente.id,
              nombre: cliente.nombre,
              apellido: cliente.apellido
            };
          }
        }
        
        const vehiculoConId = { 
          ...dbVehiculo, 
          id: tempId, 
          created_at: new Date().toISOString(),
          clientes: clienteData
        };
        
        await cacheOne('vehiculos', vehiculoConId);
        await addPendingSync('vehiculos', 'insert', { ...dbVehiculo, id: tempId });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Vehículo guardado localmente');
        return mapFromDB(vehiculoConId);
      }

      const { data, error } = await supabase
        .from('vehiculos')
        .insert([dbVehiculo])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      await cacheOne('vehiculos', data);
      return mapFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
    },
  });
}

// 4. Actualizar vehículo
export function useUpdateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...datos }) => {
      const dbVehiculo = mapToDB(datos);

      if (!isOnline()) {
        const updated = { ...dbVehiculo, id };
        await cacheOne('vehiculos', updated);
        await addPendingSync('vehiculos', 'update', { id, ...dbVehiculo });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Cambios guardados localmente');
        return mapFromDB(updated);
      }

      const { data, error } = await supabase
        .from('vehiculos')
        .update(dbVehiculo)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      await cacheOne('vehiculos', data);
      return mapFromDB(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.detail(data.id) });
    },
  });
}

// 5. Eliminar vehículo
export function useDeleteVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        await offlineCascadeDelete('vehiculos', id);
        await addPendingSync('vehiculos', 'delete', { id });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Eliminación pendiente de sincronizar');
        return id;
      }

      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      await removeCached('vehiculos', id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
      queryClient.removeQueries({ queryKey: VEHICULOS_KEYS.detail(id) });
    },
  });
}
