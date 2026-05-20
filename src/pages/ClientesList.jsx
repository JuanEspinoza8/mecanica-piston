import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, Phone, MapPin, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';

export default function ClientesList() {
  const { data: clientes = [], isLoading, isError } = useClientes();
  const [filtro, setFiltro] = useState('');

  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nombre?.toLowerCase().includes(filtro.toLowerCase()) || 
    cliente.telefono?.includes(filtro)
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Directorio de Clientes</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Administra los dueños de los vehículos del taller.</p>
        </div>
        
        <Link 
          to="/clientes/nuevo" 
          className="flex items-center justify-center bg-black dark:bg-red-600 hover:bg-neutral-800 dark:hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-all shadow-lg shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-red-500" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-all shadow-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Cargando directorio de clientes...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Ocurrió un error al cargar los clientes</p>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center flex flex-col items-center">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
            <Filter className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Ningún cliente coincide</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Intenta buscar con otro nombre o número de teléfono.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map(cliente => (
            <Link 
              key={cliente.id} 
              to={`/clientes/${cliente.id}`}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-black dark:hover:border-red-500/50 transition-all group block"
            >
              <div className="flex items-center mb-4">
                <div className="bg-neutral-100 dark:bg-red-950/30 p-3 rounded-full mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/50 transition-colors">
                  <User className="w-6 h-6 text-neutral-400 dark:text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{cliente.nombre}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center mt-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {cliente.telefono}
                  </p>
                </div>
              </div>
              {cliente.direccion && (
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  <MapPin className="w-4 h-4 mr-1 shrink-0" />
                  <span className="truncate">{cliente.direccion}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
