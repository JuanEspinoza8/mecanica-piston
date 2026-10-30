import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [showOffline, setShowOffline] = useState(!navigator.onLine);
  const pendingSyncCount = useAppStore((s) => s.pendingSyncCount);

  // Mostrar el banner offline de nuevo cada vez que haya un nuevo cambio
  // pendiente. Se ajusta durante el render (patrón recomendado por React)
  // en lugar de usar un efecto que vuelva a renderizar.
  const [conteoAnterior, setConteoAnterior] = useState(pendingSyncCount);
  if (pendingSyncCount !== conteoAnterior) {
    setConteoAnterior(pendingSyncCount);
    if (!isOnline) setShowOffline(true);
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Los banners se ocultan solos: el de offline a los 4 s y el de reconexión a los 3 s
  useEffect(() => {
    if (!showOffline) return;
    const timer = setTimeout(() => setShowOffline(false), 4000);
    return () => clearTimeout(timer);
  }, [showOffline, pendingSyncCount]);

  useEffect(() => {
    if (!showReconnected) return;
    const timer = setTimeout(() => setShowReconnected(false), 3000);
    return () => clearTimeout(timer);
  }, [showReconnected]);

  // Si está online y no hay que mostrar reconexión, o si está offline y ya pasó el tiempo de mostrarse
  if ((isOnline && !showReconnected) || (!isOnline && !showOffline)) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-2 sm:pt-4">
      {/* Banner Offline */}
      {!isOnline && showOffline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <WifiOff className="w-4 h-4" />
          <span>
            Sin conexión
            {pendingSyncCount > 0
              ? ` — ${pendingSyncCount} cambio${pendingSyncCount > 1 ? 's' : ''} en cola`
              : ' — Modo offline activado'}
          </span>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-950/20 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingSyncCount}
            </span>
          )}
        </div>
      )}

      {/* Banner Reconectado (desaparece en 3s) */}
      {isOnline && showReconnected && (
        <div className="bg-emerald-500 text-emerald-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <Wifi className="w-4 h-4" />
          <span>Conexión restaurada{pendingSyncCount > 0 ? ' — Sincronizando...' : ''}</span>
        </div>
      )}
    </div>
  );
}
