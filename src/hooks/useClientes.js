import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheData, cacheOne, getCachedData, getCachedById, removeCached, addPendingSync, isOnline, getPendingCount } from '../db/offlineService';
import useAppStore from '../store/useAppStore';

// Keys para react-query
export const CLIENTES_KEYS = {
  all: ['clientes'],
  detail: (id) => ['clientes', id],
};

// 1. Obtener todos los clientes
export function useClientes() {
  return useQuery({
    queryKey: CLIENTES_KEYS.all,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (error) throw new Error(error.message);
        
        // Cache en IndexedDB para uso offline
        await cacheData('clientes', data);
        return data;
      } catch (err) {
        // Fallback: leer desde cache offline
        if (!isOnline()) {
          const cached = await getCachedData('clientes');
          if (cached.length > 0) return cached;
        }
        throw err;
      }
    },
  });
}

// 2. Obtener un cliente por ID
export function useCliente(id) {
  return useQuery({
    queryKey: CLIENTES_KEYS.detail(id),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw new Error(error.message);
        
        await cacheOne('clientes', data);
        return data;
      } catch (err) {
        if (!isOnline()) {
          const cached = await getCachedById('clientes', id);
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: !!id,
  });
}

// 3. Crear cliente
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoCliente) => {
      if (!isOnline()) {
        // Offline: guardar localmente y encolar
        const tempId = crypto.randomUUID();
        const clienteConId = { ...nuevoCliente, id: tempId, created_at: new Date().toISOString() };
        await cacheOne('clientes', clienteConId);
        await addPendingSync('clientes', 'insert', nuevoCliente);
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Cliente guardado localmente');
        return clienteConId;
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([nuevoCliente])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      await cacheOne('clientes', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
    },
  });
}

// 4. Actualizar cliente
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...datos }) => {
      if (!isOnline()) {
        const updated = { id, ...datos };
        await cacheOne('clientes', updated);
        await addPendingSync('clientes', 'update', { id, ...datos });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Cambios guardados localmente');
        return updated;
      }

      const { data, error } = await supabase
        .from('clientes')
        .update(datos)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      await cacheOne('clientes', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.detail(data.id) });
    },
  });
}

// 5. Eliminar cliente
export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        await removeCached('clientes', id);
        await addPendingSync('clientes', 'delete', { id });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Eliminación pendiente de sincronizar');
        return id;
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      await removeCached('clientes', id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
      queryClient.removeQueries({ queryKey: CLIENTES_KEYS.detail(id) });
    },
  });
}
