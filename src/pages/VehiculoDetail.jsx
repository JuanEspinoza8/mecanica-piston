import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Palette, Hash, ClipboardList, Plus, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useVehiculo, useDeleteVehiculo } from '../hooks/useVehiculos';
import { useOrdenes } from '../hooks/useOrdenes';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehiculoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: vehiculo, isLoading, isError } = useVehiculo(id);
  const { mutateAsync: deleteVehiculo, isPending: isDeleting } = useDeleteVehiculo();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteVehiculo(id);
      toast.success('Vehículo eliminado correctamente');
      navigate('/vehiculos');
    } catch (error) {
      toast.error('Error al eliminar el vehículo');
    }
  };

  // Traer las órdenes reales del vehículo
  const { data: ordenesData = [], isLoading: isLoadingOrdenes } = useOrdenes(id);

  // Mapear los datos de BD al formato esperado por la UI
  const ordenes = ordenesData.map(orden => ({
    id: orden.id,
    displayId: `ORD-${orden.id.substring(0, 4).toUpperCase()}`,
    fecha: orden.fecha_ingreso ? format(new Date(orden.fecha_ingreso), 'dd/MM/yyyy') : '-',
    estado: orden.estado,
    total: `$${(orden.totalRepuestos || 0).toLocaleString('es-AR')}`
  }));

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'En proceso': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-neutral-400" /></div>;
  }
  
  if (isError || !vehiculo) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Vehículo no encontrado</h2>
        <Link to="/vehiculos" className="text-red-500 hover:underline">Volver a la lista</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/vehiculos" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Perfil del Vehículo</h1>
        </div>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          title="Eliminar Vehículo"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tarjeta Principal del Vehículo */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neutral-900/5 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          
          <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-2xl shrink-0 text-center z-10 relative">
            <CarFront className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
            <div className="inline-block bg-black dark:bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-md tracking-widest shadow-sm">
              {vehiculo.patente}
            </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full z-10 relative">
            <div>
              <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{vehiculo.marca} {vehiculo.modelo}</h2>
              {vehiculo.cliente && (
                <Link to={`/clientes/${vehiculo.cliente.id}`} className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mt-1">
                  <User className="w-4 h-4 mr-1" /> Propiedad de {vehiculo.cliente.nombre} {vehiculo.cliente.apellido || ''}
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <div>
                <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Año</p>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">{vehiculo.año}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Historial de Órdenes */}
      <div>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
            Historial de Reparaciones
          </h3>
          <Link to="/ordenes/nueva" className="text-sm font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4 mr-1" /> Nueva Orden
          </Link>
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Este vehículo aún no tiene historial en el taller.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ordenes.map(orden => (
                <Link key={orden.id} to={`/ordenes/${orden.id}`} className="group flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 text-center min-w-[80px]">
                      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">{orden.fecha !== '-' ? orden.fecha.split('/')[1] : '-'}</p>
                      <p className="text-lg font-black text-neutral-900 dark:text-white">{orden.fecha !== '-' ? orden.fecha.split('/')[0] : '-'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-red-500 transition-colors">{orden.displayId}</h4>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold border uppercase ${getEstadoBadge(orden.estado)}`}>
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900 dark:text-white">{orden.total}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        titulo="Eliminar Vehículo"
        mensaje={`¿Estás seguro que querés eliminar el vehículo ${vehiculo.patente}? Esta acción no se puede deshacer y borrará todo su historial.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
