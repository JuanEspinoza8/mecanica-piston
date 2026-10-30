import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { getCachedData, getCachedByIndex, isOnline, removeCached } from '../db/offlineService';
import { BUCKET_ARCHIVOS, SIGNED_URL_STALE_TIME, getSignedUrls } from '../lib/storage';
import { offlineQuery } from './offlineHelpers';
import { toast } from 'sonner';

export const ARCHIVOS_KEYS = {
  all: ['archivos'],
  orden: (ordenId) => ['archivos', 'orden', ordenId],
};

const masNuevoPrimero = (a, b) => new Date(b.created_at) - new Date(a.created_at);

// El bucket es privado: cada archivo se muestra con una URL firmada que se
// guarda también en el caché local para poder usarla sin conexión.
export async function conUrlsFirmadas(archivos) {
  const urls = await getSignedUrls(BUCKET_ARCHIVOS, archivos.map(a => a.ruta_storage));
  return archivos.map(a => ({ ...a, url: urls[a.ruta_storage] || null }));
}

// Query de todos los archivos (la usa usePrefetch para llenar el caché offline)
export const archivosQuery = {
  queryKey: ['archivos', 'all'],
  queryFn: offlineQuery({
    tabla: 'archivos',
    remoto: () => supabase.from('archivos').select('*'),
    preparar: conUrlsFirmadas,
    local: () => getCachedData('archivos'),
  }),
  staleTime: SIGNED_URL_STALE_TIME,
};

export function useArchivos(ordenId) {
  return useQuery({
    queryKey: ARCHIVOS_KEYS.orden(ordenId),
    queryFn: offlineQuery({
      tabla: 'archivos',
      remoto: () => supabase
        .from('archivos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false }),
      preparar: conUrlsFirmadas,
      local: async () => (await getCachedByIndex('archivos', 'orden_id', ordenId)).sort(masNuevoPrimero),
      alcance: { campo: 'orden_id', valor: ordenId },
    }),
    enabled: !!ordenId,
    staleTime: SIGNED_URL_STALE_TIME,
  });
}

// Archivos de todas las órdenes de un vehículo
export function useArchivosVehiculo(vehiculoId) {
  return useQuery({
    queryKey: ['archivos', 'vehiculo', vehiculoId],
    queryFn: async () => {
      // Órdenes del vehículo (para filtrar archivos y mostrar a qué orden pertenecen)
      const ordenes = await offlineQuery({
        remoto: () => supabase.from('ordenes_trabajo').select('id, descripcion').eq('vehiculo_id', vehiculoId),
        local: () => getCachedByIndex('ordenes_trabajo', 'vehiculo_id', vehiculoId),
      })();
      if (ordenes.length === 0) return [];

      const ordenIds = ordenes.map(o => o.id);
      const archivos = await offlineQuery({
        tabla: 'archivos',
        remoto: () => supabase
          .from('archivos')
          .select('*')
          .in('orden_id', ordenIds)
          .order('created_at', { ascending: false }),
        preparar: conUrlsFirmadas,
        // Antes devolvía una lista vacía sin conexión
        local: async () => {
          const ids = new Set(ordenIds);
          return (await getCachedData('archivos')).filter(a => ids.has(a.orden_id)).sort(masNuevoPrimero);
        },
        alcance: false,
      })();

      const ordenMap = Object.fromEntries(ordenes.map(o => [o.id, o.descripcion]));
      return archivos.map(archivo => ({
        ...archivo,
        ordenDescripcion: ordenMap[archivo.orden_id] || '',
        displayOrdenId: `ORD-${archivo.orden_id.substring(0, 4).toUpperCase()}`,
      }));
    },
    enabled: !!vehiculoId,
    staleTime: SIGNED_URL_STALE_TIME,
  });
}

// Subir y borrar archivos requiere conexión: las fotos y PDF de una orden no
// se guardan en la cola offline (los comprobantes de pago sí, ver usePagos).
export function useFileUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, ordenId, tipo }) => {
      if (!isOnline()) {
        toast.error('No se pueden subir archivos sin conexión');
        throw new Error('No se pueden subir archivos sin conexión');
      }

      let fileToUpload = file;

      // Validar documentos PDF
      if (tipo === 'documento') {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          throw new Error('Solo se aceptan archivos PDF como documentos');
        }
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
          throw new Error(`El archivo PDF no puede superar los ${maxSizeMB} MB`);
        }
      }

      // Comprimir solo si es imagen
      if (tipo === 'imagen' && file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.15,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp'
        };
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (error) {
          console.error("Error al comprimir imagen:", error);
        }
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${ordenId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_ARCHIVOS)
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('archivos')
        .insert([{
          orden_id: ordenId,
          nombre_archivo: file.name,
          ruta_storage: fileName,
          tipo: tipo
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.orden_id) {
        queryClient.invalidateQueries({ queryKey: ARCHIVOS_KEYS.orden(data.orden_id) });
      }
    },
  });
}

export function useDeleteArchivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archivo) => {
      if (!isOnline()) {
        toast.error('No se pueden eliminar archivos sin conexión');
        throw new Error('No se pueden eliminar archivos sin conexión');
      }

      const { error: storageError } = await supabase.storage
        .from(BUCKET_ARCHIVOS)
        .remove([archivo.ruta_storage]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('archivos')
        .delete()
        .eq('id', archivo.id);
      if (dbError) throw dbError;

      await removeCached('archivos', archivo.id);
      return archivo;
    },
    onSuccess: (archivo) => {
      if (archivo && archivo.orden_id) {
        queryClient.invalidateQueries({ queryKey: ARCHIVOS_KEYS.orden(archivo.orden_id) });
      }
    },
  });
}
