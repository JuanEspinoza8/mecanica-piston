import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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
    // clienteId no va a la BD, se deduce por vehiculo_id
  };
};

const mapOrdenFromDB = (orden) => {
  if (!orden) return null;
  
  // Calcular total (repuestos)
  // En una app real también sumaríamos mano de obra si existiese en la BD
  const totalRepuestos = orden.repuestos?.reduce((sum, rep) => sum + (Number(rep.costo) * Number(rep.cantidad)), 0) || 0;

  return {
    ...orden,
    sintoma: orden.descripcion, // para UI
    vehiculoId: orden.vehiculo_id,
    // Mapear info relacional si viene
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
      let query = supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          vehiculos (
            id,
            patente,
            marca,
            modelo,
            anio,
            clientes (
              id,
              nombre,
              apellido,
              telefono
            )
          ),
          repuestos (
            costo,
            cantidad
          )
        `)
        .order('created_at', { ascending: false });

      if (vehiculoId) {
        query = query.eq('vehiculo_id', vehiculoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapOrdenFromDB);
    },
  });
}

export function useOrden(id) {
  return useQuery({
    queryKey: ORDENES_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          vehiculos (
            id,
            patente,
            marca,
            modelo,
            anio,
            clientes (
              id,
              nombre,
              apellido,
              telefono
            )
          ),
          repuestos (
            costo,
            cantidad
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapOrdenFromDB(data);
    },
    enabled: !!id,
  });
}

export function useCreateOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaOrden) => {
      const dbOrden = mapOrdenToDB(nuevaOrden);
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .insert([dbOrden])
        .select()
        .single();
      if (error) throw error;
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
      // Limpiar undefined
      Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

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
      const { data, error } = await supabase
        .from('repuestos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ordenId,
  });
}

export function useAddRepuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevoRepuesto) => {
      const { data, error } = await supabase
        .from('repuestos')
        .insert([{
          orden_id: nuevoRepuesto.ordenId,
          nombre: nuevoRepuesto.nombre,
          costo: nuevoRepuesto.costo,
          cantidad: nuevoRepuesto.cantidad
        }])
        .select()
        .single();
      if (error) throw error;
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
    mutationFn: async (id) => {
      const { error, data } = await supabase
        .from('repuestos')
        .delete()
        .eq('id', id)
        .select('orden_id')
        .single();
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('tareas_orden')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ordenId,
  });
}

export function useAddTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaTarea) => {
      const { data, error } = await supabase
        .from('tareas_orden')
        .insert([{
          orden_id: nuevaTarea.ordenId,
          descripcion: nuevaTarea.descripcion,
          estado: nuevaTarea.estado || 'Pendiente'
        }])
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
    mutationFn: async ({ id, estado }) => {
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
