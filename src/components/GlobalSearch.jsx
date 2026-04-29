import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { Search, CarFront, User, X } from 'lucide-react';

export default function GlobalSearch() {
  const { isSearchOpen, closeSearch } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Mock de datos para buscar
  const mockData = [
    { id: '1', type: 'cliente', name: 'Juan Pérez', detail: '11 1234-5678' },
    { id: '2', type: 'cliente', name: 'María Gómez', detail: '11 9876-5432' },
    { id: '101', type: 'vehiculo', name: 'Ford Fiesta', detail: 'AB 123 CD' },
    { id: '102', type: 'vehiculo', name: 'Toyota Hilux', detail: 'AA 000 BB' },
  ];

  // Foco automático al abrir
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch]);

  if (!isSearchOpen) return null;

  const resultados = query.length > 1 
    ? mockData.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.detail.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (item) => {
    if (item.type === 'cliente') navigate(`/clientes/${item.id}`);
    if (item.type === 'vehiculo') navigate(`/vehiculos/${item.id}`);
    closeSearch();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 sm:px-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/50 dark:bg-black/80 backdrop-blur-sm"
        onClick={closeSearch}
      ></div>

      {/* Contenedor del Buscador */}
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-red-600/40 relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Input */}
        <div className="relative border-b border-neutral-100 dark:border-neutral-800 flex items-center px-4">
          <Search className="w-6 h-6 text-neutral-400 dark:text-red-500 mr-3 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none py-5 text-lg outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
            placeholder="Buscar clientes o vehículos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={closeSearch}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="overflow-y-auto">
          {query.length <= 1 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              Escribe al menos 2 letras para comenzar a buscar.
            </div>
          ) : resultados.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              No encontramos nada que coincida con "{query}"
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {resultados.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left flex items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-red-950/20 rounded-xl transition-colors group"
                >
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg mr-4 group-hover:bg-white dark:group-hover:bg-red-900/40 transition-colors">
                    {item.type === 'cliente' ? (
                      <User className="w-5 h-5 text-neutral-500 dark:text-red-400" />
                    ) : (
                      <CarFront className="w-5 h-5 text-neutral-500 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {item.type === 'cliente' ? 'Teléfono: ' : 'Patente: '} {item.detail}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer del buscador */}
        <div className="bg-neutral-50 dark:bg-neutral-950 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 text-right flex justify-between items-center">
          <span>Resultados rápidos</span>
          <span className="hidden sm:inline">Presiona <kbd className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">Esc</kbd> para cerrar</span>
        </div>

      </div>
    </div>
  );
}
