import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Hook para obtener el historial de pagos de un cliente
export function usePagos(clienteId) {
  return useQuery({
    queryKey: ['pagos', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

// Hook para obtener el saldo de un cliente (vía RPC)
export function useSaldoCliente(clienteId) {
  return useQuery({
    queryKey: ['saldo', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_saldo_cliente', { p_cliente_id: clienteId });

      if (error) throw error;
      return data || 0;
    },
    enabled: !!clienteId,
  });
}

// Hook para registrar un nuevo pago
export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ archivoPDF, metodo, ...pagoData }) => {
      let comprobante_url = null;

      // Si hay un archivo PDF, lo subimos al bucket "archivos_pagos"
      if (archivoPDF) {
        const fileExt = archivoPDF.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${pagoData.cliente_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('archivos_pagos')
          .upload(filePath, archivoPDF);

        if (uploadError) {
          throw new Error('Error al subir el comprobante: ' + uploadError.message);
        }

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('archivos_pagos')
          .getPublicUrl(filePath);

        comprobante_url = publicUrl;
      }

      // Sanitizar datos para la base de datos
      const payload = { 
        ...pagoData, 
        metodo_pago: metodo, 
        comprobante_url,
        monto: parseFloat(String(pagoData.monto).replace(/\./g, '')), // Quitar formato "15.000"
        cuota_actual: pagoData.es_cuota ? parseInt(pagoData.cuota_actual, 10) : null, // Evitar mandar string vacío ""
        total_cuotas: pagoData.es_cuota ? parseInt(pagoData.total_cuotas, 10) : null, // Evitar mandar string vacío ""
      };

      // Insertamos el pago en la base de datos
      const { data, error } = await supabase
        .from('pagos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['pagos', variables.cliente_id]);
      queryClient.invalidateQueries(['saldo', variables.cliente_id]);
      toast.success('Pago registrado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Ocurrió un error al registrar el pago');
    }
  });
}
