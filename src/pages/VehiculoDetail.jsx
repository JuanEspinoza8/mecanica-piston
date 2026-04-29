import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Palette, Hash, ClipboardList, Plus, ChevronRight } from 'lucide-react';

export default function VehiculoDetail() {
  const { id } = useParams();

  // Mock data del vehículo
  const vehiculo = {
    id: id || '101',
    patente: 'AB 123 CD',
    marca: 'Ford',
    modelo: 'Fiesta Titanium',
    año: 2018,
    color: 'Blanco',
    cliente: { id: 1, nombre: 'Juan Pérez' },
  };

  // Mock data de órdenes asociadas a este vehículo
  const ordenes = [
    { id: 'ORD-001', fecha: '28/04/2026', estado: 'En proceso', total: '$15.000' },
    { id: 'ORD-009', fecha: '10/01/2026', estado: 'Terminado', total: '$45.000' },
  ];

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 text-green-700 border-green-200';
      case 'En proceso': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/vehiculos" className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Perfil del Vehículo</h1>
        </div>
      </div>

      {/* Tarjeta Principal del Vehículo */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neutral-900/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          
          <div className="bg-neutral-100 p-6 rounded-2xl shrink-0 text-center">
            <CarFront className="w-16 h-16 text-neutral-400 mx-auto mb-2" />
            <div className="inline-block bg-black text-white text-sm font-bold px-3 py-1 rounded-md tracking-widest shadow-sm">
              {vehiculo.patente}
            </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div>
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{vehiculo.marca} {vehiculo.modelo}</h2>
              <Link to={`/clientes/${vehiculo.cliente.id}`} className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mt-1">
                <User className="w-4 h-4 mr-1" /> Propiedad de {vehiculo.cliente.nombre}
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Año</p>
                <p className="font-bold text-neutral-800">{vehiculo.año}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Color</p>
                <p className="font-bold text-neutral-800 flex items-center">
                  {vehiculo.color}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Historial de Órdenes */}
      <div>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-neutral-900 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-neutral-500" />
            Historial de Reparaciones
          </h3>
          <Link to="/ordenes/nueva" className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center bg-red-50 px-3 py-1.5 rounded-lg">
            <Plus className="w-4 h-4 mr-1" /> Nueva Orden
          </Link>
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
            <p className="text-neutral-500 font-medium">Este vehículo aún no tiene historial en el taller.</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-neutral-100">
              {ordenes.map(orden => (
                <Link key={orden.id} to={`/ordenes/${orden.id}`} className="group flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-100 rounded-lg p-3 text-center min-w-[80px]">
                      <p className="text-xs font-bold text-neutral-500 uppercase">{orden.fecha.split('/')[1]}</p>
                      <p className="text-lg font-black text-neutral-900">{orden.fecha.split('/')[0]}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900">{orden.id}</h4>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold border uppercase ${getEstadoBadge(orden.estado)}`}>
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900">{orden.total}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
