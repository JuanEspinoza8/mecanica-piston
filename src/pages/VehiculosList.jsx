import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, CarFront, Filter } from 'lucide-react';

export default function VehiculosList() {
  const [vehiculos] = useState([
    { id: 101, patente: 'AB 123 CD', marca: 'Ford', modelo: 'Fiesta', año: 2018, color: 'Blanco', dueño: 'Juan Pérez' },
    { id: 102, patente: 'AA 000 BB', marca: 'Toyota', modelo: 'Hilux', año: 2016, color: 'Gris', dueño: 'María Gómez' },
    { id: 103, patente: 'AC 999 XX', marca: 'VW', modelo: 'Gol Trend', año: 2021, color: 'Rojo', dueño: 'Carlos López' },
    { id: 104, patente: 'AE 444 ZZ', marca: 'Fiat', modelo: 'Cronos', año: 2023, color: 'Negro', dueño: 'Ana Martínez' },
  ]);

  const [filtro, setFiltro] = useState('');

  const vehiculosFiltrados = vehiculos.filter(v => 
    v.patente.toLowerCase().replace(/\s/g, '').includes(filtro.toLowerCase().replace(/\s/g, '')) || 
    v.marca.toLowerCase().includes(filtro.toLowerCase()) ||
    v.dueño.toLowerCase().includes(filtro.toLowerCase())
  );

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

      {/* Grid de Vehículos */}
      {vehiculosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center flex flex-col items-center shadow-sm">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
            <Filter className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Ningún vehículo coincide</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Intenta buscar con otra patente o nombre de cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehiculosFiltrados.map(vehiculo => (
            <Link 
              key={vehiculo.id} 
              to={`/vehiculos/${vehiculo.id}`}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-black dark:hover:border-red-500/50 transition-all group block"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="inline-block bg-black dark:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md tracking-widest shadow-sm">
                  {vehiculo.patente}
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                  <CarFront className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {vehiculo.marca} {vehiculo.modelo}
              </h3>
              
              <div className="flex flex-col space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{vehiculo.año} • {vehiculo.color}</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 mt-2 flex items-center border-t border-neutral-100 dark:border-neutral-800 pt-2">
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs uppercase tracking-wide mr-2">Dueño:</span>
                  {vehiculo.dueño}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
