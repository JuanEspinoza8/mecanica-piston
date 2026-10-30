import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // Tema: 'light' o 'dark'
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      // Estado del buscador global
      isSearchOpen: false,
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      // Contador de operaciones offline pendientes de sincronización
      pendingSyncCount: 0,
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),

      // Operaciones que fallaron de forma permanente (bandeja de errores)
      syncErrorCount: 0,
      setSyncErrorCount: (count) => set({ syncErrorCount: count }),

      // Autenticación (alimentada por Supabase Auth via ProtectedRoute)
      user: null,
      isAuthenticated: false,
      authLoading: true, // true hasta que onAuthStateChange resuelva
      setAuth: (user) => set({ user, isAuthenticated: !!user, authLoading: false }),
      clearAuth: () => set({ user: null, isAuthenticated: false, authLoading: false }),
    }),
    {
      name: 'mecanica-piston-storage',
      // El usuario se recuerda para poder abrir la app sin conexión con el
      // token vencido (ver ProtectedRoute). Al cerrar sesión queda en null.
      partialize: (state) => ({ theme: state.theme, user: state.user }),
    }
  )
);

export default useAppStore;
