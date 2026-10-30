import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOne, getCachedData, offlineCascadeDelete } from '../db/offlineService';
import { offlineQuery, offlineQueryOne, offlineMutation, insertarOffline, actualizarOffline, borrarOffline } from './offlineHelpers';

// Keys para react-query
export const CLIENTES_KEYS = {
  all: ['clientes'],
  detail: (id) => ['clientes', id],
};

const porNombre = (a, b) => (a.nombre || '').localeCompare(b.nombre || '');

// Query de la lista completa (también la usa usePrefetch)
export const clientesQuery = {
  queryKey: CLIENTES_KEYS.all,
  queryFn: offlineQuery({
    tabla: 'clientes',
    remoto: () => supabase.from('clientes').select('*').order('nombre', { ascending: true }),
    local: async () => (await getCachedData('clientes')).sort(porNombre),
  }),
};

// 1. Obtener todos los clientes
export function useClientes() {
  return useQuery(clientesQuery);
}

// 2. Obtener un cliente por ID
export function useCliente(id) {
  return useQuery({
    queryKey: CLIENTES_KEYS.detail(id),
    queryFn: offlineQueryOne({
      tabla: 'clientes',
      id,
      remoto: () => supabase.from('clientes').select('*').eq('id', id).maybeSingle(),
    }),
    enabled: !!id,
  });
}

// 3. Crear cliente
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async (nuevoCliente) => {
        const { data, error } = await supabase
          .from('clientes')
          .insert([nuevoCliente])
          .select()
          .single();
        if (error) throw new Error(error.message);
        await cacheOne('clientes', data);
        return data;
      },
      offline: (nuevoCliente) => insertarOffline('clientes', nuevoCliente),
      aviso: 'Cliente guardado localmente',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
    },
  });
}

// 4. Actualizar cliente
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, ...datos }) => {
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
      offline: ({ id, ...datos }) => actualizarOffline('clientes', id, datos),
      aviso: 'Cambios guardados localmente',
      tabla: 'clientes',
    }),
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
    mutationFn: offlineMutation({
      online: async (id) => {
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', id);
        if (error) throw new Error(error.message);
        await offlineCascadeDelete('clientes', id);
        return id;
      },
      offline: async (id) => {
        await borrarOffline('clientes', id);
        return id;
      },
      aviso: 'Eliminación pendiente de sincronizar',
      tabla: 'clientes',
    }),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
      queryClient.removeQueries({ queryKey: CLIENTES_KEYS.detail(id) });
    },
  });
}
