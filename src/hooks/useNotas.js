import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheData, getCachedData, getCachedById, cacheOne, removeCached, addPendingSync, isOnline, getPendingCount } from '../db/offlineService';
import useAppStore from '../store/useAppStore';

const NOTAS_KEYS = {
  all: ['notas'],
};

// Lista de notas: pendientes primero, luego completadas, ambas por fecha DESC
export function useNotas() {
  return useQuery({
    queryKey: NOTAS_KEYS.all,
    queryFn: async () => {
      if (!isOnline()) {
        const cached = await getCachedData('notas');
        if (cached.length > 0) {
          return cached.sort((a, b) => {
            if (a.completada !== b.completada) return a.completada ? 1 : -1;
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        return [];
      }
      try {
        const { data, error } = await supabase
          .from('notas')
          .select('*')
          .order('completada', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        await cacheData('notas', data);
        return data;
      } catch (err) {
        throw err;
      }
    },
  });
}

// Crear nota
export function useCreateNota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (texto) => {
      if (!texto || texto.trim().length === 0) throw new Error('El texto es obligatorio');
      if (texto.length > 200) throw new Error('Máximo 200 caracteres');

      const payload = { texto: texto.trim(), completada: false };

      if (!isOnline()) {
        const tempId = crypto.randomUUID();
        const offlineData = { ...payload, id: tempId, created_at: new Date().toISOString() };
        await addPendingSync('notas', 'insert', { ...payload, id: tempId });
        const count = await getPendingCount();
        useAppStore.getState().setPendingSyncCount(count);
        // Cache locally for immediate display
        await cacheOne('notas', offlineData);
        return offlineData;
      }

      const { data, error } = await supabase
        .from('notas')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      await cacheOne('notas', data);
      return data;
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
    mutationFn: async ({ id, completada }) => {
      if (!isOnline()) {
        const nota = await getCachedById('notas', id);
        if (nota) {
          await cacheOne('notas', { ...nota, completada: !completada });
        }
        await addPendingSync('notas', 'update', { id, completada: !completada });
        const count = await getPendingCount();
        useAppStore.getState().setPendingSyncCount(count);
        return { id, completada: !completada };
      }

      const { data, error } = await supabase
        .from('notas')
        .update({ completada: !completada })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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
    mutationFn: async (id) => {
      if (!isOnline()) {
        await removeCached('notas', id);
        await addPendingSync('notas', 'delete', { id });
        const count = await getPendingCount();
        useAppStore.getState().setPendingSyncCount(count);
        return id;
      }

      const { error } = await supabase
        .from('notas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await removeCached('notas', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTAS_KEYS.all });
      toast.success('Nota eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar la nota');
    },
  });
}
