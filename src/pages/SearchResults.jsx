import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, CarFront, ArrowLeft, X, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Hook real conectado a Supabase con debounce de 300ms
  const { data, isLoading } = useSearch(query);

  const clientes = data?.clientes || [];
  const vehiculos = data?.vehiculos || [];
  const totalResultados = clientes.length + vehiculos.length;

  // Foco automático al montar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      
      {/* Header con Input de búsqueda */}
      <div className="sticky top-0 z-20 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center px-3 py-3 gap-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            {isLoading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-red-500" />
            )}
            <input 
              ref={inputRef}
              type="text"
              className="w-full pl-10 pr-10 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-base"
              placeholder="Buscar clientes o vehículos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-4">

        {/* Estado vacío - menos de 2 caracteres */}
        {query.length <= 1 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              Escribí al menos 2 letras para buscar
            </p>
            <p className="text-neutral-400 dark:text-neutral-600 text-xs mt-1">
              Buscá por nombre, patente o teléfono
            </p>
          </div>
        )}

        {/* Estado cargando */}
        {query.length > 1 && isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              Buscando...
            </p>
          </div>
        )}

        {/* Sin resultados */}
        {query.length > 1 && !isLoading && totalResultados === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-red-300 dark:text-red-600" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm font-medium">
              No se encontraron resultados
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
              Probá con otro término de búsqueda
            </p>
          </div>
        )}

        {/* Resultados: Clientes */}
        {clientes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 px-1">
              Clientes ({clientes.length})
            </h3>
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <button
                  key={`cliente-${cliente.id}`}
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                  className="w-full text-left flex items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-red-300 dark:hover:border-red-600/40 transition-all group active:scale-[0.98]"
                >
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shrink-0">
                    <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      {cliente.nombre} {cliente.apellido || ''}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      📞 {cliente.telefono || 'Sin teléfono'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados: Vehículos */}
        {vehiculos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 px-1">
              Vehículos ({vehiculos.length})
            </h3>
            <div className="space-y-2">
              {vehiculos.map((vehiculo) => (
                <button
                  key={`vehiculo-${vehiculo.id}`}
                  onClick={() => navigate(`/vehiculos/${vehiculo.id}`)}
                  className="w-full text-left flex items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-red-300 dark:hover:border-red-600/40 transition-all group active:scale-[0.98]"
                >
                  <div className="bg-green-50 dark:bg-green-950/30 p-2.5 rounded-lg mr-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors shrink-0">
                    <CarFront className="w-5 h-5 text-green-500 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      🚗 {vehiculo.patente}
                      {vehiculo.clientes && (
                        <span className="ml-2 text-neutral-400 dark:text-neutral-500">
                          — {vehiculo.clientes.nombre} {vehiculo.clientes.apellido || ''}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contador de resultados al fondo */}
        {query.length > 1 && !isLoading && totalResultados > 0 && (
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-4">
            {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
          </p>
        )}

      </div>
    </div>
  );
}
