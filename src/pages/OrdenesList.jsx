import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, LayoutList, LayoutGrid, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useOrdenes, useUpdateOrden } from '../hooks/useOrdenes';
import { format } from 'date-fns';

export default function OrdenesList() {
  const { data: ordenesData = [], isLoading } = useOrdenes();
  const { mutateAsync: updateOrden } = useUpdateOrden();

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [vista, setVista] = useState('lista'); // 'lista' o 'tablero'
  
  // Estado para saber qué elemento se está arrastrando
  const [draggedItem, setDraggedItem] = useState(null);

  const ordenes = ordenesData.map(orden => ({
    id: orden.id,
    displayId: `ORD-${orden.id.substring(0, 4).toUpperCase()}`,
    cliente: orden.cliente ? `${orden.cliente.nombre} ${orden.cliente.apellido || ''}` : 'Desconocido',
    vehiculo: orden.vehiculo ? `${orden.vehiculo.marca} ${orden.vehiculo.modelo} (${orden.vehiculo.patente})` : 'Desconocido',
    estado: orden.estado,
    fecha: orden.fecha_ingreso ? format(new Date(orden.fecha_ingreso), 'dd/MM/yyyy') : '',
    total: `$${(orden.totalRepuestos || 0).toLocaleString('es-AR')}`,
  }));

  const ordenesFiltradas = ordenes.filter(orden => {
    const coincideTexto = 
      orden.cliente.toLowerCase().includes(filtroTexto.toLowerCase()) || 
      orden.vehiculo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      orden.displayId.toLowerCase().includes(filtroTexto.toLowerCase());

    let coincideEstado = true;
    if (filtroEstado === 'Abiertas') {
      coincideEstado = orden.estado !== 'Terminado' && orden.estado !== 'Entregado';
    } else if (filtroEstado === 'Terminadas') {
      coincideEstado = orden.estado === 'Terminado' || orden.estado === 'Entregado';
    }

    return coincideTexto && coincideEstado;
  });

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Terminado':
      case 'Entregado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'En proceso': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Esperando repuesto': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'Terminado':
      case 'Entregado': return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'En proceso': return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Esperando repuesto': return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default: return null;
    }
  };

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e, ordenId) => {
    setDraggedItem(ordenId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    if (!draggedItem) return;

    try {
      await updateOrden({ id: draggedItem, estado: nuevoEstado });
    } catch (error) {
      console.error("Error updating order state:", error);
    }
    setDraggedItem(null);
  };

  const columnasKanban = [
    { id: 'Pendiente', titulo: 'Pendiente' },
    { id: 'En proceso', titulo: 'En Proceso' },
    { id: 'Esperando repuesto', titulo: 'Esperando Repuesto' },
    { id: 'Terminado', titulo: 'Terminado' }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Cargando órdenes de trabajo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Órdenes de Trabajo</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Historial y seguimiento de reparaciones.</p>
        </div>
        
        <Link 
          to="/ordenes/nueva" 
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-lg shadow-red-600/20 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Orden
        </Link>
      </div>

      {/* Barra de Controles */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-red-500" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, patente o #..." 
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-all shadow-sm"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-sm overflow-x-auto">
            {['Todas', 'Abiertas', 'Terminadas'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                  filtroEstado === estado 
                    ? 'bg-black dark:bg-red-600 text-white shadow-md' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>

          <div className="flex bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => setVista('lista')}
              className={`p-2 rounded-lg transition-all ${vista === 'lista' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
              title="Vista Lista"
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVista('tablero')}
              className={`p-2 rounded-lg transition-all ${vista === 'tablero' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
              title="Vista Tablero"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {ordenesFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
            <Filter className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No se encontraron órdenes</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Prueba cambiando los filtros de estado o la palabra clave de búsqueda.
          </p>
        </div>
      ) : vista === 'lista' ? (
        
        /* --- VISTA DE LISTA TRADICIONAL --- */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <div className="col-span-2">Orden / Fecha</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-4">Vehículo</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-1 text-right">Monto</div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {ordenesFiltradas.map(orden => (
              <Link 
                key={orden.id} 
                to={`/ordenes/${orden.id}`}
                className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 md:items-center hover:bg-neutral-50 dark:hover:bg-red-950/10 transition-colors relative"
              >
                <div className="hidden md:block absolute left-0 top-0 w-1 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="col-span-2 flex md:flex-col justify-between md:justify-start items-center md:items-start md:gap-1">
                  <span className="font-black text-neutral-900 dark:text-white">{orden.displayId}</span>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{orden.fecha}</span>
                </div>
                
                <div className="col-span-3 font-semibold text-neutral-800 dark:text-neutral-200">
                  {orden.cliente}
                </div>
                
                <div className="col-span-4 text-sm text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                  <span>{orden.vehiculo}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 md:hidden" />
                </div>
                
                <div className="col-span-2 flex md:justify-center mt-2 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(orden.estado)}`}>
                    {orden.estado}
                  </span>
                </div>
                
                <div className="col-span-1 flex items-center justify-between md:justify-end mt-1 md:mt-0 text-sm font-bold text-neutral-900 dark:text-white">
                  <span className="md:hidden text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">Total:</span>
                  <span>{orden.total}</span>
                  <ChevronRight className="hidden md:block w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-red-500 transition-all ml-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      ) : (

        /* --- VISTA DE TABLERO KANBAN --- */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
          {columnasKanban.map(col => {
            const ordenesColumna = ordenesFiltradas.filter(o => o.estado === col.id);
            
            return (
              <div 
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="bg-neutral-100/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 flex flex-col h-full min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    {getEstadoIcon(col.id)}
                    <h3 className="font-bold text-neutral-900 dark:text-white">{col.titulo}</h3>
                  </div>
                  <span className="bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700">
                    {ordenesColumna.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {ordenesColumna.map(orden => (
                    <div
                      key={orden.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, orden.id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-900 transition-all cursor-grab active:cursor-grabbing relative group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link to={`/ordenes/${orden.id}`} className="font-black text-neutral-900 dark:text-white hover:text-red-600 transition-colors">
                          {orden.displayId}
                        </Link>
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                          {orden.fecha}
                        </span>
                      </div>
                      
                      <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">{orden.cliente}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{orden.vehiculo}</p>
                      
                      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getEstadoColor(orden.estado)}`}>
                          {orden.estado}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm">{orden.total}</span>
                      </div>
                    </div>
                  ))}
                  
                  {ordenesColumna.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                      Arrastra una orden aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      )}

    </div>
  );
}
