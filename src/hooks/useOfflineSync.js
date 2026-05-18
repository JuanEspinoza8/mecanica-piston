import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processPendingSyncs, getPendingCount } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { toast } from 'sonner';

/**
 * Hook de sincronización offline.
 * 
 * - Escucha eventos online/offline del navegador
 * - Al reconectar, procesa la cola de pendientes
 * - Actualiza el contador de pendientes en Zustand
 * - Se monta UNA SOLA VEZ en App.jsx
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const setPendingSyncCount = useAppStore((s) => s.setPendingSyncCount);

  // Actualizar contador de pendientes
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingSyncCount(count);
  }, [setPendingSyncCount]);

  // Procesar cola al reconectar
  const handleSync = useCallback(async () => {
    const count = await getPendingCount();
    if (count === 0) return;

    toast.info(`Sincronizando ${count} cambio${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''}...`);

    const result = await processPendingSyncs();

    if (result.processed > 0) {
      // Invalidar todos los queries para refrescar datos
      queryClient.invalidateQueries();
      toast.success(`${result.processed} cambio${result.processed > 1 ? 's' : ''} sincronizado${result.processed > 1 ? 's' : ''}`);
    }

    if (result.failed) {
      toast.error(`Error de sincronización: ${result.error}`);
    }

    await refreshPendingCount();
  }, [queryClient, refreshPendingCount]);

  useEffect(() => {
    // Contar pendientes al montar
    refreshPendingCount();

    // Escuchar reconexión
    const handleOnline = () => {
      handleSync();
    };

    window.addEventListener('online', handleOnline);

    // Si ya estamos online al montar, intentar sync por si hay pendientes
    if (navigator.onLine) {
      handleSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [handleSync, refreshPendingCount]);

  return { refreshPendingCount };
}
