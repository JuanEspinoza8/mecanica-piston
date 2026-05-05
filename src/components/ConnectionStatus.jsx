import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

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

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-2 sm:pt-4">
      {/* Banner Offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión a Internet. Modo offline activado.</span>
        </div>
      )}

      {/* Banner Reconectado */}
      {isOnline && showReconnected && (
        <div className="bg-emerald-500 text-emerald-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <Wifi className="w-4 h-4" />
          <span>Conexión restaurada</span>
        </div>
      )}
    </div>
  );
}
