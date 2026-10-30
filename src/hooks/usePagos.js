import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { addPendingUpload, cacheOne, deshacerAltaOffline, generateId, getCachedById, getCachedByIndex, getCachedData, isOnline, removeCached } from '../db/offlineService';
import { BUCKET_COMPROBANTES, SIGNED_URL_REFRESH_MS, comprobantePath, getSignedUrls } from '../lib/storage';
import { offlineQuery, offlineMutation, insertarOffline, borrarOffline } from './offlineHelpers';
import { DEUDAS_KEYS } from './useDeudas';

const masNuevoPrimero = (a, b) => new Date(b.fecha) - new Date(a.fecha);

// El bucket de comprobantes es privado: se firma una URL por cada pago que
// tenga comprobante. Sin conexión no hay URL y el PDF no se puede abrir.
async function conComprobantesFirmados(pagos) {
  const urls = await getSignedUrls(BUCKET_COMPROBANTES, pagos.map(p => comprobantePath(p.comprobante_url)));
  return pagos.map(p => ({ ...p, comprobante_signed_url: urls[comprobantePath(p.comprobante_url)] || null }));
}

// Las URLs firmadas vencen: la copia local no las usa
// eslint-disable-next-line no-unused-vars
const sinUrlFirmada = ({ comprobante_signed_url, ...pago }) => pago;

// Query de todos los pagos (la usa usePrefetch para llenar el caché offline)
export const pagosQuery = {
  queryKey: ['pagos', 'all'],
  queryFn: offlineQuery({
    tabla: 'pagos',
    remoto: () => supabase
      .from('pagos')
      .select('*, deudas(id, concepto, monto_total, en_cuotas, cantidad_cuotas)')
      .order('fecha', { ascending: false }),
    local: async () => (await getCachedData('pagos')).sort(masNuevoPrimero),
  }),
};

// Hook para obtener el historial de pagos de un cliente
export function usePagos(clienteId) {
  return useQuery({
    queryKey: ['pagos', clienteId],
    queryFn: offlineQuery({
      tabla: 'pagos',
      remoto: () => supabase
        .from('pagos')
        .select('*, deudas(id, concepto, monto_total, en_cuotas, cantidad_cuotas)')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false }),
      preparar: conComprobantesFirmados,
      local: async () => (await getCachedByIndex('pagos', 'cliente_id', clienteId))
        .map(sinUrlFirmada)
        .sort(masNuevoPrimero),
      alcance: { campo: 'cliente_id', valor: clienteId },
    }),
    enabled: !!clienteId,
    // Renueva las URLs firmadas mientras la pantalla siga abierta
    refetchInterval: SIGNED_URL_REFRESH_MS,
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

/**
 * Arma el pago a insertar. El id se genera acá para poder nombrar el
 * comprobante antes de insertar y para que el pago encolado offline conserve
 * el mismo id al sincronizar.
 */
function prepararPago({ archivoPDF, metodo, deuda_id, ...pagoData }) {
  const id = generateId();
  return {
    archivoPDF,
    rutaComprobante: archivoPDF ? `${pagoData.cliente_id}/${id}.pdf` : null,
    payload: {
      id,
      cliente_id: pagoData.cliente_id,
      deuda_id: deuda_id || null,
      orden_id: pagoData.orden_id || null,
      monto: parseFloat(String(pagoData.monto).replace(/\./g, '').replace(',', '.')),
      metodo_pago: metodo,
      comprobante_url: null,
      nota: pagoData.nota || null,
      fecha: pagoData.fecha,
    },
  };
}

// Hook para registrar un nuevo pago vinculado a una deuda
export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: offlineMutation({
      online: async (variables) => {
        const { archivoPDF, rutaComprobante, payload } = prepararPago(variables);

        if (archivoPDF) {
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_COMPROBANTES)
            .upload(rutaComprobante, archivoPDF);

          if (uploadError) {
            throw new Error('Error al subir el comprobante: ' + uploadError.message);
          }
        }

        // Se guarda la ruta, no una URL: el bucket es privado y la URL firmada
        // se genera al mostrar el pago. La deuda la actualiza el trigger de Postgres.
        const { data, error } = await supabase
          .from('pagos')
          .insert([{ ...payload, comprobante_url: rutaComprobante }])
          .select()
          .single();

        if (error) throw error;

        await cacheOne('pagos', data);
        return data;
      },
      offline: async (variables) => {
        const { archivoPDF, rutaComprobante, payload } = prepararPago(variables);
        const deuda = payload.deuda_id ? await getCachedById('deudas', payload.deuda_id) : null;

        const pagoLocal = await insertarOffline('pagos', payload, {
          comprobante_pendiente: !!archivoPDF,
          deudas: deuda ? {
            id: deuda.id,
            concepto: deuda.concepto,
            monto_total: deuda.monto_total,
            en_cuotas: deuda.en_cuotas,
            cantidad_cuotas: deuda.cantidad_cuotas,
          } : null,
        });

        // El PDF se guarda en IndexedDB y se sube después del insert del pago.
        // Si no entra (por ejemplo, sin espacio), se deshace el pago entero:
        // si no, al reintentar quedaría cargado dos veces.
        if (archivoPDF) {
          try {
            await addPendingUpload({
              tabla: 'pagos',
              registroId: payload.id,
              campo: 'comprobante_url',
              bucket: BUCKET_COMPROBANTES,
              path: rutaComprobante,
              file: archivoPDF,
            });
          } catch (error) {
            await deshacerAltaOffline('pagos', payload.id);
            throw new Error(
              'No se pudo guardar el comprobante sin conexión. Probá sin adjuntarlo o esperá a tener conexión.',
              { cause: error }
            );
          }
        }

        await ajustarDeudaLocal(payload.deuda_id, payload.monto);
        return pagoLocal;
      },
      aviso: ({ archivoPDF }) => (archivoPDF
        ? 'Pago guardado; el comprobante se subirá al reconectar'
        : 'Pago guardado localmente'),
    }),
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
    mutationFn: offlineMutation({
      online: async ({ id, cliente_id, comprobante_url }) => {
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
      offline: async ({ id, cliente_id, deuda_id, monto }) => {
        await borrarOffline('pagos', id);
        await ajustarDeudaLocal(deuda_id, -Number(monto));
        return { id, cliente_id };
      },
      aviso: 'Eliminación pendiente de sincronizar',
      tabla: 'pagos',
    }),
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
