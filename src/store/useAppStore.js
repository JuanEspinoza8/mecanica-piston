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

      // Autenticación (simulada - Juan conectará con Supabase Auth)
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'mecanica-piston-storage',
      partialize: (state) => ({ theme: state.theme, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAppStore;
