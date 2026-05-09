import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

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
      return data.map(mapFromDB);
    },
  });
}

// 2. Obtener un vehículo por ID
export function useVehiculo(id) {
  return useQuery({
    queryKey: VEHICULOS_KEYS.detail(id),
    queryFn: async () => {
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
      return mapFromDB(data);
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
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([dbVehiculo])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
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
      const { data, error } = await supabase
        .from('vehiculos')
        .update(dbVehiculo)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
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
      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
      queryClient.removeQueries({ queryKey: VEHICULOS_KEYS.detail(id) });
    },
  });
}
