import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { Search, CarFront, User, X, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

export default function GlobalSearch() {
  const { isSearchOpen, closeSearch } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: resultados, isLoading } = useSearch(query);
  const clientes = resultados?.clientes || [];
  const vehiculos = resultados?.vehiculos || [];
  const totalResults = clientes.length + vehiculos.length;

  // Foco automático al abrir
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Cerrar con Escape, abrir con Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useAppStore.getState().openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch]);

  if (!isSearchOpen) return null;

  const handleSelectCliente = (c) => {
    navigate(`/clientes/${c.id}`);
    closeSearch();
    setQuery('');
  };

  const handleSelectVehiculo = (v) => {
    navigate(`/vehiculos/${v.id}`);
    closeSearch();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 sm:px-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/50 dark:bg-black/80 backdrop-blur-sm"
        onClick={() => { closeSearch(); setQuery(''); }}
      ></div>

      {/* Contenedor del Buscador */}
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-red-600/40 relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Input */}
        <div className="relative border-b border-neutral-100 dark:border-neutral-800 flex items-center px-4">
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-red-500 mr-3 shrink-0 animate-spin" />
          ) : (
            <Search className="w-6 h-6 text-neutral-400 dark:text-red-500 mr-3 shrink-0" />
          )}
          <input 
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none py-5 text-lg outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
            placeholder="Buscar clientes o vehículos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => { closeSearch(); setQuery(''); }}
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
          ) : isLoading ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              Buscando...
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              No encontramos nada que coincida con "{query}"
            </div>
          ) : (
            <div className="p-2">
              {/* Sección Clientes */}
              {clientes.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-2">
                    Clientes ({clientes.length})
                  </p>
                  {clientes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCliente(c)}
                      className="w-full text-left flex items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-red-950/20 rounded-xl transition-colors group"
                    >
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                        <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {c.nombre} {c.apellido || ''}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {c.telefono ? `📞 ${c.telefono}` : c.email || 'Sin datos de contacto'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sección Vehículos */}
              {vehiculos.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-4 py-2">
                    Vehículos ({vehiculos.length})
                  </p>
                  {vehiculos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVehiculo(v)}
                      className="w-full text-left flex items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-red-950/20 rounded-xl transition-colors group"
                    >
                      <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg mr-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                        <CarFront className="w-5 h-5 text-green-500 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {v.marca} {v.modelo} — <span className="tracking-widest">{v.patente}</span>
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {v.clientes ? `Dueño: ${v.clientes.nombre} ${v.clientes.apellido || ''}` : `Año: ${v.anio || ''}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del buscador */}
        <div className="bg-neutral-50 dark:bg-neutral-950 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 text-right flex justify-between items-center">
          <span>{totalResults > 0 ? `${totalResults} resultados` : 'Resultados rápidos'}</span>
          <span className="hidden sm:inline">Presiona <kbd className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">Esc</kbd> para cerrar</span>
        </div>

      </div>
    </div>
  );
}
