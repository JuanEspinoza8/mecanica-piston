import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOne, getCachedData, getCachedById, getCachedByIndex, offlineCascadeDelete } from '../db/offlineService';
import { offlineQuery, offlineQueryOne, offlineMutation, insertarOffline, actualizarOffline, borrarOffline } from './offlineHelpers';

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

// Función auxiliar para mapear de UI (año) a BD (anio).
// `color` está en el formulario pero no tiene columna en la base.
// eslint-disable-next-line no-unused-vars
const mapToDB = ({ año, clienteId, color, ...rest }) => ({
  ...rest,
  anio: año,
  cliente_id: clienteId
});

const masNuevoPrimero = (a, b) => new Date(b.created_at) - new Date(a.created_at);

// Query de vehículos (opcionalmente de un cliente). Sin cliente es la lista
// completa, que también usa usePrefetch.
export function vehiculosQuery(clienteId = null) {
  return {
    queryKey: clienteId ? VEHICULOS_KEYS.list(clienteId) : VEHICULOS_KEYS.all,
    queryFn: offlineQuery({
      tabla: 'vehiculos',
      remoto: () => {
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
        if (clienteId) query = query.eq('cliente_id', clienteId);
        return query;
      },
      local: async () => {
        const cached = clienteId
          ? await getCachedByIndex('vehiculos', 'cliente_id', clienteId)
          : await getCachedData('vehiculos');
        return cached.sort(masNuevoPrimero);
      },
      alcance: clienteId ? { campo: 'cliente_id', valor: clienteId } : undefined,
      mapear: (vehiculos) => vehiculos.map(mapFromDB),
    }),
  };
}

// 1. Obtener vehículos (opcionalmente filtrados por cliente)
export function useVehiculos(clienteId = null) {
  return useQuery(vehiculosQuery(clienteId));
}

// 2. Obtener un vehículo por ID
export function useVehiculo(id) {
  return useQuery({
    queryKey: VEHICULOS_KEYS.detail(id),
    queryFn: offlineQueryOne({
      tabla: 'vehiculos',
      id,
      remoto: () => supabase
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
        .maybeSingle(),
      mapear: mapFromDB,
    }),
    enabled: !!id,
  });
}

// 3. Crear vehículo
export function useCreateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async (nuevoVehiculo) => {
        const { data, error } = await supabase
          .from('vehiculos')
          .insert([mapToDB(nuevoVehiculo)])
          .select()
          .single();
        if (error) throw new Error(error.message);
        await cacheOne('vehiculos', data);
        return mapFromDB(data);
      },
      offline: async (nuevoVehiculo) => {
        const dbVehiculo = mapToDB(nuevoVehiculo);
        // Datos del cliente anidados para que la lista se vea completa offline
        const cliente = dbVehiculo.cliente_id ? await getCachedById('clientes', dbVehiculo.cliente_id) : null;
        const local = await insertarOffline('vehiculos', dbVehiculo, {
          clientes: cliente ? { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido } : null,
        });
        return mapFromDB(local);
      },
      aviso: 'Vehículo guardado localmente',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
    },
  });
}

// 4. Actualizar vehículo
export function useUpdateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, ...datos }) => {
        const { data, error } = await supabase
          .from('vehiculos')
          .update(mapToDB(datos))
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        await cacheOne('vehiculos', data);
        return mapFromDB(data);
      },
      offline: async ({ id, ...datos }) => mapFromDB(await actualizarOffline('vehiculos', id, mapToDB(datos))),
      aviso: 'Cambios guardados localmente',
    }),
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
    mutationFn: offlineMutation({
      online: async (id) => {
        const { error } = await supabase
          .from('vehiculos')
          .delete()
          .eq('id', id);
        if (error) throw new Error(error.message);
        await offlineCascadeDelete('vehiculos', id);
        return id;
      },
      offline: async (id) => {
        await borrarOffline('vehiculos', id);
        return id;
      },
      aviso: 'Eliminación pendiente de sincronizar',
    }),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEYS.all });
      queryClient.removeQueries({ queryKey: VEHICULOS_KEYS.detail(id) });
    },
  });
}
