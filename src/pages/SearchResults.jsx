import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, CarFront, ArrowLeft, X } from 'lucide-react';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Mock de datos para buscar (se reemplazará con datos reales de Supabase)
  const mockData = [
    { id: '1', type: 'cliente', name: 'Juan Pérez', detail: '11 1234-5678' },
    { id: '2', type: 'cliente', name: 'María Gómez', detail: '11 9876-5432' },
    { id: '3', type: 'cliente', name: 'Carlos López', detail: '11 5555-1234' },
    { id: '4', type: 'cliente', name: 'Ana Rodríguez', detail: '11 4321-8765' },
    { id: '101', type: 'vehiculo', name: 'Ford Fiesta 2019', detail: 'AB 123 CD' },
    { id: '102', type: 'vehiculo', name: 'Toyota Hilux 2021', detail: 'AA 000 BB' },
    { id: '103', type: 'vehiculo', name: 'Chevrolet Cruze 2020', detail: 'AC 456 EF' },
    { id: '104', type: 'vehiculo', name: 'Volkswagen Gol 2018', detail: 'AD 789 GH' },
  ];

  // Foco automático al montar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const resultados = query.length > 1 
    ? mockData.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.detail.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const clientes = resultados.filter(r => r.type === 'cliente');
  const vehiculos = resultados.filter(r => r.type === 'vehiculo');

  const handleSelect = (item) => {
    if (item.type === 'cliente') navigate(`/clientes/${item.id}`);
    if (item.type === 'vehiculo') navigate(`/vehiculos/${item.id}`);
  };

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-red-500" />
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

        {/* Estado vacío */}
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

        {/* Sin resultados */}
        {query.length > 1 && resultados.length === 0 && (
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
              {clientes.map((item) => (
                <button
                  key={`cliente-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left flex items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-red-300 dark:hover:border-red-600/40 transition-all group active:scale-[0.98]"
                >
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shrink-0">
                    <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      📞 {item.detail}
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
              {vehiculos.map((item) => (
                <button
                  key={`vehiculo-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left flex items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-red-300 dark:hover:border-red-600/40 transition-all group active:scale-[0.98]"
                >
                  <div className="bg-green-50 dark:bg-green-950/30 p-2.5 rounded-lg mr-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors shrink-0">
                    <CarFront className="w-5 h-5 text-green-500 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      🚗 {item.detail}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
