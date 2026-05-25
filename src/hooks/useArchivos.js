import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { cacheData, getCachedByIndex, isOnline } from '../db/offlineService';
import { toast } from 'sonner';

export const ARCHIVOS_KEYS = {
  all: ['archivos'],
  orden: (ordenId) => ['archivos', 'orden', ordenId],
};

export function useArchivos(ordenId) {
  return useQuery({
    queryKey: ARCHIVOS_KEYS.orden(ordenId),
    queryFn: async () => {
      if (!ordenId) return [];
      if (!isOnline()) {
        const cached = await getCachedByIndex('archivos', 'orden_id', ordenId);
        // URLs won't work offline but at least metadata is available
        return cached.map(a => ({ ...a, url: a.ruta_storage || '' }));
      }
      try {
        const { data, error } = await supabase
          .from('archivos')
          .select('*')
          .eq('orden_id', ordenId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Cache for offline
        await cacheData('archivos', data);

        return data.map(archivo => {
          const { data: publicUrlData } = supabase.storage
            .from('archivos')
            .getPublicUrl(archivo.ruta_storage);
          return { ...archivo, url: publicUrlData.publicUrl };
        });
      } catch (err) {
        const cached = await getCachedByIndex('archivos', 'orden_id', ordenId);
        if (cached && cached.length > 0) return cached.map(a => ({ ...a, url: a.ruta_storage || '' }));
        throw err;
      }
    },
    enabled: !!ordenId,
  });
}

// Archivos de todas las órdenes de un vehículo
export function useArchivosVehiculo(vehiculoId) {
  return useQuery({
    queryKey: ['archivos', 'vehiculo', vehiculoId],
    queryFn: async () => {
      if (!vehiculoId) return [];
      if (!isOnline()) {
        // Fallback since offline caching of complex join is hard
        return [];
      }
      try {
        const { data: ordenes } = await supabase
          .from('ordenes_trabajo')
          .select('id, descripcion')
          .eq('vehiculo_id', vehiculoId);
        if (!ordenes || ordenes.length === 0) return [];

        const ordenIds = ordenes.map(o => o.id);
        const { data, error } = await supabase
          .from('archivos')
          .select('*')
          .in('orden_id', ordenIds)
          .order('created_at', { ascending: false });
        if (error) throw error;

        await cacheData('archivos', data);

        const ordenMap = Object.fromEntries(ordenes.map(o => [o.id, o.descripcion]));
        return data.map(archivo => {
          const { data: publicUrlData } = supabase.storage
            .from('archivos')
            .getPublicUrl(archivo.ruta_storage);
          return {
            ...archivo,
            url: publicUrlData.publicUrl,
            ordenDescripcion: ordenMap[archivo.orden_id] || '',
            displayOrdenId: `ORD-${archivo.orden_id.substring(0, 4).toUpperCase()}`,
          };
        });
      } catch (err) {
        // Fallback for offline if network request fails despite isOnline() being true
        return [];
      }
    },
    enabled: !!vehiculoId,
  });
}

export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, ordenId, tipo, repuestoId }) => {
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
      const prefix = repuestoId ? `rep_${repuestoId}_` : '';
      const fileName = `${ordenId}/${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('archivos')
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
        .from('archivos')
        .remove([archivo.ruta_storage]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('archivos')
        .delete()
        .eq('id', archivo.id);
      if (dbError) throw dbError;
      
      return archivo;
    },
    onSuccess: (archivo) => {
      if (archivo && archivo.orden_id) {
        queryClient.invalidateQueries({ queryKey: ARCHIVOS_KEYS.orden(archivo.orden_id) });
      }
    },
  });
}
