import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export const ARCHIVOS_KEYS = {
  all: ['archivos'],
  orden: (ordenId) => ['archivos', 'orden', ordenId],
};

export function useArchivos(ordenId) {
  return useQuery({
    queryKey: ARCHIVOS_KEYS.orden(ordenId),
    queryFn: async () => {
      if (!ordenId) return [];
      const { data, error } = await supabase
        .from('archivos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Obtener URLs públicas para cada archivo
      return data.map(archivo => {
        const { data: publicUrlData } = supabase.storage
          .from('archivos')
          .getPublicUrl(archivo.ruta_storage);
          
        return {
          ...archivo,
          url: publicUrlData.publicUrl
        };
      });
    },
    enabled: !!ordenId,
  });
}

export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, ordenId, tipo }) => {
      let fileToUpload = file;
      
      // Comprimir solo si es imagen (no PDF)
      if (tipo === 'imagen' && file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.15, // ~150 KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp'
        };
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (error) {
          console.error("Error al comprimir imagen:", error);
          // Si falla, subimos la original
        }
      }

      // Nombre único
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${ordenId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('archivos')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      // Guardar en tabla
      const { data, error: dbError } = await supabase
        .from('archivos')
        .insert([{
          orden_id: ordenId,
          nombre_archivo: file.name,
          ruta_storage: fileName,
          tipo: tipo // 'imagen' o 'documento'
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
      // Borrar de storage primero
      const { error: storageError } = await supabase.storage
        .from('archivos')
        .remove([archivo.ruta_storage]);
        
      if (storageError) throw storageError;

      // Borrar de DB
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
