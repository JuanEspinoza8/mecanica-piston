import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cacheData, cacheOne, getCachedByIndex, getCachedById, addPendingSync, addPendingUpload, removeCached, isOnline, getPendingCount, generateId } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { BUCKET_COMPROBANTES, SIGNED_URL_STALE_TIME, comprobantePath, getSignedUrls } from '../lib/storage';
import { DEUDAS_KEYS } from './useDeudas';

// El bucket de comprobantes es privado: se firma una URL por cada pago que
// tenga comprobante. Sin conexión no hay URL y el PDF no se puede abrir.
async function conComprobantesFirmados(pagos) {
  const urls = await getSignedUrls(BUCKET_COMPROBANTES, pagos.map(p => comprobantePath(p.comprobante_url)));
  return pagos.map(p => ({ ...p, comprobante_signed_url: urls[comprobantePath(p.comprobante_url)] || null }));
}

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
        return conComprobantesFirmados(data);
      } catch (err) {
        const cached = await getCachedByIndex('pagos', 'cliente_id', clienteId);
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    },
    enabled: !!clienteId,
    staleTime: SIGNED_URL_STALE_TIME,
  });
}

/**
 * Refleja un pago (o su borrado) en la copia local de la deuda para que la
 * pantalla se actualice sin conexión. Es solo una vista previa: en el servidor
 * monto_pagado y estado los calcula un trigger a partir de la tabla pagos
 * (migración 003), así que nunca se encola una escritura de monto_pagado.
 */
async function ajustarDeudaLocal(deudaId, delta) {
  if (!deudaId) return null;
  const deuda = await getCachedById('deudas', deudaId);
  if (!deuda) return null;

  const total = Number(deuda.monto_total);
  const pagado = Math.min(Math.max(0, Number(deuda.monto_pagado || 0) + delta), total);
  const estado = pagado >= total ? 'pagada' : pagado > 0 ? 'parcial' : 'pendiente';
  const actualizada = { ...deuda, monto_pagado: pagado, estado };
  await cacheOne('deudas', actualizada);
  return actualizada;
}

// Hook para registrar un nuevo pago vinculado a una deuda
export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ archivoPDF, metodo, deuda_id, ...pagoData }) => {
      const monto = parseFloat(String(pagoData.monto).replace(/\./g, '').replace(',', '.'));
      // El id se genera acá para poder nombrar el comprobante antes de insertar
      // y para que el pago encolado offline conserve el mismo id al sincronizar.
      const id = generateId();
      const rutaComprobante = archivoPDF ? `${pagoData.cliente_id}/${id}.pdf` : null;

      const payload = {
        id,
        cliente_id: pagoData.cliente_id,
        deuda_id: deuda_id || null,
        orden_id: pagoData.orden_id || null,
        monto,
        metodo_pago: metodo,
        comprobante_url: null,
        nota: pagoData.nota || null,
        fecha: pagoData.fecha,
      };

      // --- OFFLINE ---
      if (!isOnline()) {
        const deuda = await ajustarDeudaLocal(deuda_id, monto);
        const pagoLocal = {
          ...payload,
          created_at: new Date().toISOString(),
          comprobante_pendiente: !!archivoPDF,
          deudas: deuda ? {
            id: deuda.id,
            concepto: deuda.concepto,
            monto_total: deuda.monto_total,
            en_cuotas: deuda.en_cuotas,
            cantidad_cuotas: deuda.cantidad_cuotas,
          } : null,
        };

        await cacheOne('pagos', pagoLocal);
        await addPendingSync('pagos', 'insert', payload);
        if (archivoPDF) {
          await addPendingUpload({
            tabla: 'pagos',
            registroId: id,
            campo: 'comprobante_url',
            bucket: BUCKET_COMPROBANTES,
            path: rutaComprobante,
            file: archivoPDF,
          });
        }
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info(archivoPDF
          ? 'Sin conexión — Pago guardado; el comprobante se subirá al reconectar'
          : 'Sin conexión — Pago guardado localmente');
        return pagoLocal;
      }

      // --- ONLINE ---
      if (archivoPDF) {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_COMPROBANTES)
          .upload(rutaComprobante, archivoPDF);

        if (uploadError) {
          throw new Error('Error al subir el comprobante: ' + uploadError.message);
        }
      }

      // Se guarda la ruta, no una URL: el bucket es privado y la URL firmada se
      // genera al mostrar el pago. La deuda la actualiza el trigger de Postgres.
      const { data, error } = await supabase
        .from('pagos')
        .insert([{ ...payload, comprobante_url: rutaComprobante }])
        .select()
        .single();

      if (error) throw error;

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
    mutationFn: async ({ id, cliente_id, deuda_id, monto, comprobante_url }) => {
      if (!isOnline()) {
        await removeCached('pagos', id);
        await ajustarDeudaLocal(deuda_id, -Number(monto));
        await addPendingSync('pagos', 'delete', { id });
        useAppStore.getState().setPendingSyncCount(await getPendingCount());
        toast.info('Sin conexión — Eliminación pendiente de sincronizar');
        return { id, cliente_id };
      }

      // El trigger de Postgres descuenta el pago de la deuda.
      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id);
      if (error) throw error;

      await removeCached('pagos', id);

      const ruta = comprobantePath(comprobante_url);
      if (ruta) {
        const { error: storageError } = await supabase.storage.from(BUCKET_COMPROBANTES).remove([ruta]);
        if (storageError) console.warn('[Pagos] No se pudo borrar el comprobante:', storageError);
      }

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
