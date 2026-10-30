import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOne, getCachedData, getCachedById, getCachedByIndex, removeCached, offlineCascadeDelete, deleteOrdenEnServidor } from '../db/offlineService';
import { offlineQuery, offlineQueryOne, offlineMutation, insertarOffline, actualizarOffline, borrarOffline } from './offlineHelpers';

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

const ORDEN_SELECT = `
  *,
  vehiculos (
    id, patente, marca, modelo, anio,
    clientes ( id, nombre, apellido, telefono )
  ),
  repuestos ( costo, cantidad )
`;

const masNuevoPrimero = (a, b) => new Date(b.created_at) - new Date(a.created_at);
const masViejoPrimero = (a, b) => new Date(a.created_at) - new Date(b.created_at);

// --- Hooks de Órdenes ---

// Query de órdenes (opcionalmente de un vehículo). Sin vehículo es la lista
// completa, que también usa usePrefetch.
export function ordenesQuery(vehiculoId) {
  return {
    queryKey: ORDENES_KEYS.list({ vehiculoId }),
    queryFn: offlineQuery({
      tabla: 'ordenes_trabajo',
      remoto: () => {
        let query = supabase
          .from('ordenes_trabajo')
          .select(ORDEN_SELECT)
          .order('created_at', { ascending: false });
        if (vehiculoId) query = query.eq('vehiculo_id', vehiculoId);
        return query;
      },
      local: async () => {
        const cached = vehiculoId
          ? await getCachedByIndex('ordenes_trabajo', 'vehiculo_id', vehiculoId)
          : await getCachedData('ordenes_trabajo');
        return cached.sort(masNuevoPrimero);
      },
      alcance: vehiculoId ? { campo: 'vehiculo_id', valor: vehiculoId } : undefined,
      mapear: (ordenes) => ordenes.map(mapOrdenFromDB),
    }),
  };
}

export function useOrdenes(vehiculoId) {
  return useQuery(ordenesQuery(vehiculoId));
}

export function useOrden(id) {
  return useQuery({
    queryKey: ORDENES_KEYS.detail(id),
    queryFn: offlineQueryOne({
      tabla: 'ordenes_trabajo',
      id,
      remoto: () => supabase.from('ordenes_trabajo').select(ORDEN_SELECT).eq('id', id).maybeSingle(),
      mapear: mapOrdenFromDB,
    }),
    enabled: !!id,
  });
}

export function useCreateOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async (nuevaOrden) => {
        const { data, error } = await supabase
          .from('ordenes_trabajo')
          .insert([mapOrdenToDB(nuevaOrden)])
          .select()
          .single();
        if (error) throw error;
        await cacheOne('ordenes_trabajo', data);
        return data;
      },
      offline: async (nuevaOrden) => {
        const dbOrden = mapOrdenToDB(nuevaOrden);

        // Hidratar relaciones para la lista offline (mapOrdenFromDB espera el objeto anidado)
        let vehiculos = null;
        const vehiculo = dbOrden.vehiculo_id ? await getCachedById('vehiculos', dbOrden.vehiculo_id) : null;
        if (vehiculo) {
          const cliente = await getCachedById('clientes', vehiculo.cliente_id);
          vehiculos = {
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

        return insertarOffline('ordenes_trabajo', dbOrden, {
          estado: dbOrden.estado || 'Pendiente',
          vehiculos,
        });
      },
      aviso: 'Orden guardada localmente',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['historial'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
    },
  });
}

const cambiosOrdenToDB = (updates) => {
  const dbUpdates = mapOrdenToDB({ ...updates, vehiculoId: updates.vehiculoId || undefined });
  Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
  return dbUpdates;
};

export function useUpdateOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from('ordenes_trabajo')
          .update(cambiosOrdenToDB(updates))
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      offline: ({ id, ...updates }) => actualizarOffline('ordenes_trabajo', id, cambiosOrdenToDB(updates)),
      aviso: 'Cambios guardados localmente',
    }),
    onSuccess: (data, variables) => {
      // Aplicar el cambio al detalle ya cargado (conserva los joins) para que
      // la pantalla no muestre el valor viejo mientras se vuelve a pedir.
      queryClient.setQueryData(ORDENES_KEYS.detail(variables.id), (anterior) =>
        anterior ? mapOrdenFromDB({ ...anterior, ...data }) : anterior
      );
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['historial'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
    },
  });
}

export function useDeleteOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      // Tareas, repuestos y archivos se borran por CASCADE; deudas y pagos
      // se conservan sin orden (SET NULL).
      online: async (id) => {
        await deleteOrdenEnServidor(id);
        await offlineCascadeDelete('ordenes_trabajo', id);
        return id;
      },
      offline: async (id) => {
        await borrarOffline('ordenes_trabajo', id);
        return id;
      },
      aviso: 'Eliminación de orden pendiente de sincronizar',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['deudas'] });
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['historial'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
    },
  });
}

// --- Hooks de Repuestos ---

export function useRepuestos(ordenId) {
  return useQuery({
    queryKey: ORDENES_KEYS.repuestos(ordenId),
    queryFn: offlineQuery({
      tabla: 'repuestos',
      remoto: () => supabase
        .from('repuestos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true }),
      local: async () => (await getCachedByIndex('repuestos', 'orden_id', ordenId)).sort(masViejoPrimero),
      alcance: { campo: 'orden_id', valor: ordenId },
    }),
    enabled: !!ordenId,
  });
}

const repuestoToDB = (nuevoRepuesto) => ({
  orden_id: nuevoRepuesto.ordenId,
  nombre: nuevoRepuesto.nombre,
  costo: nuevoRepuesto.costo,
  cantidad: nuevoRepuesto.cantidad
});

export function useAddRepuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async (nuevoRepuesto) => {
        const { data, error } = await supabase
          .from('repuestos')
          .insert([repuestoToDB(nuevoRepuesto)])
          .select()
          .single();
        if (error) throw error;
        await cacheOne('repuestos', data);
        return data;
      },
      offline: (nuevoRepuesto) => insertarOffline('repuestos', repuestoToDB(nuevoRepuesto)),
      aviso: 'Repuesto guardado localmente',
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.repuestos(variables.ordenId) });
    },
  });
}

export function useDeleteRepuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id }) => {
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
      offline: async ({ id, ordenId }) => {
        await borrarOffline('repuestos', id);
        return { orden_id: ordenId };
      },
      aviso: 'Eliminación pendiente de sincronizar',
    }),
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
    queryFn: offlineQuery({
      tabla: 'tareas_orden',
      remoto: () => supabase
        .from('tareas_orden')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true }),
      local: async () => (await getCachedByIndex('tareas_orden', 'orden_id', ordenId)).sort(masViejoPrimero),
      alcance: { campo: 'orden_id', valor: ordenId },
    }),
    enabled: !!ordenId,
  });
}

const tareaToDB = (nuevaTarea) => ({
  orden_id: nuevaTarea.ordenId,
  descripcion: nuevaTarea.descripcion,
  estado: nuevaTarea.estado || 'Pendiente'
});

export function useAddTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async (nuevaTarea) => {
        const { data, error } = await supabase
          .from('tareas_orden')
          .insert([tareaToDB(nuevaTarea)])
          .select()
          .single();
        if (error) throw error;
        await cacheOne('tareas_orden', data);
        return data;
      },
      offline: (nuevaTarea) => insertarOffline('tareas_orden', tareaToDB(nuevaTarea)),
      aviso: 'Tarea guardada localmente',
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.tareas(variables.ordenId) });
    },
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id, estado }) => {
        const { data, error } = await supabase
          .from('tareas_orden')
          .update({ estado })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        await cacheOne('tareas_orden', data);
        return data;
      },
      offline: async ({ id, estado, ordenId }) => {
        await actualizarOffline('tareas_orden', id, { estado });
        return { id, orden_id: ordenId, estado };
      },
      aviso: 'Cambio guardado localmente',
    }),
    onSuccess: (data) => {
      if (data && data.orden_id) {
        queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.tareas(data.orden_id) });
      }
    },
  });
}

export function useDeleteTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: offlineMutation({
      online: async ({ id }) => {
        const { error, data } = await supabase
          .from('tareas_orden')
          .delete()
          .eq('id', id)
          .select('orden_id')
          .single();
        if (error) throw error;
        await removeCached('tareas_orden', id);
        return data;
      },
      offline: async ({ id, ordenId }) => {
        await borrarOffline('tareas_orden', id);
        return { orden_id: ordenId };
      },
      aviso: 'Eliminación pendiente de sincronizar',
    }),
    onSuccess: (data) => {
      if (data && data.orden_id) {
        queryClient.invalidateQueries({ queryKey: ORDENES_KEYS.tareas(data.orden_id) });
      }
    },
  });
}
