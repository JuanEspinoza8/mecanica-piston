import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheData, cacheOne, getCachedByIndex, getCachedById, addPendingSync, removeCached, isOnline, getPendingCount, generateId } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { DEUDAS_KEYS } from './useDeudas';

// Hook para obtener el historial de pagos de un cliente
export function usePagos(clienteId) {
  return useQuery({
    queryKey: ['pagos', clienteId],
    queryFn: async () => {
      if (!isOnline()) {
        const cached = await getCachedByIndex('pagos', 'cliente_id', clienteId);
        return cached || [];
      }
      try {
        const { data, error } = await supabase
          .from('pagos')
          .select('*, deudas(id, concepto, monto_total, en_cuotas, cantidad_cuotas)')
          .eq('cliente_id', clienteId)
          .order('fecha', { ascending: false });

        if (error) throw error;
        await cacheData('pagos', data);
        return data;
      } catch (err) {
        const cached = await getCachedByIndex('pagos', 'cliente_id', clienteId);
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    },
    enabled: !!clienteId,
  });
}

// Hook para registrar un nuevo pago vinculado a una deuda
export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ archivoPDF, metodo, deuda_id, ...pagoData }) => {
      const monto = parseFloat(String(pagoData.monto).replace(/\./g, '').replace(',', '.'));

      // --- OFFLINE ---
      if (!isOnline()) {
        if (archivoPDF) {
          toast.warning('El comprobante PDF se subirá cuando haya conexión');
        }

        const tempId = generateId();
        const payload = {
          cliente_id: pagoData.cliente_id,
          deuda_id: deuda_id || null,
          orden_id: pagoData.orden_id || null,
          monto,
          metodo_pago: metodo,
          comprobante_url: null,
          nota: pagoData.nota || null,
          fecha: pagoData.fecha,
        };
        
        let deudaData = null;
        if (deuda_id) {
          const deuda = await getCachedById('deudas', deuda_id);
          if (deuda) {
            deudaData = {
              id: deuda.id,
              concepto: deuda.concepto,
              monto_total: deuda.monto_total,
              en_cuotas: deuda.en_cuotas,
              cantidad_cuotas: deuda.cantidad_cuotas
            };
            
            const nuevoMontoPagado = Number(deuda.monto_pagado || 0) + monto;
            const nuevoEstado = nuevoMontoPagado >= Number(deuda.monto_total) ? 'pagada' : 'parcial';
            
            // Actualizar Deuda localmente para reflejar el pago offline
            await cacheOne('deudas', { ...deuda, monto_pagado: nuevoMontoPagado, estado: nuevoEstado });
            // Encolar actualización de deuda
            await addPendingSync('deudas', 'update', { id: deuda_id, monto_pagado: nuevoMontoPagado, estado: nuevoEstado });
          }
        }

        const pagoConId = { 
          ...payload, 
          id: tempId, 
          created_at: new Date().toISOString(),
          deudas: deudaData
        };
        
        await cacheOne('pagos', pagoConId);
        await addPendingSync('pagos', 'insert', { ...payload, id: tempId });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Pago guardado localmente');
        return pagoConId;
      }

      // --- ONLINE ---
      let comprobante_url = null;

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

        const { data: { publicUrl } } = supabase.storage
          .from('archivos_pagos')
          .getPublicUrl(filePath);

        comprobante_url = publicUrl;
      }

      const payload = {
        cliente_id: pagoData.cliente_id,
        deuda_id: deuda_id || null,
        orden_id: pagoData.orden_id || null,
        monto,
        metodo_pago: metodo,
        comprobante_url,
        nota: pagoData.nota || null,
        fecha: pagoData.fecha,
      };

      const { data, error } = await supabase
        .from('pagos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Si el pago está vinculado a una deuda, actualizar monto_pagado y estado
      if (deuda_id) {
        const { data: deuda } = await supabase
          .from('deudas')
          .select('monto_total, monto_pagado')
          .eq('id', deuda_id)
          .single();

        if (deuda) {
          const nuevoMontoPagado = Number(deuda.monto_pagado) + monto;
          const nuevoEstado = nuevoMontoPagado >= Number(deuda.monto_total) ? 'pagada' : 'parcial';

          await supabase
            .from('deudas')
            .update({
              monto_pagado: Math.min(nuevoMontoPagado, Number(deuda.monto_total)),
              estado: nuevoEstado,
            })
            .eq('id', deuda_id);
        }
      }

      await cacheOne('pagos', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pagos', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['saldo', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
      if (isOnline()) toast.success('Pago registrado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Ocurrió un error al registrar el pago');
    }
  });
}

// Hook para eliminar un pago
export function useDeletePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cliente_id, deuda_id, monto }) => {
      if (!isOnline()) {
        await removeCached('pagos', id);
        await addPendingSync('pagos', 'delete', { id });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Eliminación pendiente de sincronizar');
        return { id, cliente_id };
      }

      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Si estaba vinculado a una deuda, revertir el monto_pagado
      if (deuda_id) {
        const { data: deuda } = await supabase
          .from('deudas')
          .select('monto_total, monto_pagado')
          .eq('id', deuda_id)
          .single();

        if (deuda) {
          const nuevoMontoPagado = Math.max(0, Number(deuda.monto_pagado) - Number(monto));
          const nuevoEstado = nuevoMontoPagado <= 0 ? 'pendiente' : 'parcial';

          await supabase
            .from('deudas')
            .update({ monto_pagado: nuevoMontoPagado, estado: nuevoEstado })
            .eq('id', deuda_id);
        }
      }

      await removeCached('pagos', id);
      return { id, cliente_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pagos', data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['saldo', data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['economia'] });
      if (isOnline()) toast.success('Pago eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el pago');
    },
  });
}
