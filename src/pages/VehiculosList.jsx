import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import { useVehiculos } from '../hooks/useVehiculos';
import VehiculoCard from '../components/VehiculoCard';

export default function VehiculosList() {
  const { data: vehiculos = [], isLoading, isError } = useVehiculos();

  const [filtro, setFiltro] = useState('');

  const vehiculosFiltrados = vehiculos.filter(v => {
    const nombreDueño = v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido || ''}`.trim() : '';
    return v.patente.toLowerCase().replace(/\s/g, '').includes(filtro.toLowerCase().replace(/\s/g, '')) || 
           v.marca.toLowerCase().includes(filtro.toLowerCase()) ||
           nombreDueño.toLowerCase().includes(filtro.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Directorio de Vehículos</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Gestión de flota y autos registrados.</p>
        </div>
        
        <Link 
          to="/vehiculos/nuevo" 
          className="flex items-center justify-center bg-black dark:bg-red-600 hover:bg-neutral-800 dark:hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-all shadow-lg shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar Vehículo
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-red-500" />
        <input 
          type="text" 
          placeholder="Buscar por patente (ej: AB123CD), marca o dueño..." 
          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-all shadow-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Estados */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-neutral-400 dark:text-neutral-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">Error al cargar vehículos.</div>
      ) : vehiculosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center flex flex-col items-center shadow-sm">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
            <Filter className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Ningún vehículo encontrado</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Intenta buscar con otra patente o agregá uno nuevo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehiculosFiltrados.map(vehiculo => (
            <VehiculoCard key={vehiculo.id} vehiculo={vehiculo} variant="vertical" />
          ))}
        </div>
      )}
    </div>
  );
}
