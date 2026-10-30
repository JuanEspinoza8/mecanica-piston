import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processPendingSyncs, getPendingCount, getSyncErrorCount, subscribeQueue } from '../db/offlineService';
import useAppStore from '../store/useAppStore';
import { toast } from 'sonner';

const plural = (n, singular, pluralForm) => `${n} ${n === 1 ? singular : pluralForm}`;

/**
 * Hook de sincronización offline.
 *
 * - Al montar y al reconectar, procesa la cola de pendientes
 * - Si una operación falla por un problema momentáneo, programa el reintento
 * - Mantiene en Zustand los contadores de pendientes y de errores
 * - Se monta UNA SOLA VEZ en App.jsx (el lock contra ejecuciones en paralelo
 *   está en processPendingSyncs)
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const setPendingSyncCount = useAppStore((s) => s.setPendingSyncCount);
  const setSyncErrorCount = useAppStore((s) => s.setSyncErrorCount);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const retryTimer = useRef(null);
  // Última versión de handleSync, para que el timer de reintento la llame
  // sin que la función se referencie a sí misma.
  const handleSyncRef = useRef(null);

  const refreshCounts = useCallback(async () => {
    const [pendientes, errores] = await Promise.all([getPendingCount(), getSyncErrorCount()]);
    setPendingSyncCount(pendientes);
    setSyncErrorCount(errores);
  }, [setPendingSyncCount, setSyncErrorCount]);

  const handleSync = useCallback(async ({ ignorarEspera = false } = {}) => {
    clearTimeout(retryTimer.current);
    if (!navigator.onLine) return;

    const count = await getPendingCount();
    if (count === 0) return;

    const result = await processPendingSyncs({ ignorarEspera });

    if (result.processed > 0) {
      // Invalidar todos los queries para refrescar datos
      queryClient.invalidateQueries();
      toast.success(`${plural(result.processed, 'cambio sincronizado', 'cambios sincronizados')}`);
    }

    if (result.errores > 0) {
      toast.error(`${plural(result.errores, 'cambio no se pudo', 'cambios no se pudieron')} sincronizar. Revisalos en "Errores de sincronización".`);
    }

    if (result.reintentarEn) {
      const espera = Math.max(1000, result.reintentarEn - Date.now());
      retryTimer.current = setTimeout(() => handleSyncRef.current?.(), espera);
    }
  }, [queryClient]);

  useEffect(() => {
    handleSyncRef.current = handleSync;
  }, [handleSync]);

  // Contadores siempre al día, venga de donde venga el cambio en la cola.
  // Si hay algo nuevo para mandar (por ejemplo, el usuario reintentó un error
  // desde la bandeja), se intenta sincronizar enseguida.
  useEffect(() => {
    refreshCounts();
    return subscribeQueue((motivo) => {
      refreshCounts();
      if (motivo === 'nueva' && isAuthenticated) handleSync({ ignorarEspera: true });
    });
  }, [refreshCounts, handleSync, isAuthenticated]);

  useEffect(() => {
    // Sin sesión no se sincroniza (RLS rechazaría todo). Al iniciar sesión,
    // este efecto vuelve a correr y procesa lo que haya quedado en la cola.
    if (!isAuthenticated) return;

    const handleOnline = () => handleSync({ ignorarEspera: true });
    window.addEventListener('online', handleOnline);
    handleSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      clearTimeout(retryTimer.current);
    };
  }, [handleSync, isAuthenticated]);
}
