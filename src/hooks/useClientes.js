import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// 2. Obtener un cliente por ID
export function useCliente(id) {
  return useQuery({
    queryKey: CLIENTES_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id, // Solo se ejecuta si hay ID
  });
}

// 3. Crear cliente
export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoCliente) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert([nuevoCliente])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
      // El toast se puede manejar aquí o en el componente (lo hacemos en el componente por convención actual)
    },
  });
}

// 4. Actualizar cliente
export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...datos }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(datos)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
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
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEYS.all });
      queryClient.removeQueries({ queryKey: CLIENTES_KEYS.detail(id) });
    },
  });
}
