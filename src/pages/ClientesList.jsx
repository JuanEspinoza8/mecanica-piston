import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, Phone, CarFront, ChevronRight } from 'lucide-react';

export default function ClientesList() {
  // Datos simulados (mock data) hasta que Juan conecte la base de datos real
  const [clientes] = useState([
    { id: 1, nombre: 'Juan Pérez', telefono: '+54 11 1234-5678', vehiculos: 2 },
    { id: 2, nombre: 'María Gómez', telefono: '+54 11 9876-5432', vehiculos: 1 },
    { id: 3, nombre: 'Carlos López', telefono: '+54 11 4567-8901', vehiculos: 3 },
    { id: 4, nombre: 'Ana Martínez', telefono: '+54 11 3333-4444', vehiculos: 0 },
  ]);

  const [filtro, setFiltro] = useState('');

  // Filtramos la lista según lo que escriban en el buscador
  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    c.telefono.includes(filtro)
  );

  return (
    <div className="space-y-6 pb-6">
      
      {/* Cabecera de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-neutral-500">Gestiona el directorio de dueños de vehículos.</p>
        </div>
        
        {/* Botón Nuevo Cliente */}
        <Link 
          to="/clientes/nuevo" 
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-lg shadow-red-600/20 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Buscador local */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Buscar cliente por nombre o teléfono..." 
          className="w-full bg-white border border-neutral-200 text-neutral-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="bg-neutral-100 p-4 rounded-full mb-4">
            <User className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No se encontraron clientes</h3>
          <p className="text-neutral-500 max-w-sm mx-auto">
            {filtro ? 'Intenta buscar con otro nombre o número.' : 'Aún no tienes clientes registrados en el taller. Haz clic en "Nuevo Cliente" para empezar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map(cliente => (
            <Link 
              key={cliente.id} 
              to={`/clientes/${cliente.id}`}
              className="bg-white border border-neutral-200 rounded-2xl p-5 hover:border-red-300 hover:shadow-md transition-all group relative overflow-hidden"
            >
              {/* Efecto de borde rojo al pasar el mouse */}
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="bg-neutral-100 p-2 rounded-lg mr-3 text-neutral-600 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-neutral-900 truncate pr-2">{cliente.nombre}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-neutral-600">
                  <Phone className="w-4 h-4 mr-2 text-neutral-400" />
                  {cliente.telefono}
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <CarFront className="w-4 h-4 mr-2 text-neutral-400" />
                  {cliente.vehiculos === 1 ? '1 vehículo' : `${cliente.vehiculos} vehículos`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
