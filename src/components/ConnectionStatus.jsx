import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const pendingSyncCount = useAppStore((s) => s.pendingSyncCount);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected && pendingSyncCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-2 sm:pt-4">
      {/* Banner Offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <WifiOff className="w-4 h-4" />
          <span>
            Sin conexión
            {pendingSyncCount > 0
              ? ` — ${pendingSyncCount} cambio${pendingSyncCount > 1 ? 's' : ''} pendiente${pendingSyncCount > 1 ? 's' : ''}`
              : ' — Modo offline activado'}
          </span>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-950/20 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingSyncCount}
            </span>
          )}
        </div>
      )}

      {/* Banner Reconectado (con pendientes → sincronizando) */}
      {isOnline && showReconnected && (
        <div className="bg-emerald-500 text-emerald-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          {pendingSyncCount > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Conexión restaurada — Sincronizando...</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Conexión restaurada</span>
            </>
          )}
        </div>
      )}

      {/* Badge persistente: hay pendientes y estamos online (sync en curso) */}
      {isOnline && !showReconnected && pendingSyncCount > 0 && (
        <div className="bg-orange-500 text-orange-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Sincronizando {pendingSyncCount} cambio{pendingSyncCount > 1 ? 's' : ''}...</span>
        </div>
      )}
    </div>
  );
}
