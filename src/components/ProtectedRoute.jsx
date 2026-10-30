import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const authLoading = useAppStore((state) => state.authLoading);
  const setAuth = useAppStore((state) => state.setAuth);
  const clearAuth = useAppStore((state) => state.clearAuth);

  useEffect(() => {
    const resolverSesion = (session) => {
      if (session?.user) {
        setAuth({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split('@')[0],
        });
        return;
      }
      // Sin conexión, Supabase no puede renovar un token vencido y devuelve
      // "sin sesión" aunque nadie la haya cerrado. Para que la app siga
      // funcionando offline se usa el último usuario; al volver la conexión
      // Supabase renueva el token (o, si la sesión ya no es válida, la cierra).
      const ultimoUsuario = useAppStore.getState().user;
      if (!navigator.onLine && ultimoUsuario) setAuth(ultimoUsuario);
      else clearAuth();
    };

    // Verificar sesión existente al montar
    supabase.auth.getSession().then(({ data: { session } }) => resolverSesion(session));

    // Escuchar cambios de estado de auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => resolverSesion(session)
    );

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

  // Mientras se verifica la sesión, mostrar loader (evita flash de redirect)
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
        <p className="text-neutral-500 text-sm font-medium">Verificando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
