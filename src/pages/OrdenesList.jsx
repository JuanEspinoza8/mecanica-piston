import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ClipboardList, Filter, ChevronRight } from 'lucide-react';

export default function OrdenesList() {
  // Datos simulados (mock data)
  const [ordenes] = useState([
    { id: 'ORD-001', cliente: 'Juan Pérez', vehiculo: 'Ford Fiesta (AB123CD)', estado: 'En proceso', fecha: '28/04/2026', total: '$15.000' },
    { id: 'ORD-002', cliente: 'María Gómez', vehiculo: 'Toyota Hilux (AA000BB)', estado: 'Terminado', fecha: '27/04/2026', total: '$45.000' },
    { id: 'ORD-003', cliente: 'Carlos López', vehiculo: 'VW Gol Trend (AC999XX)', estado: 'Esperando repuesto', fecha: '26/04/2026', total: '-' },
    { id: 'ORD-004', cliente: 'Ana Martínez', vehiculo: 'Fiat Cronos (AE444ZZ)', estado: 'Terminado', fecha: '20/04/2026', total: '$12.500' },
  ]);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas'); // 'Todas', 'Abiertas', 'Terminadas'

  // Lógica de filtrado combinada (Texto + Estado)
  const ordenesFiltradas = ordenes.filter(orden => {
    // 1. Filtro por texto (busca en cliente, vehículo o ID)
    const coincideTexto = 
      orden.cliente.toLowerCase().includes(filtroTexto.toLowerCase()) || 
      orden.vehiculo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.id.toLowerCase().includes(filtroTexto.toLowerCase());

    // 2. Filtro por estado
    let coincideEstado = true;
    if (filtroEstado === 'Abiertas') {
      coincideEstado = orden.estado !== 'Terminado'; // Si no está terminado, está abierto (en proceso, esperando repuesto, etc)
    } else if (filtroEstado === 'Terminadas') {
      coincideEstado = orden.estado === 'Terminado';
    }

    return coincideTexto && coincideEstado;
  });

  // Función auxiliar para asignar colores a los estados
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 text-green-700 border-green-200';
      case 'En proceso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Esperando repuesto': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Órdenes de Trabajo</h1>
          <p className="text-neutral-500">Historial y seguimiento de reparaciones.</p>
        </div>
        
        <Link 
          to="/ordenes/nueva" 
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-lg shadow-red-600/20 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Orden
        </Link>
      </div>

      {/* Controles de Filtro */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, patente o # de orden..." 
            className="w-full bg-white border border-neutral-200 text-neutral-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        
        {/* Pestañas de Estado */}
        <div className="flex bg-white border border-neutral-200 rounded-xl p-1 shadow-sm shrink-0 overflow-x-auto">
          {['Todas', 'Abiertas', 'Terminadas'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                filtroEstado === estado 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Órdenes */}
      {ordenesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="bg-neutral-100 p-4 rounded-full mb-4">
            <Filter className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No se encontraron órdenes</h3>
          <p className="text-neutral-500 max-w-sm mx-auto">
            Prueba cambiando los filtros de estado o la palabra clave de búsqueda.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Cabecera de la tabla (Solo en Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <div className="col-span-2">Orden / Fecha</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-4">Vehículo</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-1 text-right">Monto</div>
          </div>

          {/* Filas de la lista */}
          <div className="divide-y divide-neutral-100">
            {ordenesFiltradas.map(orden => (
              <Link 
                key={orden.id} 
                to={`/ordenes/${orden.id}`}
                className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 md:items-center hover:bg-neutral-50 transition-colors relative"
              >
                {/* Borde izquierdo rojo al hacer hover */}
                <div className="hidden md:block absolute left-0 top-0 w-1 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* 1. Orden y Fecha */}
                <div className="col-span-2 flex md:flex-col justify-between md:justify-start items-center md:items-start md:gap-1">
                  <span className="font-black text-neutral-900">{orden.id}</span>
                  <span className="text-xs font-medium text-neutral-500">{orden.fecha}</span>
                </div>
                
                {/* 2. Cliente */}
                <div className="col-span-3 font-semibold text-neutral-800">
                  {orden.cliente}
                </div>
                
                {/* 3. Vehículo */}
                <div className="col-span-4 text-sm text-neutral-600 flex items-center justify-between">
                  <span>{orden.vehiculo}</span>
                  {/* Flecha en mobile se muestra aquí en vez de al final */}
                  <ChevronRight className="w-5 h-5 text-neutral-300 md:hidden" />
                </div>
                
                {/* 4. Estado */}
                <div className="col-span-2 flex md:justify-center mt-2 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(orden.estado)}`}>
                    {orden.estado}
                  </span>
                </div>
                
                {/* 5. Total (y flecha en desktop) */}
                <div className="col-span-1 flex items-center justify-between md:justify-end mt-1 md:mt-0 text-sm font-bold text-neutral-900">
                  <span className="md:hidden text-neutral-500 text-xs uppercase tracking-wider">Total:</span>
                  <span>{orden.total}</span>
                  <ChevronRight className="hidden md:block w-5 h-5 text-neutral-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all ml-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
