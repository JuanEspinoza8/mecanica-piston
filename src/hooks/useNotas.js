import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheOne, getCachedData, removeCached } from '../db/offlineService';
import { offlineQuery, offlineMutation, insertarOffline, actualizarOffline, borrarOffline } from './offlineHelpers';

const NOTAS_KEYS = {
  all: ['notas'],
};

// Pendientes primero, luego completadas, ambas por fecha DESC
const pendientesPrimero = (a, b) => {
  if (a.completada !== b.completada) return a.completada ? 1 : -1;
  return new Date(b.created_at) - new Date(a.created_at);
};

// Lista de notas (también la usa usePrefetch)
export const notasQuery = {
  queryKey: NOTAS_KEYS.all,
  queryFn: offlineQuery({
    tabla: 'notas',
    remoto: () => supabase
      .from('notas')
      .select('*')
      .order('completada', { ascending: true })
      .order('created_at', { ascending: false }),
    local: async () => (await getCachedData('notas')).sort(pendientesPrimero),
  }),
};

export function useNotas() {
  return useQuery(notasQuery);
}

// Crear nota
export function useCreateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (texto) => {
      if (!texto || texto.trim().length === 0) throw new Error('El texto es obligatorio');
      if (texto.length > 200) throw new Error('Máximo 200 caracteres');

      return offlineMutation({
        online: async (payload) => {
          const { data, error } = await supabase
            .from('notas')
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          await cacheOne('notas', data);
          return data;
        },
        offline: (payload) => insertarOffline('notas', payload),
      })({ texto: texto.trim(), completada: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTAS_KEYS.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la nota');
    },
  });
}

// Toggle completada/pendiente
export function useToggleNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, completada }) => {
        const { data, error } = await supabase
          .from('notas')
          .update({ completada: !completada })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await cacheOne('notas', data);
        return data;
      },
      offline: ({ id, completada }) => actualizarOffline('notas', id, { completada: !completada }),
      tabla: 'notas',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTAS_KEYS.all });
    },
    onError: () => {
      toast.error('Error al actualizar la nota');
    },
  });
}

// Eliminar nota
export function useDeleteNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async (id) => {
        const { error } = await supabase
          .from('notas')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await removeCached('notas', id);
        return id;
      },
      offline: async (id) => {
        await borrarOffline('notas', id);
        return id;
      },
      tabla: 'notas',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTAS_KEYS.all });
      toast.success('Nota eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la nota');
    },
  });
}
