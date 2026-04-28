import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Wrench, Settings, PackageOpen, Plus, Camera, DollarSign } from 'lucide-react';

export default function OrdenDetail() {
  const { id } = useParams();

  // Mock data para la orden de trabajo
  const orden = {
    id: id || 'ORD-001',
    estado: 'En proceso',
    fechaIngreso: '28/04/2026',
    fechaEstimada: '30/04/2026',
    cliente: { id: 1, nombre: 'Juan Pérez', telefono: '+54 11 1234-5678' },
    vehiculo: { id: 101, marca: 'Ford', modelo: 'Fiesta', patente: 'AB 123 CD', año: 2018 },
    sintoma: 'El auto hace un ruido metálico al frenar y vibra el volante.',
    tareas: [
      { id: 1, descripcion: 'Revisión completa del tren delantero', estado: 'Terminado' },
      { id: 2, descripcion: 'Cambio de pastillas de freno', estado: 'En proceso' },
      { id: 3, descripcion: 'Rectificación de discos', estado: 'Pendiente' }
    ],
    repuestos: [
      { id: 1, nombre: 'Juego Pastillas de Freno Motorcraft', cantidad: 1, precio: 45000 },
      { id: 2, nombre: 'Líquido de frenos DOT 4', cantidad: 1, precio: 8500 }
    ],
    fotos: [] // Simular que no hay fotos subidas aún
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 text-green-700 border-green-200';
      case 'En proceso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pendiente': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const totalRepuestos = orden.repuestos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera de Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/ordenes" className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">{orden.id}</h1>
            <div className="flex items-center mt-1">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getEstadoBadge(orden.estado)}`}>
                {orden.estado}
              </span>
            </div>
          </div>
        </div>
        
        <button className="flex items-center justify-center text-sm font-semibold text-white bg-black hover:bg-neutral-900 px-6 py-2.5 rounded-full transition-colors shadow-lg">
          <Settings className="w-4 h-4 mr-2" />
          Editar Orden
        </button>
      </div>

      {/* Grid Superior: Info de Cliente y Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta Cliente */}
        <Link to={`/clientes/${orden.cliente.id}`} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:border-red-300 hover:shadow-md transition-all group">
          <div className="flex items-center mb-2 text-neutral-500 text-sm font-semibold uppercase tracking-wider">
            <User className="w-4 h-4 mr-2" /> Cliente
          </div>
          <p className="text-xl font-bold text-neutral-900 group-hover:text-red-600 transition-colors">{orden.cliente.nombre}</p>
          <p className="text-neutral-500">{orden.cliente.telefono}</p>
        </Link>
        
        {/* Tarjeta Vehículo */}
        <Link to={`/vehiculos/${orden.vehiculo.id}`} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:border-red-300 hover:shadow-md transition-all group">
          <div className="flex items-center mb-2 text-neutral-500 text-sm font-semibold uppercase tracking-wider">
            <CarFront className="w-4 h-4 mr-2" /> Vehículo
          </div>
          <p className="text-xl font-bold text-neutral-900 group-hover:text-red-600 transition-colors">
            {orden.vehiculo.marca} {orden.vehiculo.modelo}
          </p>
          <div className="inline-block bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 tracking-widest">
            {orden.vehiculo.patente}
          </div>
        </Link>
      </div>

      {/* Grid Principal: Tareas y Repuestos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (Tareas y Síntoma) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Síntoma Reportado */}
          <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
            <div className="flex items-center mb-2 text-red-800 text-sm font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 mr-2" /> Motivo de Ingreso
            </div>
            <p className="text-neutral-700 italic">"{orden.sintoma}"</p>
          </div>

          {/* Lista de Tareas */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-neutral-500" /> Tareas a Realizar
              </h2>
              <button className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Agregar Tarea
              </button>
            </div>
            <div className="divide-y divide-neutral-100">
              {orden.tareas.map(tarea => (
                <div key={tarea.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <span className={`font-medium ${tarea.estado === 'Terminado' ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                    {tarea.descripcion}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getEstadoBadge(tarea.estado)}`}>
                    {tarea.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Galería de Fotos (Estado Vacío) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center mb-4">
              <Camera className="w-5 h-5 mr-2 text-neutral-500" /> Evidencia Fotográfica
            </h2>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-red-600 group">
              <Camera className="w-10 h-10 mb-2 text-neutral-400 group-hover:text-red-500 transition-colors" />
              <p className="font-medium text-center">Haz clic para subir fotos o presupuestos</p>
              <p className="text-xs text-neutral-400 mt-1">Soporta JPG y PNG</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Repuestos y Costos) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center">
                <PackageOpen className="w-5 h-5 mr-2 text-neutral-500" /> Repuestos
              </h2>
            </div>
            
            <div className="flex-1 p-5 space-y-4">
              {orden.repuestos.map(rep => (
                <div key={rep.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-neutral-800 text-sm">{rep.nombre}</p>
                    <p className="text-xs text-neutral-500">Cant: {rep.cantidad} x ${rep.precio.toLocaleString('es-AR')}</p>
                  </div>
                  <p className="font-bold text-neutral-900 text-sm">
                    ${(rep.cantidad * rep.precio).toLocaleString('es-AR')}
                  </p>
                </div>
              ))}
              <button className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-lg text-sm font-semibold text-neutral-500 hover:text-black hover:border-black transition-colors flex items-center justify-center mt-4">
                <Plus className="w-4 h-4 mr-1" /> Añadir Repuesto
              </button>
            </div>

            {/* Total */}
            <div className="p-5 bg-black text-white mt-auto">
              <div className="flex justify-between items-center mb-1">
                <span className="text-neutral-400 text-sm">Total Repuestos</span>
                <span className="font-bold">${totalRepuestos.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-neutral-400 text-sm">Mano de Obra</span>
                <span className="font-bold text-neutral-400 italic">A definir</span>
              </div>
              <div className="border-t border-neutral-800 pt-3 flex justify-between items-center">
                <span className="font-black text-lg">Total Estimado</span>
                <span className="font-black text-2xl text-red-500 flex items-center">
                  ${totalRepuestos.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
