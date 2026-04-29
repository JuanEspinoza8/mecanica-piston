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
    }),
    {
      name: 'mecanica-piston-storage', // Nombre de la key en localStorage
      partialize: (state) => ({ theme: state.theme }), // Solo queremos persistir el tema
    }
  )
);

export default useAppStore;
